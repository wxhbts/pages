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

    // 创建一个空的 Headers 对象 (不复制原始请求头)
    const headers = new Headers();

    // 设置必要的请求头 (例如 User-Agent)
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');  // 可选，但通常推荐

    // 处理 POST 请求的 body
    let body = null;
    if (request.method === "POST") {
        body = await request.blob(); // 或者使用 request.text() 或 request.arrayBuffer()，根据内容类型选择
    }

    try {
        const response = await fetch(targetUrl, {
            method: request.method, // 转发原始请求方法
            headers: headers,       // 使用 *新的*  Headers 对象 (不包含原始请求头)
            body: body,             // 转发 body (如果存在)
        });

        if (!response.ok) {
            return new Response(response.statusText, { status: response.status });
        }

        // 复制响应头并设置 CORS
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', '*');

        // 设置缓存头 (根据你的需求)
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
