import { chromium } from "playwright";
const base = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "tr-TR" });
const p = await ctx.newPage();
const v = [];
p.on("console", m => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) v.push(t.slice(0, 220)); });
p.on("pageerror", e => v.push("pageerror: " + e.message.slice(0, 160)));
const visit = async (path, wait = 1500) => { const before = v.length; await p.goto(base + path, { waitUntil: "networkidle" }).catch(e => v.push("nav " + path + " " + e.message.slice(0,80))); await p.waitForTimeout(wait); console.log(path, "->", v.length - before, "violations"); };
await visit("/tr");
await visit("/tr/login", 3000);
await visit("/tr/e/telefon-testi-fv8mev", 3000);
await visit("/tr/create");
if (base.includes("localhost")) {
  await visit("/api/dev-login?next=/tr/dashboard");
  await visit("/tr/dashboard/events/f618f885-ccea-48a9-bfef-df668994580b?view=photos", 2500);
  await visit("/tr/dashboard/events/f618f885-ccea-48a9-bfef-df668994580b?view=print", 4000);
}
console.log([...new Set(v)].join("\n"));
await b.close();
