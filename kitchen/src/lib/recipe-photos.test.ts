import { describe, expect, it } from "vitest";
import {
  MAX_PHOTO_BYTES,
  PHOTO_SIZE_MESSAGE,
  PHOTO_TYPE_MESSAGE,
  validatePhoto,
} from "./recipe-photos";

function fakeFile(type: string, size: number): File {
  return { type, size } as File;
}

describe("validatePhoto", () => {
  it("maps each allowed type to a file extension", () => {
    expect(validatePhoto(fakeFile("image/jpeg", 1000))).toEqual({ ext: "jpg", contentType: "image/jpeg" });
    expect(validatePhoto(fakeFile("image/png", 1000))).toEqual({ ext: "png", contentType: "image/png" });
    expect(validatePhoto(fakeFile("image/webp", 1000))).toEqual({ ext: "webp", contentType: "image/webp" });
  });

  it("normalizes a type that carries parameters", () => {
    expect(validatePhoto(fakeFile("IMAGE/JPEG", 1000)).ext).toBe("jpg");
  });

  it("rejects a type that is not an allowed image", () => {
    expect(() => validatePhoto(fakeFile("image/gif", 1000))).toThrow(PHOTO_TYPE_MESSAGE);
    expect(() => validatePhoto(fakeFile("application/pdf", 1000))).toThrow(PHOTO_TYPE_MESSAGE);
  });

  it("rejects an empty file", () => {
    expect(() => validatePhoto(fakeFile("image/jpeg", 0))).toThrow("That file is empty.");
  });

  it("accepts a photo at the cap and rejects one over it", () => {
    expect(validatePhoto(fakeFile("image/jpeg", MAX_PHOTO_BYTES)).ext).toBe("jpg");
    expect(() => validatePhoto(fakeFile("image/jpeg", MAX_PHOTO_BYTES + 1))).toThrow(PHOTO_SIZE_MESSAGE);
  });

  it("allows an ordinary phone photo, which the old 1MB cap rejected", () => {
    expect(validatePhoto(fakeFile("image/jpeg", 3 * 1024 * 1024)).ext).toBe("jpg");
  });
});
