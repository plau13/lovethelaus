/**
 * AdSense configuration is compiled in at build time (NEXT_PUBLIC_*). Leave the client id
 * unset and every ad component renders nothing. See docs/ADS.md.
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null;

export type AdSize = "rail" | "rect" | "inline" | "anchor";

const SLOT_IDS: Record<AdSize, string | null> = {
  rail: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL?.trim() || null,
  rect: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECT?.trim() || process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL?.trim() || null,
  inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT?.trim() || null,
  anchor: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR?.trim() || null,
};

export function adSlotId(size: AdSize): string | null {
  return ADSENSE_CLIENT ? SLOT_IDS[size] : null;
}

export function adsEnabled(): boolean {
  return ADSENSE_CLIENT !== null;
}
