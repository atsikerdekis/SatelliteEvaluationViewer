import { readdir, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const figureDirectory = process.argv[2];
const figures = [];

if (!figureDirectory) {
  console.error("Usage: node scripts/generate-figures.mjs /path/to/your/figure/folder");
  process.exit(1);
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(png|webp)$/i.test(entry.name)) parse(path);
  }
}

function parse(path) {
  const file = basename(path);
  const match = file.match(/^(.+?)_vs_.+?_(\d{8})-(\d{8})_(absolute|relative)_([^_]+)(?:_.+)?\.(png|webp)$/i);
  if (!match) return;

  const [, sensor, start, end, statistic, variable] = match;
  figures.push({
    file,
    sensor,
    start,
    end,
    statistic: statistic.toLowerCase(),
    variable,
    month: start.slice(0, 6)
  });
}

await walk(resolve(figureDirectory));
figures.sort((a, b) => a.start.localeCompare(b.start) || a.sensor.localeCompare(b.sensor) || a.statistic.localeCompare(b.statistic));
await writeFile(resolve(root, "figures.json"), `${JSON.stringify(figures, null, 2)}\n`);
console.log(`Discovered ${figures.length} figures.`);
