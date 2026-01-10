export default {
  async fetch(request, env, ctx) {
    // 处理请求的函数体
    return handleRequest(request)
  }
}

async function handleRequest(request) {
  const urlObj = new URL(request.url)
  const targetUrl = urlObj.searchParams.get('url')

  // 1. 检查目标 URL
  if (!targetUrl) {
    return new Response('"url" 参数缺失 (请在 URL 参数中指定目标地址)', { status: 400 })
  }

  // 2. 处理 Headers
  const newHeaders = new Headers(request.headers)
  
  // 必须删除 Host Header，以便目标服务器接收到正确的 Host
  newHeaders.delete('Host')
  

  // 3. 构建透传请求
  const requestOptions = {
    method: request.method,
    headers: newHeaders,
    redirect: 'follow',
  }

  // 只有非 GET/HEAD 请求才需要传递 Body
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // 在某些边缘运行时，直接传递 request.body 可能需要配置 duplex: 'half'
    // 但 EdgeOne 环境通常能自动处理，直接赋值即可
    requestOptions.body = request.body
  }

  try {
    // 4. 发起请求到目标服务器
    const response = await fetch(targetUrl, requestOptions)

    // 5. 处理响应头 (添加 CORS)
    const newResponseHeaders = new Headers(response.headers)
    newResponseHeaders.set('Access-Control-Allow-Origin', '*')
    newResponseHeaders.set('Access-Control-Allow-Methods', '*')
    newResponseHeaders.set('Access-Control-Allow-Headers', '*')
    
    // 如果不需要浏览器缓存，建议将 Cache-Control 设置为 no-store
    // newResponseHeaders.set('Cache-Control', 'no-store'); 

    // 6. 返回目标服务器的原始响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newResponseHeaders,
    })

  } catch (err) {
    // 出错时返回简单的文本错误
    return new Response('Proxy Error: ' + err.message, { status: 500 })
  }
}
