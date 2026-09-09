Replace these 3 files in SatelliteEvaluationViewer:

1. app.js
2. scripts/generate-figures.mjs
3. .github/workflows/pages.yml

The existing figures.json can stay temporarily. app.js automatically strips an old 'figures/' prefix,
so the current manifest will already point to the matching filename on SURFdrive.

For future updates, generate figures.json on the HPC from the folder containing the figures:

node scripts/generate-figures.mjs /path/to/figures

Then commit/push figures.json together with any code changes.

The GitHub Pages workflow no longer scans the GitHub repository for image files, because the images
are now hosted on SURFdrive.
