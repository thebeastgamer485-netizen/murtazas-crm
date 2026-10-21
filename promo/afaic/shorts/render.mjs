// node render.mjs <page dir> stills t1 t2 ...   |   node render.mjs <page dir> video [seconds] [fps]
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// tiny static server for promo/afaic (so rendering never depends on an external server)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;
const [dir, mode = 'stills', ...rest] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/shorts/${dir}/index.html?render`);
await page.evaluate(() => window.ready);
const cdp = await page.context().newCDPSession(page);
const grab = async (t, q = 95) => { await page.evaluate(t => window.render(t), t); return Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: q })).data, 'base64'); };
if (mode === 'stills') {
  fs.mkdirSync(`${dir}/stills`, { recursive: true });
  for (const t of rest.map(Number)) fs.writeFileSync(`${dir}/stills/s_${t.toFixed(2)}.jpg`, await grab(t, 88));
} else {
  const secs = +(rest[0] || 30), fps = +(rest[1] || 60), total = Math.round(secs * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', `${dir}/silent.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const b = await grab(f / fps);
    if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 600 === 0) console.log(`${dir}: frame ${f}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`${dir}: done ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
