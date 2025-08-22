/**
 * EdgeOne Pages 反向代理 - 增强版 (URL 参数传递目标地址)
 */
export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const targetUrlParam = url.searchParams.get('url');

  if (!targetUrlParam) {
    return new Response("Missing 'url' parameter.", { status: 400 });
  }

  try {
    const originUrl = new URL(targetUrlParam);
    //  验证 targetUrlParam  (白名单)  - 示例
    const allowedDomains = ['www.pandalive.co.kr', 'www.twitch.tv', 'www.ttinglive.com'];
    if (!allowedDomains.includes(originUrl.hostname)) {
      return new Response("Invalid target URL domain.", { status: 403 });
    }

    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (!['host', 'cf-connecting-ip', 'cf-ray', 'x-forwarded-for'].includes(key.toLowerCase())) {
        try {
          headers.set(key, value);
        } catch (e) {
          console.warn(`Failed to set header ${key}: ${e.message}`);
        }
      }
    }

    headers.set('Host', originUrl.host);

    const name = url.searchParams.get('name');
    if (name === 'pandalive') {
      headers.set('Origin', 'https://www.pandalive.co.kr');
    } else if (name === 'twitch') {
      headers.set('Origin', 'https://www.twitch.tv');
      headers.set('referer', 'https://www.twitch.tv/');
    } else if (name === 'ttinglive') {
      headers.set('Origin', 'https://www.ttinglive.com');
      headers.set('referer', 'https://www.ttinglive.com/');
    }

    if (request.headers.get('cookie')) {
      console.log(`Forwarding Cookie to ${originUrl.host}`);
    }

    const requestInit = {
      method: request.method,
      headers: headers,
      redirect: 'follow',
    };

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        requestInit.body = await request.clone().text();
      } catch (e) {
        console.error(`Failed to read request body: ${e.message}`);
        return new Response("Failed to read request body", { status: 400 });
      }
    }

    console.log(`Proxying request to: ${targetUrlParam}`);
    const response = await fetch(targetUrlParam, requestInit);
    console.log(`Origin response status: ${response.status} ${response.statusText}`);

    const responseHeaders = new Headers();
    const setCookieHeaders = [];

    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      } else if (key.toLowerCase() === 'content-encoding') {
        continue; // Skip content-encoding header
      } else {
        try {
          responseHeaders.set(key, value);
        } catch (e) {
          console.warn(`Skipping response header ${key}: ${e.message}`);
        }
      }
    }

    setCookieHeaders.forEach(cookie => {
      responseHeaders.append('Set-Cookie', cookie);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*'); // SHOULD BE LIMITED FOR PRODUCTION
    responseHeaders.set('Access-Control-Allow-Methods', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }

    const data = await response.arrayBuffer();

    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

  } catch (err) {
    console.error(`Proxy request failed: ${err.message}\n${err.stack}`);
    return new Response(
      `<!DOCTYPE html>...`, // Your Error HTML
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      }
    );
  }
}

async function handleEvent(event) {
  const { request } = event;
  const accept = request.headers.get('Accept');
  const option = { eo: { image: {} } };

  try {
      if (accept && accept.includes('image/webp')) {
        if (option.eo && option.eo.image) { // 确保option.eo.image存在
            option.eo.image.format = 'webp';
        } else {
          console.warn("option.eo or option.eo.image is undefined");
        }

      }
      const response = await fetch(request, option);
      return response;
  } catch (error) {
      console.error("Image optimization failed:", error);
      return fetch(request); // 返回原始请求
  }


}

addEventListener('fetch', event => {
  event.passThroughOnException();
  event.respondWith(handleEvent(event));
});
