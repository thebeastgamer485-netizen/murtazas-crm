// Animated AFAIC logo icon, built from the exact logo geometry (logo-geom.js).
//
//   const icon = createLogoIcon(svgGroup, defs, palette, 'id-prefix');
//   icon.update(bs, glint);   // bs = "build seconds": 0 = nothing, >= 3.7 = finished logo
//                             // glint = 0..1 progress of a light sweep across the gold (or -1 for none)
//
// Choreography (in build seconds):
//   0.15-1.00  construction guides draw (circle, axes, diagonals), then fade
//   0.30-1.35  petal outlines trace themselves while drifting gently inwards
//   1.30-1.80  petals lock into place with a soft overshoot as the fill pours in
//   1.85-2.60  inner rosette blooms ring by ring, clockwise
//   2.30-2.85  the four tip diamonds orbit in and lock
//   2.85-3.60  the centre ignites: core pops, light rays shine out through the gaps
// Requires engine.js (E, P) and logo-geom.js (AFAIC_ICON).

function createLogoIcon(root, defs, pal, id) {
  const NS = 'http://www.w3.org/2000/svg', G = AFAIC_ICON, [cx, cy] = G.center;
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || root).appendChild(e); return e; };
  const grad = (gid, stops, x1, y1, x2, y2) => {
    const g = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', x1, y1, x2, y2 }, defs);
    stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 }, g));
    return `url(#${gid})`;
  };
  const fillOf = (v, gid) => Array.isArray(v) ? grad(id + gid, v, 8, 10, 102, 116) : v;
  const petalFill = fillOf(pal.petal, '-pf'), innerFill = fillOf(pal.inner, '-if'), tipFill = fillOf(pal.tip, '-tf');

  // glow + rays sit behind the shapes
  const rg = el('radialGradient', { id: id + '-ray', gradientUnits: 'userSpaceOnUse', cx, cy, r: 80 }, defs);
  [[0, pal.ray, 0.95], [0.35, pal.ray, 0.35], [1, pal.ray, 0]].forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, rg));
  const rays = el('g', {});
  const RAYS = [];
  for (let k = 0; k < 8; k++) {   // long rays shine out through the four diagonal gaps, short ones on the axes
    const long = k % 2 === 1, a = k * 45 - 90, L = long ? 82 : 46, w = long ? 1.4 : 0.9;
    RAYS.push(el('polygon', { points: `${cx - w},${cy} ${cx + w},${cy} ${cx},${cy - L}`, fill: `url(#${id}-ray)`, transform: `rotate(${a + 90} ${cx} ${cy})` }, rays));
  }
  const burstG = el('radialGradient', { id: id + '-burst', gradientUnits: 'userSpaceOnUse', cx, cy, r: 30 }, defs);
  [[0, pal.ray, 0.9], [0.5, pal.ray, 0.3], [1, pal.ray, 0]].forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, burstG));
  const burst = el('circle', { cx, cy, r: 30, fill: `url(#${id}-burst)` });

  // construction guides
  const guides = el('g', { fill: 'none', stroke: pal.guide, 'stroke-width': 0.22, 'stroke-linecap': 'round' });
  const GUIDES = [el('circle', { cx, cy, r: 50.5 }, guides), el('circle', { cx, cy, r: 18 }, guides)];
  for (const [dx, dy] of [[1, 0], [0, 1], [0.7071, 0.7071], [0.7071, -0.7071]])
    GUIDES.push(el('line', { x1: cx - dx * 56, y1: cy - dy * 56, x2: cx + dx * 56, y2: cy + dy * 56 }, guides));

  // petals (fill + outline travel together)
  const PET = G.petals.map((p, i) => {
    const g = el('g', {});
    const fill = el('path', { d: p.d, fill: petalFill }, g);
    const line = el('path', { d: p.d, fill: 'none', stroke: pal.edge, 'stroke-width': 0.42, 'stroke-linejoin': 'round' }, g);
    const L = line.getTotalLength(); line.style.strokeDasharray = L;
    return { g, fill, line, L, dir: p.dir, i };
  });
  // inner rosette, grouped into rings and ordered clockwise from the top
  const INNER = G.inner.map(p => {
    const e = el('polygon', { points: p.points, fill: innerFill });
    const b = e.getBBox(), ox = b.x + b.width / 2 - cx, oy = b.y + b.height / 2 - cy;
    const d = Math.hypot(ox, oy), ang = (Math.atan2(oy, ox) * 180 / Math.PI + 90 + 360) % 360, axis = Math.min(ang % 90, 90 - ang % 90) < 30;
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    return { e, ring: d > 20 ? 2 : (axis ? 0 : 1), ang };
  });
  [0, 1, 2].forEach(r => INNER.filter(p => p.ring === r).sort((a, b) => a.ang - b.ang).forEach((p, k) => p.t0 = [1.85, 2.05, 2.2][r] + k * [0.035, 0.045, 0.03][r]));
  // tips
  const TIP = G.tips.map((p, i) => {
    const g = el('g', {});
    const e = el('polygon', { points: p.points, fill: tipFill }, g);
    el('polygon', { points: p.points, fill: 'none', stroke: pal.edge, 'stroke-width': 0.3, 'stroke-opacity': 0.7 }, g);
    const b = e.getBBox();
    return { g, x: b.x + b.width / 2, y: b.y + b.height / 2, i };
  });
  // centre
  const core = el('circle', { cx, cy, r: G.coreR, fill: pal.core });
  core.style.transformBox = 'fill-box'; core.style.transformOrigin = 'center';
  // light sweep clipped to the finished shapes
  const clip = el('clipPath', { id: id + '-clip' }, defs);
  G.petals.forEach(p => el('path', { d: p.d }, clip)); G.tips.forEach(p => el('polygon', { points: p.points }, clip));
  el('circle', { cx, cy, r: G.coreR }, clip);
  const sg = el('linearGradient', { id: id + '-sweep', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  [[0, '#fff', 0], [0.5, '#fff', 0.85], [1, '#fff', 0]].forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, sg));
  const sweepG = el('g', { 'clip-path': `url(#${id}-clip)` });
  const sweep = el('rect', { x: -40, y: cy - 90, width: 24, height: 180, fill: `url(#${id}-sweep)` }, sweepG);
  sweep.style.mixBlendMode = 'screen';

  function update(bs, glint = -1) {
    // guides
    const gd = E.inOutSine(P(bs, 0.15, 0.85)), gfade = 1 - E.inOutSine(P(bs, 1.35, 0.55));
    guides.style.opacity = (pal.guideOpacity * gfade).toFixed(3);
    GUIDES.forEach((g, k) => { const L = g.tagName === 'circle' ? 2 * Math.PI * g.getAttribute('r') : 112; g.style.strokeDasharray = L; g.style.strokeDashoffset = (L * (1 - E.inOutSine(P(bs, 0.15 + k * 0.05, 0.8)))).toFixed(2); });
    // petals: trace while drifting in, then lock
    const lock = E.outBackSoft(P(bs, 1.3, 0.5));
    for (const p of PET) {
      const drift = 12 - 3 * P(bs, 0.3, 1.0), off = drift * (1 - lock), rot = (p.i % 2 ? 7 : -7) * (1 - lock);
      p.g.setAttribute('transform', `translate(${(p.dir[0] * off).toFixed(3)} ${(p.dir[1] * off).toFixed(3)}) rotate(${rot.toFixed(3)} ${cx} ${cy})`);
      p.line.style.strokeDashoffset = (p.L * (1 - E.inOutSine(P(bs, 0.3 + p.i * 0.04, 1.05)))).toFixed(2);
      p.line.style.opacity = (P(bs, 0.3, 0.05) * (1 - (1 - pal.edgeRest) * E.inOutSine(P(bs, 1.75, 0.5)))).toFixed(3);
      p.fill.style.opacity = E.outCubic(P(bs, 1.38, 0.45)).toFixed(3);
    }
    // rosette bloom
    for (const p of INNER) {
      const q = P(bs, p.t0, 0.45), s = E.outBackSoft(q);
      p.e.style.opacity = E.outCubic(P(bs, p.t0, 0.15)).toFixed(3);
      p.e.style.transform = `rotate(${(-50 * (1 - E.outCubic(q))).toFixed(2)}deg) scale(${Math.max(0.0001, s).toFixed(4)})`;
    }
    // tips orbit in
    for (const t of TIP) {
      const st = 2.3 + t.i * 0.035, q = E.outQuart(P(bs, st, 0.55)), a = -110 * (1 - q) * Math.PI / 180, r = 1 + 0.7 * (1 - q);
      const fx = t.x - cx, fy = t.y - cy, nx = (fx * Math.cos(a) - fy * Math.sin(a)) * r, ny = (fx * Math.sin(a) + fy * Math.cos(a)) * r;
      t.g.setAttribute('transform', `translate(${(nx - fx).toFixed(3)} ${(ny - fy).toFixed(3)}) rotate(${(-180 * (1 - q)).toFixed(2)} ${t.x} ${t.y})`);
      t.g.style.opacity = E.outCubic(P(bs, st, 0.2)).toFixed(3);
    }
    // ignition
    const ig = P(bs, 2.85, 0.45);
    core.style.transform = `scale(${Math.max(0.0001, E.outBackSoft(ig)).toFixed(4)})`;
    core.style.opacity = (ig > 0 ? 1 : 0);
    const b = P(bs, 2.85, 0.8);
    burst.setAttribute('r', (8 + 70 * E.outCubic(b)).toFixed(2));
    burst.style.opacity = (b > 0 ? (1 - E.inOutSine(b)) * pal.burst : 0).toFixed(3);
    const ry = P(bs, 2.85, 0.9);
    rays.style.opacity = (ry > 0 ? Math.sin(Math.PI * ry) * pal.rays : 0).toFixed(3);
    rays.setAttribute('transform', `rotate(${(12 * ry).toFixed(2)} ${cx} ${cy}) translate(${cx} ${cy}) scale(${(0.3 + 0.9 * E.outCubic(ry)).toFixed(4)}) translate(${-cx} ${-cy})`);
    // light sweep
    sweepG.style.opacity = glint > 0 && glint < 1 ? 1 : 0;
    sweep.setAttribute('x', (-10 + 140 * E.inOutSine(Math.max(0, glint))).toFixed(2));
    sweep.setAttribute('transform', `rotate(24 ${cx} ${cy})`);
  }
  return { update };
}

