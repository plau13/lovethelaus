/** Absolute URL on the site origin (marketing pages). */
export function siteUrl(request: Request, path: string): URL {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return new URL(pathname, new URL(request.url).origin);
}

/** Absolute URL under the Kitchen base path (/kitchen). */
export function kitchenAppUrl(request: Request, path: string): URL {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  const kitchenPath = pathname.startsWith("/kitchen") ? pathname : `/kitchen${pathname}`;
  return new URL(kitchenPath, new URL(request.url).origin);
}
