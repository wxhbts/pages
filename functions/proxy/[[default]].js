export async function onRequest({ request, waitUntil }) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
      new URL(targetUrl);
    } catch (error) {
      return new Response('Invalid "url" parameter', { status: 400 });
    }

    // 创建一个新的 Headers 对象，只包含原始 Cookie header
    const fetchHeaders = new Headers();
    const cookie = request.headers.get('cookie');
    if (cookie) {
      fetchHeaders.set('cookie', cookie);
    }

    // **调试：输出 Cookie**
    console.log("Passing Cookie:", fetchHeaders.get('cookie'));

    const fetchOptions = {
      method: request.method,
      headers: fetchHeaders, // 只传递 Cookie header
      redirect: 'manual',
    };

    if (request.method !== 'GET') {
      if (request.body) {
        fetchOptions.body = request.body;
      } else {
        delete fetchOptions.body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) {
        return new Response(null, {
          status: response.status,
          headers: {
            'location': location
          },
        });
      } else {
        return new Response("Redirection without location header", { status: 500 });
      }
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    const body = await response.arrayBuffer();

    const proxyResponse = new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });

    waitUntil(Promise.resolve(proxyResponse));

    return proxyResponse;

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
