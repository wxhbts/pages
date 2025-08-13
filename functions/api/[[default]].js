export async function onRequest(context) {
    const { request } = context;

    try {
        const requestUrl = new URL(request.url);
        const targetUrlParam = requestUrl.searchParams.get('url');

        if (!targetUrlParam) {
            return new Response("Query parameter 'url' is missing.", { status: 400 });
        }

        const actualUrlStr = targetUrlParam;

        // Forward all headers from the original request.
        const newHeaders = new Headers(request.headers);

        const modifiedRequest = new Request(actualUrlStr, {
            headers: newHeaders,
            method: request.method,
            body: request.body,
            redirect: 'manual'
        });

        const response = await fetch(modifiedRequest);

        const finalHeaders = new Headers(response.headers);
        // Enable CORS
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
        return new Response(`Proxy Error: ${error.message}`, { status: 500 });
    }
}
