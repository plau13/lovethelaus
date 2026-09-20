import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEMO_EMAIL,
  DEFAULT_DEMO_NAME,
  demoEmail,
  demoName,
  demoPassword,
  looksLikeEmail,
} from "./demo-account";

describe("demoEmail", () => {
  it("falls back when the variable is absent", () => {
    expect(demoEmail({})).toBe(DEFAULT_DEMO_EMAIL);
  });

  it("treats a blank value as absent", () => {
    // An unset GitHub Actions secret arrives as "". `??` would hand that
    // through and the seed would try to sign up with no email at all.
    expect(demoEmail({ DEMO_USER_EMAIL: "" })).toBe(DEFAULT_DEMO_EMAIL);
    expect(demoEmail({ DEMO_USER_EMAIL: "   " })).toBe(DEFAULT_DEMO_EMAIL);
  });

  it("trims and lowercases an address that is set", () => {
    expect(demoEmail({ DEMO_USER_EMAIL: "  Demo@Example.COM " })).toBe("demo@example.com");
  });
});

describe("demoName", () => {
  it("falls back when absent or blank", () => {
    expect(demoName({})).toBe(DEFAULT_DEMO_NAME);
    expect(demoName({ DEMO_USER_NAME: "  " })).toBe(DEFAULT_DEMO_NAME);
  });

  it("keeps a name that is set", () => {
    expect(demoName({ DEMO_USER_NAME: " The Laus " })).toBe("The Laus");
  });
});

describe("demoPassword", () => {
  it("is empty when absent or blank, so callers can decide what that means", () => {
    expect(demoPassword({})).toBe("");
    expect(demoPassword({ DEMO_USER_PASSWORD: "   " })).toBe("");
  });

  it("trims a password that is set", () => {
    expect(demoPassword({ DEMO_USER_PASSWORD: " hunter2 " })).toBe("hunter2");
  });
});

describe("looksLikeEmail", () => {
  it("accepts the default and an override", () => {
    expect(looksLikeEmail(DEFAULT_DEMO_EMAIL)).toBe(true);
    expect(looksLikeEmail("someone@example.co.uk")).toBe(true);
  });

  it("rejects what would otherwise reach Better Auth as a 400", () => {
    expect(looksLikeEmail("")).toBe(false);
    expect(looksLikeEmail("demo")).toBe(false);
    expect(looksLikeEmail("demo@localhost")).toBe(false);
    expect(looksLikeEmail("two words@example.com")).toBe(false);
  });
});
