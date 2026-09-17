"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, adSlotId, type AdSize } from "@/components/ads/config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Reserved heights keep the layout stable while the unit loads (no CLS). */
const FRAME: Record<AdSize, { className: string; style: React.CSSProperties; format?: string; responsive?: boolean }> = {
  rail: { className: "min-h-[600px] w-[300px]", style: { display: "inline-block", width: 300, height: 600 } },
  rect: { className: "min-h-[250px] w-[300px]", style: { display: "inline-block", width: 300, height: 250 } },
  inline: { className: "min-h-[280px] w-full", style: { display: "block" }, format: "auto", responsive: true },
  anchor: { className: "min-h-[100px] w-full", style: { display: "block" }, format: "auto", responsive: true },
};

export function AdSlot({ size, className = "" }: { size: AdSize; className?: string }) {
  const slot = adSlotId(size);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) {
      return;
    }
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blocker or script not loaded; the frame stays empty.
    }
  }, [slot]);

  if (!slot || !ADSENSE_CLIENT) {
    return null;
  }

  const frame = FRAME[size];
  return (
    <div className={`no-print grid justify-items-center gap-1 rounded-2xl border border-line bg-paper p-2 ${className}`}>
      <span className="text-[11px] uppercase tracking-wide text-muted">Advertisement</span>
      <ins
        className={`adsbygoogle ${frame.className}`}
        style={frame.style}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        {...(frame.format ? { "data-ad-format": frame.format } : {})}
        {...(frame.responsive ? { "data-full-width-responsive": "true" } : {})}
      />
    </div>
  );
}
