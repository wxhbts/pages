/**
 * EdgeOne Pages 反向代理 - 增强版 (URL 参数传递目标地址)
 * 修复白屏和资源加载问题
 * 移除HTML, JS, CSS处理
 */

export async function onRequest(context) {
  // 获取请求信息
  const request = context.request;
  const url = new URL(request.url);

  // 获取目标 URL 参数
  const targetUrlParam = url.searchParams.get('url');

  if (!targetUrlParam) {
    return new Response("Missing 'target' URL parameter.", { status: 400 });
  }

  try {
    // 开始处理请求
    console.log(`代理请求 ${request.method} ${url.pathname}`);

    // 创建发往源站的请求头
    const headers = new Headers();
   
    // 转发原始请求头
    for (const [key, value] of request.headers.entries()) {
      // 排除一些特定的头
      if (!['host', 'cf-connecting-ip', 'cf-ray', 'x-forwarded-for'].includes(key.toLowerCase())) {
        try {
          headers.set(key, value);
        } catch (e) {
          console.error(`无法设置请求头 ${key}: ${e.message}`);
        }
      }
    }

    // 设置必要的请求头 (可选，如果需要覆盖目标站点的 Host)
    const originUrl = new URL(targetUrlParam);
    headers.set('Host', originUrl.host);
     if (url.searchParams.get('name') === 'pandalive') {
      headers.set('Origin', 'https://www.pandalive.co.kr');
    }
    if (url.searchParams.get('name') === 'twitch') {
      headers.set('Origin', 'https://www.twitch.tv');
      headers.set('referer', 'https://www.twitch.tv/');
    }
    if (url.searchParams.get('name') === 'ttinglive') {
      headers.set('Origin', 'https://www.ttinglive.com');
      headers.set('referer', 'https://www.ttinglive.com/');
    }
    // headers.set('Origin', originUrl.origin); // 如果需要设置 Origin，请取消注释

    // 判断是否有Cookie，并打印日志
    const cookies = request.headers.get('cookie');
    if (cookies) {
      console.log(`转发Cookie: ${cookies.substring(0, 100)}...`);
    }

    // 创建请求选项
    const requestInit = {
      method: request.method,
      headers: headers,
      redirect: 'follow',
    };

    // 处理POST/PUT请求体
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const contentType = request.headers.get('content-type');
        const bodyText = await request.clone().text();
        requestInit.body = bodyText;
        console.log(`请求体类型: ${contentType}, 长度: ${bodyText.length}`);
      } catch (e) {
        console.error(`无法读取请求体: ${e.message}`);
      }
    }

    // 发送请求
    console.log(`请求源站: ${targetUrlParam}`);
    const response = await fetch(targetUrlParam, requestInit);
    console.log(`源站响应状态: ${response.status} ${response.statusText}`);

    // 创建响应头
    const responseHeaders = new Headers();

    // 收集Set-Cookie头部
    const setCookieHeaders = [];

    // 处理响应头
    for (const [key, value] of response.headers.entries()) {
      // 特殊处理set-cookie头部
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      } else if (key.toLowerCase() === 'content-encoding') {
        // 跳过content-encoding，让响应以解压缩状态传输
        console.log(`跳过压缩头 ${key}=${value}`);
        continue;
      } else {
        try {
          responseHeaders.set(key, value);
        } catch (e) {
          console.log(`跳过响应头 ${key}: ${e.message}`);
        }
      }
    }

    // 重新添加所有Cookie
    if (setCookieHeaders.length > 0) {
      console.log(`返回${setCookieHeaders.length}个Cookie`);
      setCookieHeaders.forEach(cookie => {
        responseHeaders.append('Set-Cookie', cookie);
      });
    }

    // 处理CORS头
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    // OPTIONS请求特殊处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }

    // 获取响应内容类型
    const contentType = response.headers.get('content-type') || '';
    console.log(`响应内容类型: ${contentType}`);

    const data = await response.arrayBuffer();
    console.log(`响应大小: ${data.byteLength} 字节`);

    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

  } catch (err) {
    console.error(`代理请求失败: ${err.message}`);
    console.error(err.stack);

    // 返回错误信息
    return new Response(
      `<!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <title>代理请求失败</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
          .error { background: #fff0f0; border: 1px solid #ffccc7; padding: 1rem; border-radius: 4px; }
          .details { margin-top: 1rem; background: #f5f5f5; padding: 1rem; border-radius: 4px; }
          code { font-family: monospace; background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>代理请求失败</h1>
        <div class="error">
          <p><strong>错误信息:</strong> ${err.message}</p>
        </div>
        <div class="details">
          <p><strong>请求路径:</strong> <code>${url.pathname}</code></p>
          <p><strong>目标URL:</strong> <code>${targetUrlParam}</code></p>
          <p><strong>请求方法:</strong> ${request.method}</p>
          <p><strong>时间:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>请刷新页面重试，或联系管理员。</p>
      </body>
      </html>`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        }
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
