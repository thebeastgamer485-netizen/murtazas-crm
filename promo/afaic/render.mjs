import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import fs from 'fs';
const mode = process.argv[2] || 'stills';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:8765/anim.html?render');
await page.evaluate(() => window.ready);
const grab = t => page.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', .93).split(',')[1]; }, t);
if (mode === 'stills') {
  fs.mkdirSync('stills', { recursive: true });
  for (const t of process.argv.slice(3).map(Number)) fs.writeFileSync(`stills/s_${t}.jpg`, Buffer.from(await grab(t), 'base64'));
} else {
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', 'silent.mp4'], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = 0; f < 1800; f++) {
    const buf = Buffer.from(await grab(f / 30), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
