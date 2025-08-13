export async function onRequest(context) {
    const { request } = context;

    try {
        const requestUrl = new URL(request.url);
        const targetUrlParam = requestUrl.searchParams.get('url');

        if (!targetUrlParam) {
            console.error("Missing 'url' parameter."); // 添加日志
            return new Response("Query parameter 'url' is missing.", { status: 400 });
        }

        const actualUrlStr = targetUrlParam;
        console.log(`Fetching: ${actualUrlStr}`); // 添加日志

        const newHeaders = new Headers(request.headers);

        const modifiedRequest = new Request(actualUrlStr, {
            headers: newHeaders,
            method: request.method,
            body: request.body,
            redirect: 'manual'
        });

        const response = await fetch(modifiedRequest);

        const finalHeaders = new Headers(response.headers);
        finalHeaders.set('Access-Control-Allow-Origin', '*');
        finalHeaders.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        finalHeaders.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        finalHeaders.set('Access-Control-Allow-Credentials', 'true');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: finalHeaders
        });

    } catch (error) {
        console.error(`Proxy Error: ${error.message}`); // 添加日志
        return new Response(`Proxy Error: ${error.message}`, { status: 500 });
    }
}
