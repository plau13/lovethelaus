import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";
import { AppError, isInternalErrorMessage, userSafeMessage } from "./errors";

describe("userSafeMessage", () => {
  it("returns AppError message", () => {
    expect(userSafeMessage(new AppError("test.event", "Name is required."))).toBe("Name is required.");
  });

  it("maps Better Auth codes", () => {
    const error = new APIError("UNAUTHORIZED", {
      message: "raw",
      body: { code: "INVALID_EMAIL_OR_PASSWORD" },
    });
    expect(userSafeMessage(error)).toBe("That email and password do not match.");
  });

  it("blocks SQL internals", () => {
    expect(
      userSafeMessage(new Error('Failed query: select "id" from "user" where email = $1'))
    ).toBe("Something went wrong on our side. Try again in a moment.");
  });

  it("passes through validation messages", () => {
    expect(userSafeMessage(new Error("Enter your first and last name."))).toBe("Enter your first and last name.");
  });
});

describe("isInternalErrorMessage", () => {
  it("detects drizzle failures", () => {
    expect(isInternalErrorMessage('column "default_cookbook_visibility" does not exist')).toBe(true);
  });
});
