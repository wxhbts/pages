// pages/api/proxy.js

export default async function handler(req, res) {
  try {
    const { pathname, query } = new URL(req.url, `http://${req.headers.host}`);  // 使用 req.headers.host
    const targetUrl = decodeURIComponent(pathname.substring(1)); // 从路径提取目标 URL

    if (!targetUrl) {
      return res.status(400).send('Missing target URL');
    }

    try {
      new URL(targetUrl); // 验证 URL
    } catch (error) {
      return res.status(400).send('Invalid target URL');
    }

    const fetchOptions = {
      method: req.method,  // 使用原始请求方法
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      redirect: 'manual' // 禁止自动重定向，方便处理
    };

    if (req.method !== 'GET') {  // 处理 POST 等请求的 body
      fetchOptions.body = req.body;  // 传递 body
    }

    const response = await fetch(targetUrl, fetchOptions);


    // 处理重定向
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      const modifiedLocation = `/api/proxy/${encodeURIComponent(location)}`; // 指向代理的重定向URL
      res.writeHead(response.status, { 'Location': modifiedLocation }); // 设置Location Header
      return res.end(); // 结束响应
    }

    let body = await response.arrayBuffer();
    let contentType = response.headers.get('Content-Type');

    // 修改HTML内容 (如果需要)  重要:  更准确的内容类型检查
    if (contentType && contentType.includes('text/html')) {
      const decoder = new TextDecoder();
      let originalText = decoder.decode(body);
      const baseUrl = new URL(targetUrl).origin;

      // 替换相对路径
      const regex = new RegExp('((href|src|action)=["\'])/(?!/)', 'g');
      let modifiedText = originalText.replace(regex, `$1${baseUrl}/`);  // 使用 baseUrl
      body = new TextEncoder().encode(modifiedText);
    }

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'no-store'  // 禁用缓存
    };

    // 设置 Content-Type header
    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    res.writeHead(response.status, headers);
    res.end(Buffer.from(body));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
