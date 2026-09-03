export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/favicon.ico") {
      return env.ASSETS.fetch(new Request(`${url.origin}/favicon.svg`, request));
    }

    if (url.pathname === "/kitchen/favicon.ico") {
      return env.KITCHEN.fetch(new Request(`${url.origin}/kitchen/icon.svg`, request));
    }

    if (url.pathname === "/kitchen" || url.pathname.startsWith("/kitchen/")) {
      return env.KITCHEN.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

interface Env {
  ASSETS: Fetcher;
  KITCHEN: Fetcher;
}
