/* Karel everywhere: on desktop he follows the mouse; any touch or scroll blasts Karels all over the screen. */
(() => {
'use strict';
if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

const ROWS = [
  '.....KKKKKK.....', '...KKRRWRRRKK...', '..KRWRRRRRRWRK..', '.KRRRRRWRRRRRRK.', '.KRWRRRRRRRWRRK.', 'KRRRRWRRRRRRRWRK',
  'KRRRRRRRRRRRRRRK', 'KKKKKKKKKKKKKKKK', '.KggggggggggggK.', '..KKKCCCCCCKKK..', '....KCECCECK....', '....KPCCCCPK....',
  '....KCMMMMCK....', '...KKWWWWWWKK...', '...KWWWWWWWWK...', '...KKwwwwwwKK...', '....KCCCCCCK....', '....KCCCCCCK....',
  '...KCCCCCCCCK...', '..KCCCCCCCCCCK..', '..KwCCCCCCCCwK..', '...KKKKKKKKKK...'];
const PAL = { K:'#14102b', R:'#e63946', W:'#fff', w:'#e8d7b5', g:'#e8d7b5', C:'#fff3e0', E:'#14102b', M:'#14102b', P:'#ff9aa8' };
const SW = 16, SH = 22;
const sprite = document.createElement('canvas'); sprite.width = SW; sprite.height = SH;
const sx = sprite.getContext('2d');
ROWS.forEach((row, j) => { for (let i = 0; i < SW; i++) { const c = PAL[row[i]]; if (c) { sx.fillStyle = c; sx.fillRect(i, j, 1, 1); } } });

const cv = document.createElement('canvas');
cv.setAttribute('aria-hidden', 'true');
cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:45';
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
}
resize(); addEventListener('resize', resize);

/* ---- blast particles ---- */
const MAX = 160, parts = [];
const rnd = (a, b) => a + Math.random() * (b - a);
function spawn(x, y, n, dir) {
  for (let i = 0; i < n && parts.length < MAX; i++) {
    const ang = dir == null ? rnd(0, Math.PI * 2) : dir + rnd(-.7, .7), sp = rnd(260, 820);
    parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rnd(80, 260), r: rnd(-.5, .5), vr: rnd(-9, 9), s: Math.round(rnd(2, 4)), life: 0, max: rnd(1.1, 1.9) });
  }
}
addEventListener('touchstart', e => { for (const t of e.changedTouches) spawn(t.clientX, t.clientY, 14); }, { passive: true });
let lastY = scrollY, scrollAcc = 0;
addEventListener('scroll', () => {
  const d = scrollY - lastY; lastY = scrollY; scrollAcc += Math.abs(d);
  const n = Math.min(8, Math.floor(scrollAcc / 40)); if (!n) return; scrollAcc -= n * 40;
  /* Karels burst in from the edge that the scroll is revealing */
  for (let i = 0; i < n; i++) d > 0 ? spawn(rnd(0, W), H + 20, 1, -Math.PI / 2) : spawn(rnd(0, W), -20, 1, Math.PI / 2);
}, { passive: true });

/* ---- desktop follower ---- */
const fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
const pal = { x: -100, y: -100, tx: -100, ty: -100, on: false, face: 1, hop: 0 };
if (fine) {
  addEventListener('mousemove', e => { pal.tx = e.clientX + 18; pal.ty = e.clientY + 24; if (!pal.on) { pal.on = true; pal.x = pal.tx; pal.y = pal.ty; } });
  document.documentElement.addEventListener('mouseleave', () => { pal.on = false; });
}

function draw(x, y, s, rot, alpha, flip) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip * s, s);
  ctx.drawImage(sprite, -SW / 2, -SH / 2); ctx.restore();
}

let last = 0;
function tick(ts) {
  const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt;
    if (p.life > p.max) { parts.splice(i, 1); continue; }
    p.vy += 1400 * dt; p.vx *= 1 - .6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
    draw(Math.round(p.x), Math.round(p.y), p.s, p.r, Math.min(1, (p.max - p.life) * 3), 1);
  }
  if (pal.on) {
    const dx = pal.tx - pal.x, dy = pal.ty - pal.y, k = 1 - Math.pow(.002, dt);
    pal.x += dx * k; pal.y += dy * k;
    const moving = Math.hypot(dx, dy) > 4; if (Math.abs(dx) > 2) pal.face = dx < 0 ? -1 : 1;
    pal.hop = moving ? pal.hop + dt * 14 : 0;
    const bob = moving ? -Math.abs(Math.sin(pal.hop)) * 6 : 0, tilt = moving ? Math.sin(pal.hop) * .15 : 0;
    draw(Math.round(pal.x), Math.round(pal.y + bob), 2, tilt, 1, pal.face);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();
