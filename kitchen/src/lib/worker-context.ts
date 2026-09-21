export type RequestLogContext = {
  cfRay?: string;
  requestId?: string;
  route?: string;
  method?: string;
};

/** Correlation fields from an incoming Worker / route request. */
export function requestLogContext(request: Request): RequestLogContext {
  const url = new URL(request.url);
  return {
    cfRay: request.headers.get("cf-ray") ?? undefined,
    requestId: request.headers.get("x-request-id") ?? undefined,
    route: url.pathname,
    method: request.method,
  };
}

/** Ensure downstream handlers can correlate logs with the router Worker. */
export function withRequestId(request: Request): Request {
  if (request.headers.get("x-request-id")) {
    return request;
  }
  const headers = new Headers(request.headers);
  headers.set("x-request-id", crypto.randomUUID());
  return new Request(request, { headers });
}
