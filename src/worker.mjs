const CANONICAL_HOST = "www.chineseknotguide.com";
const ROOT_HOST = "chineseknotguide.com";

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === ROOT_HOST) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  }
};
