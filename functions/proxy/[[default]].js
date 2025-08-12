// functions/proxy.js
export async function onRequest({ request, waitUntil }) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
        // 验证 targetUrl 是否是合法的 URL
        new URL(targetUrl);
    } catch (error) {
        return new Response('Invalid "url" parameter', { status: 400 });
    }

    // 从原始请求创建 Headers 对象
    const headers = new Headers(request.headers);

    // 删除 Host 头 (推荐)
    headers.delete('host');

    // === 转发请求头中的 Cookie  ===

    // 安全警告： 这是潜在的安全风险！ 仅在你信任客户端或已采取其他安全措施时才使用此方法。
    // 如果要完全不转发Cookie，请使用 headers.delete('cookie');  并且将上面几行注释掉

    // === 其他请求头的处理  ===
    // 你可以在这里添加或修改其他请求头
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');


    try {
        const response = await fetch(targetUrl, {
            headers: headers, // 使用原始headers (包括cookie)
        });

        if (!response.ok) {
            return new Response(response.statusText, { status: response.status });
        }

        // 复制响应头并设置 CORS
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', '*');

        // 设置缓存头
        newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        newHeaders.set('Pragma', 'no-cache');
        newHeaders.set('Expires', '0');

        const proxyResponse = new Response(response.body, {
            status: response.status,
            headers: newHeaders,
        });
      waitUntil(Promise.resolve(proxyResponse));
        return proxyResponse;

    } catch (error) {
        console.error("Proxy error:", error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
}
