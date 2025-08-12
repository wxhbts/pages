// functions/huya.js

export async function onRequest({ request, waitUntil }) {
  const url = new URL(request.url);
  const videoUrl = url.searchParams.get('url');
	const cookie = url.searchParams.get('live_media_session');

  if (!videoUrl) {
    return new Response('Missing "url" parameter', { status: 200 });
  }

  const headers = new Headers();
  const name = url.searchParams.get('name');

  if (name === 'pandalive') {
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    headers.set('Origin', 'https://www.pandalive.co.kr');
  } else if (name === 'twitch') {
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    headers.set('Origin', 'https://www.twitch.tv');
    headers.set('referer', 'https://www.twitch.tv/');
  } else if (name === 'fc2') {
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    headers.set('cookie', 'live_media_session=' + cookie);
  }

  // 使用 waitUntil 确保 fetch 完成（重要）
  const promise = fetch(videoUrl, { headers: headers })
    .then(async response => {
      const newHeaders = new Headers(response.headers);
      //newHeaders.set('Content-Type', 'video/mp2t'); //如果需要设置Content-Type，请放开注释
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET');
      newHeaders.set('Access-Control-Allow-Headers', '*');
      newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      newHeaders.set('Pragma', 'no-cache');
      newHeaders.set('Expires', '0');

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    });

  waitUntil(promise); // 确保在响应发送后 fetch 不会被终止

  return promise; // 返回 Promise
}
