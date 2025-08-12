// functions/proxy.js
export async function onRequest({ request, waitUntil }) {
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

  // 创建一个包含原始Headers的对象
  const headers = new Headers(request.headers);

  // 打印原始请求头
  console.log("原始Headers:", Object.fromEntries(headers.entries()));  // 使用 Object.fromEntries 转换为对象以便更好地查看

  // 删除 Host 头 (通常不需要代理)
  headers.delete('host');

  try {
    const response = await fetch(targetUrl, {
      headers: headers,  // 传递请求头
    });

    if (!response.ok) {
      // 代理错误状态码
      return new Response(response.statusText, { status: response.status });
    }

    // 克隆响应头
    const newHeaders = new Headers(response.headers);   //复制原始header
    newHeaders.set('Access-Control-Allow-Origin', '*'); // 设置 CORS
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');

    //设置缓存 header
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    newHeaders.set('Pragma', 'no-cache');
    newHeaders.set('Expires', '0');

    // 返回代理的响应
    const proxyResponse = new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
      waitUntil(Promise.resolve(proxyResponse));
    return proxyResponse;



  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });  // 捕捉并返回代理错误
  }
}
