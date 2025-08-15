// filename: functions/huya.flv.js

export async function onRequest({ request, waitUntil }) { // EdgeOne Pages 函数入口

  const urlParams = new URL(request.url).searchParams;
  const videoUrl = urlParams.get('url');

  if (!videoUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'; // 获取UserAgent


    // 2. 请求视频
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': userAgent,
        'Origin': 'https://www.ttinglive.com',
        'referer': 'https://www.ttinglive.com/'
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
