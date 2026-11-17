import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile("release-please-config.json", "utf8"));
const manifest = JSON.parse(await readFile(".release-please-manifest.json", "utf8"));

if (!config.packages?.["."]) {
  throw new Error("release-please config must configure the repository root");
}

if (manifest["."] !== config.packages["."]["initial-version"]) {
  throw new Error("release-please manifest and config versions must match");
}
