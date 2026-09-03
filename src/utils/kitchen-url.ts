import { SITE } from 'astrowind:config';

import { getPermalink } from '~/utils/permalinks';

const siteOrigin = (SITE.site ?? 'https://lovethelaus.com').replace(/\/$/, '');

/** Kitchen app entry — same-origin in prod, localhost in dev when unset. */
export function getKitchenUrl(): string {
  if (import.meta.env.PUBLIC_KITCHEN_URL) {
    return import.meta.env.PUBLIC_KITCHEN_URL;
  }
  if (import.meta.env.PROD) {
    return `${siteOrigin}/kitchen`;
  }
  return 'http://localhost:3000/kitchen';
}

/** Marketing sign-in page — always same-origin, never localhost. */
export function getSignInUrl(): string {
  return getPermalink('/sign-in');
}