// Colour schemes
const ICON_GOLD = {
  petal: [[0, '#FFF1C2'], [0.28, '#EAC46B'], [0.52, '#B98A36'], [0.74, '#F4D78C'], [1, '#A57A2E']],
  inner: [[0, '#8C6524'], [1, '#5E4216']],
  tip: [[0, '#F6D78A'], [0.5, '#C7973F'], [1, '#8E6A26']],
  core: '#FFF6DC', edge: '#FFE9AE', edgeRest: 0.55, guide: '#E9C46A', guideOpacity: 0.45, ray: '#FFE6A8', rays: 0.9, burst: 0.95,
};
const ICON_BRAND = {
  petal: '#73AA5E', inner: '#5D8844', tip: '#5D8844',          // the logo's exact flat colours
  core: '#FFFFFF', edge: '#B7DCA8', edgeRest: 0.0, guide: '#A9D296', guideOpacity: 0.5, ray: '#E9F7E2', rays: 0.75, burst: 0.8,
};

// Full logo reveal: the icon builds big at the centre, glides into the lockup, the AFAIC letters rise in,
// the i-dot drops into place and the tagline writes on (timings in seconds, 0 to ~5.8).
//   const reveal = createLogoReveal(svgElement, defsElement, { cx: 960, cy: 540, width: 1100, id: 'brand' });
//   const glide = reveal.update(t);   // returns the 0..1 progress of the icon's glide into the lockup
function createLogoReveal(svg, defs, o = {}) {
  const NS = 'http://www.w3.org/2000/svg', W = AFAIC_WORDMARK, [ICX, ICY] = AFAIC_ICON.center;
  const cx = o.cx ?? 960, cy = o.cy ?? 540, width = o.width ?? 1100, id = o.id ?? 'brand';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const clip = mk('clipPath', { id: id + '-letters' }, defs);
  mk('rect', { x: 120, y: -40, width: 270, height: 133.6 }, clip);          // letters rise from below this line
  const LS = width / 383, LX = cx - 191.5 * LS, LY = cy - 59 * LS;
  const lockup = mk('g', { transform: `translate(${LX} ${LY}) scale(${LS})` }, svg);
  const wordmark = mk('g', { 'clip-path': `url(#${id}-letters)` }, lockup);
  const LETTERS = W.letters.map(d => mk('path', { d, fill: '#72B263' }, wordmark));
  const IDOT = mk('polygon', { points: W.idot, fill: '#5D8844' }, mk('g', {}, lockup));
  IDOT.style.transformBox = 'fill-box'; IDOT.style.transformOrigin = 'center';
  const tag = mk('g', {}, lockup);
  const TAG = W.tagline.map(d => mk('path', { d, fill: o.taglineColor ?? '#F4F1E8' }, tag));
  const iconWrap = mk('g', {}, svg), iconG = mk('g', { transform: `translate(${-ICX} ${-ICY})` }, iconWrap);
  const ICON = createLogoIcon(iconG, defs, o.palette ?? ICON_BRAND, id);
  const START = { x: cx, y: cy, s: 5.4 * width / 1100 }, END = { x: LX + ICX * LS, y: LY + ICY * LS, s: LS };

  function update(t) {
    const m = E.inOutQuart(P(t, 3.55, 0.8));          // 0-3.6 the icon builds at centre; 3.55-4.35 it glides into the lockup
    const x = START.x + (END.x - START.x) * m, y = START.y + (END.y - START.y) * m, s = START.s + (END.s - START.s) * m;
    iconWrap.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})`);
    ICON.update(t, P(t, 5.05, 0.7));
    LETTERS.forEach((l, i) => { const q = E.outQuint(P(t, 3.95 + i * 0.08, 0.7)); l.setAttribute('transform', `translate(0 ${(70 * (1 - q)).toFixed(2)})`); });
    const dq = P(t, 4.5, 0.55);
    IDOT.style.opacity = E.outCubic(P(t, 4.5, 0.12)).toFixed(3);
    IDOT.style.transform = `translateY(${(-60 * (1 - E.outBackSoft(dq))).toFixed(2)}px) rotate(${(-180 * (1 - E.outCubic(dq))).toFixed(2)}deg)`;
    TAG.forEach((g, i) => { const q = P(t, 4.85 + i * 0.022, 0.5); g.style.opacity = E.outCubic(q).toFixed(3); g.setAttribute('transform', `translate(0 ${(4 * (1 - E.outCubic(q))).toFixed(3)})`); });
    return m;
  }
  return { update, START, END };
}
