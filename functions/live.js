// functions/live.js
export async function onRequest({ request, waitUntil }) {
  const url = new URL(request.url);
  const videoUrl = url.searchParams.get('url');

  if (!videoUrl) {
    return new Response("Missing URL parameter", { status: 400 });
  }

  // 构造重定向的 URL
  const redirectUrl = `/huya?url=${encodeURIComponent(videoUrl)}`;

  // 返回重定向响应
  return Response.redirect(redirectUrl, 302); // 302 是临时重定向
}
