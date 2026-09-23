import { getRedirectError } from "next/dist/client/components/redirect";
import { describe, expect, it } from "vitest";
import { redirectActionError } from "./action-result";

describe("redirectActionError", () => {
  it("rethrows Next.js redirect errors instead of treating them as failures", () => {
    const redirectError = getRedirectError("/recipes", "push");
    expect(() => redirectActionError("/onboarding", redirectError, "onboarding.save_failed")).toThrow(redirectError);
  });
});
