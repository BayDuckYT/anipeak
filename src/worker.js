export default {
  async fetch(request, env) {
    // Tüm istekleri statik varlıklara (dist klasörüne) yönlendir
    return await env.ASSETS.fetch(request);
  }
};
