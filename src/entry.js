export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    // Eğer dosya bulunamazsa (404) ve bir API isteği değilse, index.html'i döndür (SPA Routing)
    if (response.status === 404 && !url.pathname.startsWith('/api')) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return response;
  },
};
