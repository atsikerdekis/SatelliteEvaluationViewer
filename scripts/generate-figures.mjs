import { readdir, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignored = new Set([".git", ".github", "node_modules"]);
const figures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.png$/i.test(entry.name)) parse(path);
  }
}

function parse(path) {
  const file = basename(path);
  const match = file.match(/^(.+?)_vs_.+?_(\d{8})-(\d{8})_(absolute|relative)_([^_]+)(?:_.+)?\.png$/i);
  if (!match) return;
  const [, sensor, start, end, statistic, variable] = match;
  figures.push({
    file: relative(root, path).split("\\").join("/"),
    sensor,
    start,
    end,
    statistic: statistic.toLowerCase(),
    variable,
    month: start.slice(0, 6),
  });
}

await walk(root);
figures.sort((a, b) => a.start.localeCompare(b.start) || a.sensor.localeCompare(b.sensor));
await writeFile(resolve(root, "figures.json"), `${JSON.stringify(figures, null, 2)}\n`);
console.log(`Discovered ${figures.length} figures.`);
