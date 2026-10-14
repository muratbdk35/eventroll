// Writes lib/legal/third-party-libs.json (name, version, license, link) for
// every runtime dependency, for the third-party notices page. Run with
// `npm run notices` after adding or upgrading a dependency.
import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));

function repoUrl(repo, name) {
  const raw = typeof repo === "string" ? repo : repo?.url;
  if (!raw) return `https://www.npmjs.com/package/${name}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(raw)) return `https://github.com/${raw}`;
  return raw
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

const libs = Object.keys(pkg.dependencies)
  .sort()
  .map((name) => {
    const dep = JSON.parse(
      readFileSync(`node_modules/${name}/package.json`, "utf8"),
    );
    return {
      name,
      version: dep.version,
      license: dep.license ?? "UNKNOWN",
      url: repoUrl(dep.repository, name),
    };
  });

writeFileSync(
  "lib/legal/third-party-libs.json",
  JSON.stringify(libs, null, 2) + "\n",
);
console.log(`${libs.length} libraries written`);
