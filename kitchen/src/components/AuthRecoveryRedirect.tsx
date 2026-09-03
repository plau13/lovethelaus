"use client";

import { useEffect } from "react";

/** Sends implicit-flow recovery tokens to the reset-password page. */
export function AuthRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token") || !hash.includes("type=recovery")) {
      return;
    }
    if (window.location.pathname.endsWith("/reset-password")) {
      return;
    }
    window.location.replace(`/kitchen/reset-password${hash}`);
  }, []);

  return null;
}
