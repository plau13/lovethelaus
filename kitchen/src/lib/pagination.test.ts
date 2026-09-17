import { describe, expect, it } from "vitest";
import { pageSummary, paginate } from "./pagination";

describe("paginate", () => {
  it("clamps page numbers into range", () => {
    expect(paginate("3", 10, 25)).toMatchObject({ page: 3, totalPages: 3, offset: 20 });
    expect(paginate("99", 10, 25).page).toBe(3);
    expect(paginate("0", 10, 25).page).toBe(1);
    expect(paginate("nope", 10, 0)).toMatchObject({ page: 1, totalPages: 1, offset: 0 });
  });

  it("accepts a number as well as a query string", () => {
    expect(paginate(2, 10, 25).offset).toBe(10);
    expect(paginate(undefined, 10, 25).page).toBe(1);
  });

  it("always reports at least one page", () => {
    expect(paginate("1", 20, 0)).toMatchObject({ totalPages: 1, total: 0, offset: 0 });
  });
});

describe("pageSummary", () => {
  it("describes the visible slice", () => {
    expect(pageSummary(paginate("2", 10, 57), "recipe")).toBe("Showing 11–20 of 57 recipes");
    expect(pageSummary(paginate("6", 10, 57), "recipe")).toBe("Showing 51–57 of 57 recipes");
  });

  it("uses the singular for one row", () => {
    expect(pageSummary(paginate("1", 10, 1), "recipe")).toBe("Showing 1 of 1 recipe");
  });

  it("takes an irregular plural", () => {
    expect(pageSummary(paginate("1", 10, 3), "cookbook")).toBe("Showing 1–3 of 3 cookbooks");
  });

  it("says so when there is nothing", () => {
    expect(pageSummary(paginate("1", 10, 0), "recipe")).toBe("No recipes yet");
  });
});
