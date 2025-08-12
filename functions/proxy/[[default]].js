// functions/proxy.js
export async function onRequest({ request， waitUntil }) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const cookie = url.searchParams.get('cookie');

    if (!targetUrl) {
        return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
        // 验证 targetUrl 是否是合法的 URL (重要!)
        new URL(targetUrl); // 如果不是有效的 URL, 会抛出错误
    } catch (error) {
        return new Response('Invalid "url" parameter', { status: 400 });
    }

    const headers = new Headers();

    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    //  安全警告：避免直接设置 Cookie!  这会造成安全漏洞！
    //  更好的方法是：只传递认证令牌，并在服务器端安全地处理 Cookie。
    if (cookie) {
        headers。set('cookie'， cookie);  //  更正拼写错误
    }


    try {
        const response = await fetch(targetUrl, {
            headers: headers，  // 传递请求头
        });

        if (!response.ok) {
            // 代理错误状态码
            return new Response(response。statusText， { status: response。status });
        }

        // 克隆响应头
        const newHeaders = new Headers(response.headers);   //复制原始header
        newHeaders.set('Access-Control-Allow-Origin', '*'); // 设置 CORS
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', '*');

        //设置缓存 header
        newHeaders。set('Cache-Control'， 'no-store, no-cache, must-revalidate, proxy-revalidate');
        newHeaders。set('Pragma'， 'no-cache');
        newHeaders。set('Expires'， '0');

        // 返回代理的响应
        const proxyResponse = new Response(response。body， {
            status: response.status,
            headers: newHeaders，
        });
        waitUntil(Promise.resolve(proxyResponse));
        return proxyResponse;

    } catch (error) {
        console.error("Proxy error:", error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });  // 捕捉并返回代理错误
    }
}
