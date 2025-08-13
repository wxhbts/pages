export async function onRequest({ request, waitUntil }) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
      new URL(targetUrl); // 验证 URL
    } catch (error) {
      return new Response('Invalid "url" parameter', { status: 400 });
    }

    // 复制请求头，但排除 'host' 和 'content-length' (EdgeOne 会自动处理)
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('content-length'); // 避免潜在的问题

    const fetchOptions = {
      method: request.method,
      headers: headers, // 使用复制的 Headers 对象
      redirect: 'manual', // 不要自动重定向，手动处理
    };

    if (request.method !== 'GET') {
        // 复制 body

        if (request.body) {
            fetchOptions.body = request.body;
        } else {
            // 如果 request.body 为空 (例如，GET 或 HEAD 请求)，不设置 body
            delete fetchOptions.body;
        }
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 处理重定向 (可选，但强烈建议)
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location) {
        // 修改 Location header (可选：根据你的需要)

        return new Response(null, {
          status: response.status,
          headers: {
            'location': location
          },
        });
      } else {
        // 如果没有 location header,  返回一个错误
        return new Response("Redirection without location header", { status: 500 });
      }
    }

    // 复制 Response headers
    const responseHeaders = new Headers(response.headers);

    // 设置CORS headers (根据你的需要)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    const body  = await response.arrayBuffer();

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
