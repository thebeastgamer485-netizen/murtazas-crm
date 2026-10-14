// Renders index.html frame-by-frame (deterministic, driven by window.render(t)).
//   node render.mjs stills 3 8.5 ...   -> stills/s_<t>.jpg
//   node render.mjs video [fps]        -> silent.mp4
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import fs from 'fs';

const mode = process.argv[2] || 'stills';
const URL = 'http://127.0.0.1:8766/index.html?render';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(URL);
await page.evaluate(() => window.ready);
const cdp = await page.context().newCDPSession(page);

async function grab(t, quality = 95) {
  await page.evaluate(t => window.render(t), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality, optimizeForSpeed: false, captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
}

if (mode === 'stills') {
  fs.mkdirSync('stills', { recursive: true });
  for (const t of process.argv.slice(3).map(Number)) fs.writeFileSync(`stills/s_${t.toFixed(2)}.jpg`, await grab(t, 90));
} else {
  const fps = +(process.argv[3] || 60), total = Math.round(60 * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'silent.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const buf = await grab(f / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close();
