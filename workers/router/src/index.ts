export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/kitchen") {
      return Response.redirect(`${url.origin}/kitchen/`, 308);
    }

    if (url.pathname.startsWith("/kitchen/")) {
      return env.KITCHEN.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

interface Env {
  ASSETS: Fetcher;
  KITCHEN: Fetcher;
}
