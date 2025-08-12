// functions/proxy.js
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing "url" parameter', { status: 400 });
  }

  try {
    // 验证 targetUrl 是否是合法的 URL (重要!)
    new URL(targetUrl); // 如果不是有效的 URL, 会抛出错误
  } catch (error) {
    return new Response('Invalid "url" parameter', { status: 400 });
  }

	  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {

      return new Response(response.statusText, { status: response.status });
    }
    const newHeaders = new Headers(response.headers);   //复制原始header
    newHeaders.set('Access-Control-Allow-Origin', '*'); // 设置 CORS
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');

	  //设置缓存 header
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    newHeaders.set('Pragma', 'no-cache');
    newHeaders.set('Expires', '0');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });  // 捕捉并返回代理错误
  }
}
