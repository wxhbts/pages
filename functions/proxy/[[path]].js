export async function onRequest({ request }) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (request。method !== 'GET') {
    return new Response('Only GET requests are supported', { status: 405 });
  }

  if (!targetUrl) {
    return new Response('Missing "url" parameter', { status: 400 });
  }

  try {
    new URL(targetUrl);
  } catch (error) {
    return new Response('Invalid "url" parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' // 可选
      }
    });

    if (!response.ok) {
      return new Response(response.statusText, { status: response.status });
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin'， '*'); // CORS

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
