import { describe, expect, it } from "vitest";
import { photoFileName, splitParts, zipFileName } from "@/lib/download/names";

describe("photoFileName", () => {
  it("puts local time first so names sort by upload time", () => {
    const d = new Date(2026, 5, 14, 21, 31);
    expect(
      photoFileName(
        { createdAt: d.toISOString(), uploaderName: "Selin", ext: "jpg" },
        42,
        "Guest",
      ),
    ).toBe("2026-06-14 21.31 - Selin - 0042.jpg");
  });

  it("strips characters file systems reject and falls back for no name", () => {
    const iso = new Date(2026, 0, 2, 3, 4).toISOString();
    expect(
      photoFileName(
        { createdAt: iso, uploaderName: 'a/b:c*"d', ext: "heic" },
        1,
        "Guest",
      ),
    ).toBe("2026-01-02 03.04 - abcd - 0001.heic");
    expect(
      photoFileName(
        { createdAt: iso, uploaderName: "  ", ext: "png" },
        7,
        "Misafir",
      ),
    ).toBe("2026-01-02 03.04 - Misafir - 0007.png");
  });
});

describe("zipFileName", () => {
  it("numbers parts only when there is more than one", () => {
    expect(zipFileName("Elif & Can")).toBe("Elif & Can.zip");
    expect(zipFileName("Elif & Can", { n: 1, of: 1 })).toBe("Elif & Can.zip");
    expect(zipFileName("Elif & Can", { n: 2, of: 3 })).toBe(
      "Elif & Can (2 of 3).zip",
    );
  });
});

describe("splitParts", () => {
  it("keeps parts under the limit and gives oversized files their own part", () => {
    const f = (bytes: number) => ({ bytes });
    expect(splitParts([f(4), f(4), f(4)], 10)).toEqual([[f(4), f(4)], [f(4)]]);
    expect(splitParts([f(3), f(20), f(3)], 10)).toEqual([
      [f(3)],
      [f(20)],
      [f(3)],
    ]);
    expect(splitParts([], 10)).toEqual([]);
  });
});
