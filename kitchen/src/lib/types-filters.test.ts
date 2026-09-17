import { describe, expect, it } from "vitest";
import { cookTimeBucketFilter } from "./types";

describe("cookTimeBucketFilter", () => {
  it("returns minute ranges", () => {
    expect(cookTimeBucketFilter("under-30")).toEqual({ min: 0, max: 29 });
    expect(cookTimeBucketFilter("120-plus")).toEqual({ min: 120, max: null });
  });

  it("returns null for unknown buckets", () => {
    expect(cookTimeBucketFilter("nope")).toBeNull();
  });
});
