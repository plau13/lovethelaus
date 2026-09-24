function logLine(event: string, fields: Record<string, string | number | boolean | undefined> = {}): void {
  console.log(JSON.stringify({ level: 'info', event, ...fields }));
}

function logError(event: string, fields: Record<string, string | number | boolean | undefined> = {}): void {
  console.error(JSON.stringify({ level: 'error', event, ...fields }));
}

/**
 * Attach x-request-id for correlation. Only clone GET/HEAD — cloning POST with
 * `new Request(request, { headers })` drops the body on Cloudflare and crashes Kitchen.
 */
function kitchenRequest(request: Request, requestId: string): Request {
  if (request.headers.get('x-request-id')) {
    return request;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set('x-request-id', requestId);
  return new Request(request, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    const cfRay = request.headers.get('cf-ray') ?? undefined;
    const baseFields = { path: url.pathname, requestId, cfRay, method: request.method };

    if (url.pathname === '/favicon.ico') {
      logLine('router.favicon_rewrite', baseFields);
      return env.ASSETS.fetch(new Request(`${url.origin}/favicon.svg`, request));
    }

    if (url.pathname === '/kitchen/favicon.ico') {
      logLine('router.favicon_rewrite', { ...baseFields, target: 'kitchen-icon' });
      return env.KITCHEN.fetch(new Request(`${url.origin}/kitchen/icon.svg`, request));
    }

    if (url.pathname === '/kitchen/api/auth/dash/validate') {
      const rewriteUrl = new URL(url);
      rewriteUrl.pathname = '/kitchen/api/auth/dash-validate';
      logLine('router.dash_validate_rewrite', { ...baseFields, target: rewriteUrl.pathname });
      const response = await env.KITCHEN.fetch(kitchenRequest(new Request(rewriteUrl, request), requestId));
      if (response.status >= 500) {
        logError('router.kitchen_upstream_error', {
          ...baseFields,
          status: response.status,
          target: rewriteUrl.pathname,
        });
      }
      return response;
    }

    if (url.pathname === '/kitchen' || url.pathname.startsWith('/kitchen/')) {
      logLine('router.kitchen_proxy', baseFields);
      const response = await env.KITCHEN.fetch(kitchenRequest(request, requestId));
      if (response.status >= 500) {
        logError('router.kitchen_upstream_error', { ...baseFields, status: response.status });
      }
      return response;
    }

    logLine('router.static_asset', baseFields);
    return env.ASSETS.fetch(request);
  },
};

/** Minimal shape of a Workers service/assets binding (avoids depending on @cloudflare/workers-types here). */
interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
  KITCHEN: Fetcher;
}
