import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    if (k === "_meta") return [];
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" ? keys(v, path) : [path];
  });
}

describe("message catalogs", () => {
  const reference = keys(en).sort();
  it.each([
    ["tr", tr],
    ["de", de],
  ])("%s has exactly the same keys as en", (_, messages) => {
    expect(keys(messages).sort()).toEqual(reference);
  });
});
