// Shared keyframe engine for the AFAIC shorts.
// Every property is a list of [time, value, easing] keyframes; render(t) is pure, so frames are deterministic.
const E = {
  linear: p => p,
  inCubic: p => p * p * p,
  outCubic: p => 1 - Math.pow(1 - p, 3),
  inOutCubic: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  outQuart: p => 1 - Math.pow(1 - p, 4),
  inQuart: p => p * p * p * p,
  inOutQuart: p => p < .5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2,
  outQuint: p => 1 - Math.pow(1 - p, 5),
  outExpo: p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
  inExpo: p => p <= 0 ? 0 : Math.pow(2, 10 * p - 10),
  inOutSine: p => -(Math.cos(Math.PI * p) - 1) / 2,
  outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  outBackSoft: p => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  step: p => p >= 1 ? 1 : 0,
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const P = (t, s, d) => clamp((t - s) / d);
const lerp = (a, b, p) => a + (b - a) * p;

function val(frames, t) {
  if (!Array.isArray(frames) || !Array.isArray(frames[0])) return frames;
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, e] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      const f = (E[e || 'inOutCubic'])(t1 === t0 ? 1 : (t - t0) / (t1 - t0));
      return Array.isArray(v1) ? v1.map((x, j) => lerp(v0[j], x, f)) : lerp(v0, v1, f);
    }
  }
  return frames[frames.length - 1][1];
}

// merge several specs: keyframe lists for the same property are concatenated and time-sorted
function M(...specs) {
  const out = {};
  for (const s of specs) for (const k in s) {
    if (k === 'fn') { out.fn = s.fn; continue; }
    out[k] = (out[k] || []).concat(s[k]).sort((a, b) => a[0] - b[0]);
  }
  return out;
}

function apply(el, t, sp) {
  const g = k => sp[k] === undefined ? undefined : val(sp[k], t);
  const x = g('x') ?? 0, y = g('y') ?? 0, s = g('s') ?? 1, r = g('r') ?? 0, sk = g('sk') ?? 0;
  const sx = g('sx') ?? s, sy = g('sy') ?? s;
  if (['x', 'y', 's', 'r', 'sx', 'sy', 'sk'].some(k => sp[k] !== undefined))
    el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${r.toFixed(3)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)}) skewX(${sk.toFixed(3)}deg)`;
  if (sp.o !== undefined) { const o = clamp(g('o')); el.style.opacity = o.toFixed(4); el.style.visibility = o <= 0.001 ? 'hidden' : 'visible'; }
  if (sp.clip !== undefined) { const c = g('clip'); el.style.clipPath = `inset(${c.map(v => v.toFixed(3) + '%').join(' ')})`; }
  if (sp.dash !== undefined) el.style.strokeDashoffset = g('dash').toFixed(2);
  if (sp.w !== undefined) el.style.width = g('w').toFixed(3) + '%';
  if (sp.fn) sp.fn(el, t);
}

// ---- common building blocks
const show = (t0, t1, fi = 0.01, fo = 0.01) => ({ o: [[t0, 0], [t0 + fi, 1, 'linear'], ...(t1 != null ? [[t1, 1], [t1 + fo, 0, 'linear']] : [])] });
const slam = (t0, from = 1.35, d = 0.35) => ({ s: [[t0, from], [t0 + d, 1, 'outExpo']] });
const rise = (t0, dist = 120, d = 0.5, ease = 'outExpo') => ({ y: [[t0, dist], [t0 + d, 0, ease]] });
const slide = (t0, dx, d = 0.5, ease = 'outExpo') => ({ x: [[t0, dx], [t0 + d, 0, ease]] });

let TIMELINE = [];      // [[element, spec], ...]
let EXTRA = () => {};   // per-page hook
let DURATION = 30;
function setup(list, duration, extra) {
  TIMELINE = list.map(([sel, sp]) => [typeof sel === 'string' ? document.querySelector(sel) : sel, sp]).filter(([el, sp]) => {
    if (!el) console.warn('missing element', sp); return !!el;
  });
  DURATION = duration; if (extra) EXTRA = extra;
}
function render(t) { for (const [el, sp] of TIMELINE) apply(el, t, sp); EXTRA(t); }
window.render = render;

window.ready = (async () => {
  await new Promise(r => window.addEventListener('load', r, { once: true }));
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  await document.fonts.ready;
  render(0);
  return true;
})();
window.ready.then(() => {
  if (location.search.includes('render')) return;
  const start = +(new URLSearchParams(location.search).get('t') || 0), t0 = performance.now();
  (function loop() { render((start + (performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); })();
});
