// filename: functions/huya.flv.js

export async function onRequest({ request, waitUntil }) { // EdgeOne Pages 函数入口

  const urlParams = new URL(request.url).searchParams;
  const videoUrl = urlParams.get('url');

  if (!videoUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {

    const userAgent = 'HYSDK(Windows,30000002)_APP(pc_exe&7030003&official)_SDK(trans&2.29.0.5493)'; // 获取UserAgent


    // 2. 请求视频
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': userAgent
      }
    });

    if (!videoResponse.ok) {
      console.error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText} for URL: ${videoUrl}`);
      return new Response(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText} for URL: ${videoUrl}`, { status: videoResponse.status });
    }

    // 3. 设置 Content-Type
    const headers = new Headers(videoResponse.headers);
    let contentType = videoResponse.headers.get('Content-Type') || 'video/x-flv';
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-cache'); // 强制不缓存

    // 4. 返回响应 (使用 stream)
    return new Response(videoResponse.body, {
      status: videoResponse.status,
      headers: headers
    });

  } catch (error) {

    console.error('Error fetching video:', error);
    return new Response(`Error fetching video: ${error.message}`, { status: 500 });  // 返回 500
  }
}
