import { describe, expect, it } from "vitest";
import { postAuthPath, safeReturnTo, withQuery } from "./post-auth";

describe("safeReturnTo", () => {
  it("keeps site-relative paths", () => {
    expect(safeReturnTo("/invite/abc")).toBe("/invite/abc");
    expect(safeReturnTo("/recipes?q=pie")).toBe("/recipes?q=pie");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeReturnTo("https://evil.example")).toBeNull();
    expect(safeReturnTo("//evil.example/x")).toBeNull();
    expect(safeReturnTo("/\\evil.example")).toBeNull();
    expect(safeReturnTo("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty and header-injecting values", () => {
    expect(safeReturnTo("")).toBeNull();
    expect(safeReturnTo(null)).toBeNull();
    expect(safeReturnTo("/ok\r\nSet-Cookie: x")).toBeNull();
  });
});

describe("postAuthPath", () => {
  const onboarded = { onboardingCompletedAt: new Date("2026-01-01") };
  const fresh = { onboardingCompletedAt: null };

  it("sends new accounts to onboarding regardless of returnTo", () => {
    expect(postAuthPath(fresh)).toBe("/onboarding");
    expect(postAuthPath(fresh, "/invite/abc")).toBe("/onboarding");
  });

  it("honours a safe returnTo for onboarded users", () => {
    expect(postAuthPath(onboarded, "/invite/abc")).toBe("/invite/abc");
    expect(postAuthPath(onboarded, "/kitchen/cookbooks/1")).toBe("/cookbooks/1");
  });

  it("falls back to recipes", () => {
    expect(postAuthPath(onboarded)).toBe("/recipes");
    expect(postAuthPath(onboarded, "https://evil.example")).toBe("/recipes");
    expect(postAuthPath(onboarded, "/onboarding")).toBe("/recipes");
    expect(postAuthPath(null)).toBe("/recipes");
  });
});

describe("withQuery", () => {
  it("appends with ? or & and encodes", () => {
    expect(withQuery("/sign-in", "error", "a b")).toBe("/sign-in?error=a%20b");
    expect(withQuery("/sign-in?x=1", "sent", "1")).toBe("/sign-in?x=1&sent=1");
  });
});
