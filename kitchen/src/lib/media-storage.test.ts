import { describe, expect, it } from "vitest";
import { MEDIA_RULES, baseContentType, isMediaKind, parseRangeHeader, validateMedia } from "./media-storage";

function fakeFile(type: string, size: number): File {
  return { type, size } as File;
}

describe("baseContentType", () => {
  it("drops codec parameters and normalises case", () => {
    expect(baseContentType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(baseContentType("AUDIO/MP4")).toBe("audio/mp4");
    expect(baseContentType(" image/jpeg ")).toBe("image/jpeg");
  });
});

describe("isMediaKind", () => {
  it("accepts only the heritage kinds", () => {
    expect(isMediaKind("scan")).toBe(true);
    expect(isMediaKind("voice")).toBe(true);
    expect(isMediaKind("photo")).toBe(false);
  });
});

describe("validateMedia", () => {
  it("maps each allowed type to a file extension", () => {
    expect(validateMedia("scan", fakeFile("image/jpeg", 1000))).toEqual({ ext: "jpg", contentType: "image/jpeg" });
    expect(validateMedia("scan", fakeFile("image/png", 1000))).toEqual({ ext: "png", contentType: "image/png" });
    expect(validateMedia("scan", fakeFile("image/webp", 1000))).toEqual({ ext: "webp", contentType: "image/webp" });
    expect(validateMedia("voice", fakeFile("audio/webm;codecs=opus", 1000))).toEqual({
      ext: "webm",
      contentType: "audio/webm",
    });
    expect(validateMedia("voice", fakeFile("audio/mp4", 1000))).toEqual({ ext: "m4a", contentType: "audio/mp4" });
  });

  it("rejects a type the kind does not allow", () => {
    expect(() => validateMedia("scan", fakeFile("application/pdf", 1000))).toThrow(MEDIA_RULES.scan.label);
    expect(() => validateMedia("voice", fakeFile("image/jpeg", 1000))).toThrow(MEDIA_RULES.voice.label);
  });

  it("rejects an empty file", () => {
    expect(() => validateMedia("scan", fakeFile("image/jpeg", 0))).toThrow("That file is empty.");
  });

  it("rejects a file over the per-kind cap", () => {
    expect(() => validateMedia("scan", fakeFile("image/jpeg", MEDIA_RULES.scan.maxBytes + 1))).toThrow(
      MEDIA_RULES.scan.limitLabel,
    );
    expect(() => validateMedia("voice", fakeFile("audio/webm", MEDIA_RULES.voice.maxBytes + 1))).toThrow(
      MEDIA_RULES.voice.limitLabel,
    );
  });

  it("accepts a file exactly at the cap", () => {
    expect(validateMedia("scan", fakeFile("image/jpeg", MEDIA_RULES.scan.maxBytes)).ext).toBe("jpg");
  });
});

describe("parseRangeHeader", () => {
  const size = 1000;

  it("returns null when there is no usable range", () => {
    expect(parseRangeHeader(null, size)).toBeNull();
    expect(parseRangeHeader("bytes=-", size)).toBeNull();
    expect(parseRangeHeader("items=0-10", size)).toBeNull();
    expect(parseRangeHeader("bytes=0-10, 20-30", size)).toBeNull();
  });

  it("parses an open-ended range", () => {
    expect(parseRangeHeader("bytes=100-", size)).toEqual({ offset: 100 });
  });

  it("parses a closed range and clamps the end to the object", () => {
    expect(parseRangeHeader("bytes=0-99", size)).toEqual({ offset: 0, length: 100 });
    expect(parseRangeHeader("bytes=900-5000", size)).toEqual({ offset: 900, length: 100 });
  });

  it("parses a suffix range without an offset", () => {
    expect(parseRangeHeader("bytes=-200", size)).toEqual({ suffix: 200 });
    expect(parseRangeHeader("bytes=-5000", size)).toEqual({ suffix: size });
  });

  it("returns null when the offset is past the end of the object", () => {
    expect(parseRangeHeader("bytes=1000-", size)).toBeNull();
  });
});
