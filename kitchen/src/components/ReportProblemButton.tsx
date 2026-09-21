"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useRef } from "react";

/** Opens the Sentry user feedback dialog when configured. */
export function ReportProblemButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const feedback = Sentry.getFeedback();
    if (!buttonRef.current || !feedback) {
      return;
    }
    return feedback.attachTo(buttonRef.current, { triggerLabel: "Report a problem" });
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="text-sm text-muted underline decoration-line underline-offset-2 hover:text-clay"
    >
      Report a problem
    </button>
  );
}
