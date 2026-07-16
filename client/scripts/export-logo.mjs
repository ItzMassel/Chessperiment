import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, '../public/fonts');
const outDir   = join(__dirname, '../public');

// Encode fonts as base64 data URIs
const toDataURI = (file) =>
  'data:font/truetype;base64,' + readFileSync(join(fontsDir, file)).toString('base64');

const outfit900 = toDataURI('outfit-900.ttf');
const mono400   = toDataURI('jetbrains-mono-400.ttf');
const mono700   = toDataURI('jetbrains-mono-700.ttf');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: 'Outfit';
    src: url('${outfit900}') format('truetype');
    font-weight: 900;
  }
  @font-face {
    font-family: 'JetBrainsMono';
    src: url('${mono400}') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'JetBrainsMono';
    src: url('${mono700}') format('truetype');
    font-weight: 700;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: transparent; display: inline-block; }

  #logo {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    padding: 12px 16px;
  }

  .chess {
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    font-size: 96px;
    letter-spacing: -0.05em;
    line-height: 1;
    background: linear-gradient(to bottom right, #fcd34d, #f59e0b, #ea580c);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    padding-right: 4px;
  }

  .periment {
    font-family: 'JetBrainsMono', monospace;
    font-weight: 400;
    font-size: 37px;
    color: rgba(120, 113, 108, 0.80);
    letter-spacing: -0.05em;
    display: flex;
    align-items: center;
  }

  .bracket {
    color: rgba(245, 158, 11, 0.50);
    font-weight: 700;
    font-family: 'JetBrainsMono', monospace;
  }
</style>
</head>
<body>
<div id="logo">
  <span class="chess">Chess</span>
  <span class="periment">
    <span class="bracket">[</span>periment<span class="bracket">]</span>
  </span>
</div>
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 200, deviceScaleFactor: 3 });
await page.setContent(html, { waitUntil: 'networkidle0' });

// Wait for fonts to be loaded
await page.evaluateHandle('document.fonts.ready');

const el = await page.$('#logo');
const clip = await el.boundingBox();

const outPath = join(outDir, 'chessperiment-logo.png');
await page.screenshot({
  path: outPath,
  clip: { x: clip.x, y: clip.y, width: clip.width, height: clip.height },
  omitBackground: true,   // transparent background
});

await browser.close();
console.log(`Saved ${outPath} (${Math.round(clip.width * 3)}x${Math.round(clip.height * 3)} @3x)`);
