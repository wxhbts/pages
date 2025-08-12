export async function onRequest(context) {
  const request = context.request;
  const urlParams = new URL(request.url).searchParams;
  const videoUrl = urlParams.get('url');

  if (!videoUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    // 1. 获取 User-Agent
    const configResponse = await fetch('https://github.iill.moe/xiaoyaocz/dart_simple_live/master/assets/play_config.json');
    if (!configResponse.ok) {
      return new Response(`Failed to fetch config: ${configResponse.status} ${configResponse.statusText}`, { status: 404 });
    }
    const config = await configResponse.json();
    const userAgent = config?.huya?.user_agent || 'HYSDK(Windows, 30000002)_APP(pc_exe&6090007&official)_SDK(trans&2.24.0.5157)'; // 默认 User-Agent
    //console.log("Using User-Agent:", userAgent);

    // 2. 请求视频
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': userAgent
      }
    });

    if (!videoResponse.ok) {
      return new Response(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText} for URL: ${videoUrl}`, { status: videoResponse.status });
    }

    // 3. 设置 Content-Type
    const headers = new Headers(videoResponse.headers);
    let contentType = videoResponse.headers.get('Content-Type') || 'video/x-flv'; // 默认 FLV
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-cache');

    // 4. 返回响应
    let body = videoResponse.body;

      // Check if the response is already a ReadableStream
      if (typeof videoResponse.body !== 'undefined') {
           if (typeof ReadableStream === 'undefined' || !(videoResponse.body instanceof ReadableStream)) {
               // If ReadableStream is not supported or videoResponse.body is not a ReadableStream
              let buffer = await videoResponse.arrayBuffer();
              body = new Uint8Array(buffer);
           } else {
               body = videoResponse.body
           }
      } else {
          // Handle the case where there is no body in the response (e.g., HEAD request)
          body = null;
      }

    return new Response(body, {
      status: videoResponse.status,
      headers: headers
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    return new Response(`Error fetching video: ${error.message}`, { status: 404 });
  }
}
