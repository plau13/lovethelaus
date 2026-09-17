import { describe, expect, it } from "vitest";
import { lifespan, memorySummary, parseYear, provenanceLine } from "./heritage";

describe("provenanceLine", () => {
  it("joins the parts that are present", () => {
    expect(provenanceLine({ person: { name: "Grandma Rose", relationship: "grandmother" }, firstMadeYear: 1974, occasion: "Sunday dinner" })).toBe(
      "From Grandma Rose (grandmother) · first made 1974 · Sunday dinner"
    );
    expect(provenanceLine({ person: { name: "Dad" } })).toBe("From Dad");
    expect(provenanceLine({ firstMadeYear: 2001 })).toBe("first made 2001");
    expect(provenanceLine({})).toBe("");
    expect(provenanceLine({ person: { name: "  " }, occasion: " " })).toBe("");
  });
});

describe("parseYear", () => {
  const now = new Date("2026-09-17T00:00:00Z");
  it("accepts plausible years only", () => {
    expect(parseYear("1974", now)).toBe(1974);
    expect(parseYear(2026, now)).toBe(2026);
    expect(parseYear("2027", now)).toBeNull();
    expect(parseYear("1799", now)).toBeNull();
    expect(parseYear("abc", now)).toBeNull();
    expect(parseYear("", now)).toBeNull();
    expect(parseYear(null, now)).toBeNull();
  });
});

describe("memorySummary", () => {
  it("summarises count and latest cook", () => {
    expect(memorySummary([])).toBe("");
    expect(memorySummary([{ madeOn: new Date("2026-09-03T12:00:00Z"), userName: "Mom" }])).toBe("Made once · last by Mom on Sep 3, 2026");
    const summary = memorySummary([
      { madeOn: new Date("2026-01-01T12:00:00Z"), userName: "Dad" },
      { madeOn: new Date("2026-09-03T12:00:00Z"), userName: "Mom" },
    ]);
    expect(summary).toBe("Made 2 times · last by Mom on Sep 3, 2026");
  });
});

describe("lifespan", () => {
  it("formats years", () => {
    expect(lifespan(1931, 2019)).toBe("1931–2019");
    expect(lifespan(1958, null)).toBe("b. 1958");
    expect(lifespan(null, 2019)).toBe("d. 2019");
    expect(lifespan(null, null)).toBe("");
  });
});
