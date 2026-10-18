import { describe, expect, it } from "vitest";
import {
  type DownloadFile,
  SHARE_MAX_BYTES,
  SHARE_MAX_FILES,
  shareBatches,
} from "@/lib/download/client";

const file = (i: number, bytes = 4 * 1024 ** 2): DownloadFile => ({
  id: String(i),
  url: `https://r2/${i}`,
  bytes,
  ext: "jpg",
  uploaderName: null,
  createdAt: "2026-06-14T18:00:00Z",
});

describe("shareBatches", () => {
  it("groups at most SHARE_MAX_FILES photos, keeping album order", () => {
    const files = Array.from({ length: 95 }, (_, i) => file(i, 1024));
    const batches = shareBatches(files);
    expect(batches.map((b) => b.length)).toEqual([
      SHARE_MAX_FILES,
      SHARE_MAX_FILES,
      15,
    ]);
    expect(batches.flat().map((f) => f.id)).toEqual(files.map((f) => f.id));
  });

  it("starts a new group before the byte limit", () => {
    const big = SHARE_MAX_BYTES / 3 + 1;
    const batches = shareBatches([file(1, big), file(2, big), file(3, big)]);
    expect(batches.map((b) => b.length)).toEqual([2, 1]);
  });

  it("keeps a single oversized photo on its own", () => {
    const batches = shareBatches([file(1, SHARE_MAX_BYTES * 2), file(2)]);
    expect(batches.map((b) => b.length)).toEqual([1, 1]);
  });

  it("returns nothing for nothing", () => {
    expect(shareBatches([])).toEqual([]);
  });
});
