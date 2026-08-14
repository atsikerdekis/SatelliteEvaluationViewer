# CAMS Satellite Evaluation Gallery

A responsive, dependency-free browser for the scientific figures in this repository.

## Add a figure

Add a PNG to the `figures/` folder and keep this naming pattern:

`SENSOR_vs_..._YYYYMMDD-YYYYMMDD_absolute|relative_VARIABLE_....png`

For example: `MOD_vs_0001_vs_control_20260501-20260531_relative_AOD550_AODfilter0.png`.

On every push to `main`, GitHub Actions scans all PNG files, rebuilds `figures.json`, and deploys the gallery. New months, sensors, statistics, and variables become selector options automatically.

## Enable GitHub Pages

In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. Then run the “Deploy gallery to GitHub Pages” workflow, or push to `main`.

## Preview locally

Run `node scripts/generate-figures.mjs`, then serve the folder with any static web server. The site must be served over HTTP rather than opened directly from the filesystem because it fetches `figures.json`.
