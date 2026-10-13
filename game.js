/* Mushroom Picking Simulator: a tiny pixel game for the Trapný site.
   Pick mushrooms. Every 3-4 of them, the uncle pops out of the ground and says "SUP BRO!" */
(() => {
'use strict';
const cv = document.getElementById('game');
if (!cv) return;
const ctx = cv.getContext('2d');
const W = 320, H = 180, TOP = 84, BOT = 168, LEFT = 12, RIGHT = 308;
cv.width = W; cv.height = H;
const INK = '#14102b', CREAM = '#fff3e0', YEL = '#ffe14d', PINK = '#ff3d8b', CYAN = '#3df2ff', RED = '#e63946';
const L = window.L || (s => s);
const FONT = (s, str) => (window.TRAPNY_LANG === 'cs' || (str && /[\u00C0-\u024F]/.test(str))) ? s + 'px "Pixel CZ", ui-monospace, monospace' : s + 'px "Press Start 2P", ui-monospace, monospace';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

let G = ctx;
function px(x, y, w, h, c) { if (w <= 0 || h <= 0) return; G.fillStyle = c; G.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function txt(s, x, y, size, color, align, shadow) {
  s = L(s); ctx.font = FONT(size, s); ctx.textBaseline = 'top'; ctx.textAlign = align || 'left';
  if (shadow !== null) { ctx.fillStyle = shadow || '#000'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1); }
  ctx.fillStyle = color; ctx.fillText(s, Math.round(x), Math.round(y));
}
function disc(cx, cy, rad, c) { for (let dy = -rad; dy <= rad; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, rad * rad - dy * dy) + .5)); px(cx - w, cy + dy, w * 2 + 1, 1, c); } }
function bubble(t, x, y, k) {
  if (k <= 0) return;
  t = L(t); ctx.font = FONT(8, t);
  const w = Math.ceil(ctx.measureText(t).width) + 10, h = 15;
  const bx = clamp(Math.round(x - w / 2), 2, W - w - 2), by = Math.round(y - h - 5);
  const tx = clamp(Math.round(x), bx + 6, bx + w - 6);
  ctx.save(); ctx.translate(tx, y); ctx.scale(k, k); ctx.translate(-tx, -y);
  px(bx - 2, by - 2, w + 4, h + 4, INK); px(bx, by, w, h, CREAM);
  px(tx - 3, by + h, 7, 4, INK); px(tx - 2, by + h - 1, 5, 4, CREAM);
  txt(t, bx + 5, by + 4, 8, INK, 'left', null);
  ctx.restore();
}

/* ---------- scenery ---------- */
function pine(x, base, h, c1, c2) {
  const step = Math.round(h / 5);
  px(x - 2, base - step, 4, step, '#3a2410');
  for (let k = 0; k < 4; k++) { const w = Math.round(h * .15 + k * h * .17); px(x - w / 2, base - h + k * step, w, step + 2, k % 2 ? c1 : c2); }
}
const SKY = ['#26307a', '#2f4fa8', '#3d77c9', '#58a0e0', '#7cc4ee', '#a8dff5', '#d2f1f9'];
let bgCanvas = null;
function buildBg() {
  bgCanvas = document.createElement('canvas'); bgCanvas.width = W; bgCanvas.height = H;
  G = bgCanvas.getContext('2d');
  const bh = Math.ceil(TOP / SKY.length);
  SKY.forEach((c, i) => px(0, i * bh, W, bh + 1, c));
  disc(54, 28, 9, YEL);
  for (let i = 0; i < 9; i++) pine(i * 40 - 6, TOP - 4, 46 + (i * 7 % 4) * 5, '#3b6ea5', '#4580b8');
  for (let i = 0; i < 8; i++) pine(i * 46 + 14, TOP + 6, 58 + (i * 5 % 4) * 5, '#1f6b45', '#2a8553');
  px(0, TOP, W, H - TOP, '#174d33'); px(0, TOP, W, 3, '#4fb85a');
  for (let i = 0; i < 90; i++) px(hash(i) * W, TOP + 5 + hash(i + 40) * (H - TOP - 6), 2, 1, i % 3 ? '#2f8f4e' : '#1d6b3b');
  for (let i = 0; i < 14; i++) { const x = hash(i + 200) * W, y = TOP + 10 + hash(i + 300) * (H - TOP - 14); px(x, y, 1, 1, '#ffe14d'); px(x - 1, y, 1, 1, '#fff'); px(x + 1, y, 1, 1, '#fff'); px(x, y - 1, 1, 1, '#fff'); px(x, y + 1, 1, 1, '#fff'); }
  G = ctx;
}

/* ---------- sprites ---------- */
function girl(x, y, s, o) {
  const t = o.t || 0, f = o.face || 1;
  const g = ctx;
  g.save(); g.translate(Math.round(x), 0); g.scale(f, 1); g.translate(-Math.round(x), 0);
  const r = (a, b, w, h, c) => px(x + (a - 6) * s, y + (b - 16) * s, w * s, h * s, c);
  px(x - 7 * s, y - 1, 14 * s, Math.max(2, s), 'rgba(0,0,0,.28)');
  const st = o.walk ? Math.round(Math.sin(t * 14)) : 0;
  r(3, 12 + (st > 0 ? -1 : 0), 2, 3, '#2b3a67'); r(7, 12 + (st < 0 ? -1 : 0), 2, 3, '#2b3a67');
  r(2, 15, 3, 1, CREAM); r(7, 15, 3, 1, CREAM);
  r(1, 3, 1, 6, '#f6d04d'); r(10, 3, 1, 6, '#f6d04d');
  r(2, 7, 8, 4, '#8a6cff'); r(2, 7, 8, 1, '#6b4fe0');
  r(2, 11, 8, 2, '#ff8ac1'); r(2, 13, 8, 1, '#d96aa6');
  const up = o.cheer ? 1 : 0;
  r(1, 8 - up * 4, 1, 4, '#8a6cff'); r(10, 8 - up * 4, 1, 4, '#8a6cff');
  if (up) { r(1, 3, 1, 1, '#f4b183'); r(10, 3, 1, 1, '#f4b183'); } else { r(1, 12, 1, 1, '#f4b183'); r(10, 12, 1, 1, '#f4b183'); }
  r(2, 2, 8, 5, '#f4b183');
  r(2, 1, 8, 2, '#f6d04d'); r(2, 3, 2, 1, '#f6d04d'); r(8, 3, 2, 1, '#f6d04d');
  r(8, 0, 3, 2, PINK); r(7, 0, 1, 1, PINK);
  r(2, 0, 8, 1, PINK); r(0, 3, 1, 3, PINK); r(11, 3, 1, 3, PINK);
  if (o.mood === 'panic') { r(3, 3, 2, 2, '#fff'); r(7, 3, 2, 2, '#fff'); r(4, 3, 1, 1, INK); r(8, 3, 1, 1, INK); r(5, 5, 2, 1, '#7a1020'); r(3, 6, 1, 1, '#ff8aa0'); r(8, 6, 1, 1, '#ff8aa0'); }
  else if (o.mood === 'happy') { r(3, 4, 2, 1, INK); r(7, 4, 2, 1, INK); r(4, 5, 4, 1, '#7a1020'); }
  else { r(3, 3, 2, 2, '#fff'); r(7, 3, 2, 2, '#fff'); r(4, 4, 1, 1, INK); r(8, 4, 1, 1, INK); r(5, 5, 2, 1, INK); }
  r(10, 8, 4, 1, '#6b3f17'); r(10, 9, 4, 3, '#a0642b'); r(10, 10, 4, 1, '#6b3f17');
  if (o.basket > 0) { r(10, 8, 1, 1, RED); if (o.basket > 1) r(12, 8, 1, 1, '#d9a066'); }
  if (o.sweat) { const q = Math.floor((t * 3) % 3); r(10, 1 + q, 1, 2, CYAN); }
  g.restore();
}
function uncle(x, y, s, o) {
  const t = o.t || 0, g = ctx;
  const r = (a, b, w, h, c) => px(x + (a - 6) * s, y + (b - 16) * s, w * s, h * s, c);
  r(3, 12, 2, 3, '#2f55b8'); r(7, 12, 2, 3, '#2f55b8'); r(2, 15, 3, 1, '#fff'); r(7, 15, 3, 1, '#fff');
  r(1, 7, 10, 5, '#f4f1ff'); r(1, 9, 10, 1, RED); r(1, 11, 10, 1, '#2f55b8'); r(1, 7, 1, 5, INK); r(10, 7, 1, 5, INK);
  const wave = o.wave ? Math.round(Math.sin(t * 12)) : 0;
  r(1, 8, 1, 4, '#f4f1ff'); r(10, 8, 1, 4, '#f4f1ff');
  if (o.wave) { r(10, 3 + (wave > 0 ? 0 : 1), 1, 5, '#f4f1ff'); r(10, 2 + (wave > 0 ? 0 : 1), 2, 1, '#fbc9a2'); } else { r(1, 12, 1, 1, '#fbc9a2'); r(10, 12, 1, 1, '#fbc9a2'); }
  r(2, 2, 8, 5, '#fbc9a2');
  r(1, 3, 1, 4, '#7a4a24'); r(10, 3, 1, 4, '#7a4a24'); r(2, 2, 2, 1, '#7a4a24'); r(8, 2, 2, 1, '#7a4a24');
  r(5, 2, 2, 1, '#fff0e0');
  r(3, 3, 3, 3, '#3a2a1a'); r(6, 3, 3, 3, '#3a2a1a'); r(4, 4, 1, 1, '#fff'); r(7, 4, 1, 1, '#fff'); r(5, 3, 1, 1, '#fbc9a2'); r(8, 3, 1, 1, '#fbc9a2');
  if (o.talk) { const op = Math.floor(t * 9) % 2; r(4, 6, 4, op ? 1 : 1, '#7a1020'); if (op) r(4, 6, 4, 1, '#7a1020'); } else r(4, 6, 4, 1, INK);
  void g;
}
function anezka(x, y, s, o) {
  const t = o.t || 0, f = o.face || 1, g = ctx;
  g.save(); g.translate(Math.round(x), 0); g.scale(f, 1); g.translate(-Math.round(x), 0);
  const r = (a, b, w, h, c) => px(x + (a - 6) * s, y + (b - 16) * s, w * s, h * s, c);
  px(x - 7 * s, y - 1, 14 * s, Math.max(2, s), 'rgba(0,0,0,.28)');
  const st = o.walk ? Math.round(Math.sin(t * 14)) : 0;
  r(3, 12 + (st > 0 ? -1 : 0), 2, 3, '#fbd1b0'); r(7, 12 + (st < 0 ? -1 : 0), 2, 3, '#fbd1b0');
  r(2, 15, 3, 1, '#ffd23f'); r(7, 15, 3, 1, '#ffd23f');
  r(10, 4, 2, 6, '#f1e0a0'); r(11, 9, 2, 3, '#f1e0a0'); r(10, 3, 2, 1, PINK);
  r(2, 7, 8, 5, '#2ec4b6'); r(2, 11, 8, 1, '#1f9e92');
  r(1, 8, 1, 4, '#2ec4b6'); r(10, 8, 1, 4, '#2ec4b6'); r(1, 12, 1, 1, '#fbd1b0'); r(10, 12, 1, 1, '#fbd1b0');
  r(2, 2, 8, 5, '#fbd1b0'); r(2, 1, 8, 2, '#f1e0a0'); r(2, 3, 2, 2, '#f1e0a0'); r(8, 3, 2, 1, '#f1e0a0');
  r(3, 3, 2, 2, '#fff'); r(7, 3, 2, 2, '#fff'); r(4, 4, 1, 1, INK); r(8, 4, 1, 1, INK);
  if (o.talk) { r(4, 5, 4, 1, '#7a1020'); r(4, 5, 4, 1, '#ff7a8a'); } else r(5, 5, 2, 1, INK);
  r(3, 5, 1, 1, '#ff9aa8'); r(8, 5, 1, 1, '#ff9aa8');
  g.restore();
}
const GOLD_KAREL = ['...KKKK...', '.KKYOYYKK.', 'KYYYYYYOYK', 'KYOYYYYYYK', 'KKKKKKKKKK', '..KCCCCK..', '..KECCEK..', '..KCMMCK..', '.KWWWWWWK.', '..KCCCCK..', '.KCCCCCCK.', '..KKKKKK..'];
const GOLD_PAL = { K:INK, Y:'#ffd23f', O:'#fff08a', C:CREAM, E:INK, M:INK, P:'#ff9aa8', W:'#fff' };
function mushroom(x, y, type, t, pop) {
  const s = 1 + (pop > 0 ? Math.sin(pop * Math.PI) * .5 : 0);
  const R = (a, b, w, h, c) => px(x + (a - 5) * s, y + (b - 9) * s, w * s, h * s, c);
  px(x - 5, y, 10, 2, 'rgba(0,0,0,.3)');
  if (type === 2) { // brown bolete
    R(1, 0, 8, 4, INK); R(2, 1, 6, 3, '#a0642b'); R(2, 1, 6, 1, '#c98a4b'); R(3, 4, 4, 4, '#e8d7b5'); R(4, 7, 2, 1, '#cbb98f');
  } else if (type === 3) { // golden Karel: tall fly agaric (cap, ring, bulb), 10x12, standing on y
    GOLD_KAREL.forEach((row, j) => [...row].forEach((ch, i) => { const c = GOLD_PAL[ch]; if (c) px(x + (i - 5) * s, y + (j - 12) * s, s, s, c); }));
    const a = Math.floor(t * 4) % 2; px(x - 7, y - 15 + a, 1, 3, YEL); px(x - 8, y - 14 + a, 3, 1, YEL);
  } else { // red fly agaric
    R(0, 0, 10, 4, INK); R(1, 1, 8, 3, RED); R(2, 1, 2, 1, '#fff'); R(6, 1, 2, 1, '#fff'); R(4, 2, 1, 1, '#fff'); R(3, 4, 4, 4, CREAM); R(4, 7, 2, 1, '#e8d7b5');
  }
}

/* ---------- state ---------- */
const BEST_KEY = 'trapny-game-best-time';
const GOAL = 25;
const S = {
  t: 0, time: 0, mode: 'play', fin: null, megas: 0, newBest: false,
  p: { x: 160, y: 130, tx: null, ty: null, face: 1, walk: false, cringe: 0, cheer: 0 },
  mush: [], picked: 0, sup: 0, since: 0, next: 3 + (Math.random() < .5 ? 0 : 1), meter: 0, bestTime: 0,
  uncle: null, fx: [], shake: 0, flash: 0, banner: 0, hint: 6, started: false
};
try { S.bestTime = parseFloat(localStorage.getItem(BEST_KEY) || '0') || 0; } catch (e) {}
let uid = 1;
function spawnMush(initial) {
  for (let tries = 0; tries < 20; tries++) {
    const x = 20 + Math.random() * (W - 40), y = TOP + 8 + Math.random() * (BOT - TOP - 14);
    if (Math.hypot(x - S.p.x, y - S.p.y) < 40) continue;
    if (S.mush.some(m => Math.hypot(m.x - x, m.y - y) < 22)) continue;
    const r = Math.random();
    S.mush.push({ id: uid++, x, y, type: r < .12 ? 3 : (r < .5 ? 2 : 1), pop: initial ? 0 : 1 });
    return;
  }
}
for (let i = 0; i < 6; i++) spawnMush(true);

/* ---------- sound (tiny blips, only after the player interacts) ---------- */
let AC = null, muted = false;
function beep(f, d, type, vol, slide) {
  if (muted) return;
  try {
    if (!AC) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; AC = new A(); }
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, n); if (slide) o.frequency.exponentialRampToValueAtTime(slide, n + d);
    g.gain.setValueAtTime(vol || .05, n); g.gain.exponentialRampToValueAtTime(.0001, n + d);
    o.connect(g); g.connect(AC.destination); o.start(n); o.stop(n + d + .02);
  } catch (e) {}
}
const sndPick = () => { beep(660, .08, 'square', .05); setTimeout(() => beep(990, .1, 'square', .05), 70); };
const sndGold = () => { [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => beep(f, .1, 'square', .05), i * 70)); };
const sndPop = () => { beep(120, .25, 'sawtooth', .08, 40); setTimeout(() => beep(300, .12, 'square', .06, 600), 220); };
const sndMega = () => { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .14, 'triangle', .07), i * 90)); };

/* ---------- game logic ---------- */
function addFx(x, y, text, color) { S.fx.push({ x, y, text, color, t: 0, life: 1 }); }
function addDirt(x, y, n) { for (let i = 0; i < n; i++) S.fx.push({ x, y, dx: (Math.random() - .5) * 70, dy: -30 - Math.random() * 50, t: 0, life: .7, dirt: true }); }
function uncleAppears() {
  const p = S.p; let x = 0, y = 0;
  for (let i = 0; i < 12; i++) {
    const side = Math.random() < .5 ? -1 : 1;
    x = clamp(p.x + side * (36 + Math.random() * 44), 24, W - 24);
    y = clamp(p.y + (Math.random() - .5) * 40, TOP + 12, BOT);
    if (Math.hypot(x - p.x, y - p.y) > 30) break;
  }
  S.uncle = { x, y, t: 0, phase: 'rise', counted: false };
  sndPop();
}
function pick(m) {
  S.mush.splice(S.mush.indexOf(m), 1);
  const gold = m.type === 3;
  S.picked += gold ? 5 : 1;
  S.since += 1;
  S.p.cheer = .5;
  addFx(m.x, m.y - 10, gold ? '+5 KAREL!' : '+1', gold ? YEL : CREAM);
  for (let i = 0; i < 6; i++) S.fx.push({ x: m.x, y: m.y - 4, dx: (Math.random() - .5) * 60, dy: -20 - Math.random() * 40, t: 0, life: .5, spark: true });
  gold ? sndGold() : sndPick();
  setTimeout(() => { if (S.mode === 'play') spawnMush(false); }, 400);
  if (S.mode === 'play' && S.picked >= GOAL) { startFinale(); return; }
  if (S.since >= S.next && !S.uncle) { S.since = 0; S.next = 3 + (Math.random() < .5 ? 0 : 1); setTimeout(() => { if (S.mode === 'play') uncleAppears(); }, 350); }
}
const keys = {};
function startFinale() {
  S.mode = 'finale'; S.mush = []; S.p.tx = S.p.ty = null; S.p.walk = false;
  for (const k in keys) keys[k] = false;
  S.fin = { t: 0, popped: false, ax: 0, ay: 0, tx: 0, from: 0, cheered: false };
  sndMega();
}
function resetGame() {
  S.t = 0; S.time = 0; S.mode = 'play'; S.fin = null; S.megas = 0; S.newBest = false;
  Object.assign(S.p, { x: 160, y: 130, tx: null, ty: null, face: 1, walk: false, cringe: 0, cheer: 0 });
  S.mush = []; S.picked = 0; S.sup = 0; S.since = 0; S.next = 3 + (Math.random() < .5 ? 0 : 1); S.meter = 0;
  S.uncle = null; S.fx = []; S.shake = 0; S.flash = 0; S.banner = 0; S.hint = 6; S.started = false;
  for (let i = 0; i < 6; i++) spawnMush(true);
  const rb = document.getElementById('greplay'); if (rb) rb.hidden = true;
}
function updateFinale(dt) {
  const f = S.fin, p = S.p; f.t += dt;
  if (f.t >= .4 && !f.popped) { f.popped = true; uncleAppears(); }
  if (f.t >= 3 && !f.from) {
    f.from = 1; f.ay = clamp(p.y + 6, TOP + 14, BOT); f.tx = p.x < W - 90 ? p.x + 50 : p.x - 50; f.ax = f.tx > p.x ? W + 24 : -24; f.sx = f.ax;
  }
  if (f.from) { const k = ease((f.t - 3) / 1.6); f.ax = lerp(f.sx, f.tx, k); p.face = f.tx > p.x ? 1 : -1; }
  if (f.t >= 7 && !f.cheered) { f.cheered = true; p.cheer = 1.6; sndGold(); }
  if (f.t >= 9 && S.mode === 'finale') {
    S.mode = 'done';
    if (!S.bestTime || S.time < S.bestTime) { S.newBest = !!S.bestTime || true; S.bestTime = S.time; try { localStorage.setItem(BEST_KEY, String(S.time)); } catch (e) {} } else S.newBest = false;
    const rb = document.getElementById('greplay'); if (rb) rb.hidden = false;
  }
}
const fmtT = t => { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
function update(dt) {
  S.t += dt; const p = S.p;
  if (S.mode === 'play') S.time += dt; else updateFinale && S.fin && updateFinale(dt);
  if (S.hint > 0 && S.started) S.hint -= dt;
  p.cheer = Math.max(0, p.cheer - dt); p.cringe = Math.max(0, p.cringe - dt);
  S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt * 3); S.banner = Math.max(0, S.banner - dt);
  S.meter = Math.max(0, S.meter - dt * 3);
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  p.walk = false;
  if (p.cringe <= 0 && S.mode === 'play') {
    if (dx || dy) { p.tx = null; const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
    else if (p.tx != null) {
      const ex = p.tx - p.x, ey = p.ty - p.y, d = Math.hypot(ex, ey);
      if (d < 2) p.tx = p.ty = null; else { dx = ex / d; dy = ey / d; }
    }
    if (dx || dy) {
      const sp = 74 * dt; p.x = clamp(p.x + dx * sp, LEFT, RIGHT); p.y = clamp(p.y + dy * sp, TOP + 6, BOT);
      if (Math.abs(dx) > .2) p.face = dx > 0 ? 1 : -1; p.walk = true;
    }
  }
  for (const m of S.mush.slice()) {
    if (m.pop > 0) m.pop = Math.max(0, m.pop - dt * 3);
    if (S.mode === 'play' && Math.hypot(m.x - p.x, m.y - (p.y - 2)) < 13) pick(m);
  }
  const u = S.uncle;
  if (u) {
    u.t += dt;
    if (u.phase === 'rise' && u.t > .6) {
      u.phase = 'talk'; u.t = 0; S.sup += 1; S.meter = Math.min(100, S.meter + 34);
      p.cringe = 1.6; S.shake = .45; S.flash = .6; addDirt(u.x, u.y, 14);
      p.tx = p.ty = null; p.face = u.x > p.x ? 1 : -1;
      if (S.meter >= 100) { S.banner = 2; S.meter = 0; S.megas += 1; if (S.mode === 'play') sndMega(); }
    } else if (u.phase === 'talk' && u.t > 2.1) { u.phase = 'sink'; u.t = 0; }
    else if (u.phase === 'sink' && u.t > .5) { S.uncle = null; }
  }
  S.fx = S.fx.filter(f => { f.t += dt; if (f.dirt || f.spark) { f.x += f.dx * dt; f.y += f.dy * dt; f.dy += 160 * dt; } return f.t < f.life; });
}

/* ---------- drawing ---------- */
function drawMound(u, k) {
  // hole + dirt lip around the uncle
  const x = Math.round(u.x), y = Math.round(u.y);
  px(x - 12, y - 2, 24, 5, INK); px(x - 10, y - 1, 20, 3, '#2a1a10');
  return { x, y };
}
function drawUncle(u) {
  const k = u.phase === 'rise' ? ease(u.t / .6) : (u.phase === 'sink' ? 1 - ease(u.t / .5) : 1);
  const m = drawMound(u);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, m.y + 1); ctx.clip();
  uncle(u.x, u.y + (1 - k) * 36, 2, { t: S.t, talk: u.phase === 'talk', wave: u.phase === 'talk' });
  ctx.restore();
  px(m.x - 13, m.y - 1, 6, 4, '#6b4a2b'); px(m.x + 7, m.y - 1, 6, 4, '#6b4a2b'); px(m.x - 9, m.y + 1, 18, 3, '#7a5535'); px(m.x - 15, m.y + 1, 4, 3, '#5a3a22'); px(m.x + 11, m.y + 1, 4, 3, '#5a3a22');
  if (u.phase === 'talk') bubble('SUP BRO!', u.x, u.y - 40, popK(u.t / .25));
}
const popK = t => t < 0 ? 0 : t < .6 ? t / .6 * 1.2 : t < 1 ? 1.2 - .2 * ((t - .6) / .4) : 1;

function render() {
  const g = ctx;
  g.imageSmoothingEnabled = false;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  g.save();
  if (S.shake > 0 && !REDUCE) g.translate(Math.round((Math.random() - .5) * 6 * S.shake), Math.round((Math.random() - .5) * 4 * S.shake));
  g.drawImage(bgCanvas, 0, 0);
  // clouds
  const cl = (x, y) => { px(x, y + 3, 26, 5, 'rgba(255,255,255,.4)'); px(x + 4, y, 12, 6, 'rgba(255,255,255,.4)'); px(x + 14, y + 1, 10, 5, 'rgba(255,255,255,.4)'); };
  cl(((120 - S.t * 4) % 380 + 380) % 380 - 50, 14); cl(((250 - S.t * 2.5) % 380 + 380) % 380 - 50, 34);
  // drawables sorted by y
  const list = [];
  S.mush.forEach(m => list.push({ y: m.y, d: () => mushroom(m.x, m.y, m.type, S.t, m.pop) }));
  list.push({ y: S.p.y, d: () => girl(S.p.x, S.p.y, 2, { t: S.t, face: S.p.face, walk: S.p.walk, cheer: S.p.cheer > 0, mood: S.p.cringe > 0 ? 'panic' : (S.p.cheer > 0 ? 'happy' : 'flat'), sweat: S.p.cringe > 0, basket: Math.min(2, S.picked) }) });
  if (S.uncle) list.push({ y: S.uncle.y, d: () => drawUncle(S.uncle) });
  if (S.fin && S.fin.from) list.push({ y: S.fin.ay, d: () => anezka(S.fin.ax, S.fin.ay, 2, { t: S.t, face: S.fin.tx > S.p.x ? -1 : 1, walk: S.fin.t < 4.6, talk: S.fin.t >= 4.8 && S.fin.t < 7 }) });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  // finale speech bubbles
  if (S.fin && S.fin.from) {
    const f = S.fin;
    if (f.t >= 4.8 && f.t < 7) bubble('I LOVE MUSHROOM PICKING!', clamp(f.ax, 50, W - 50), f.ay - 40, popK((f.t - 4.8) / .25));
    if (f.t >= 7 && f.t < 9.2) bubble('TOTALLY.', S.p.x, S.p.y - 42, popK((f.t - 7) / .25));
  }
  // effects
  S.fx.forEach(f => {
    const k = f.t / f.life;
    if (f.dirt) px(f.x, f.y, 2, 2, k < .5 ? '#6b4a2b' : '#4a3220');
    else if (f.spark) px(f.x, f.y, 2, 2, Math.floor(f.t * 20) % 2 ? YEL : '#fff');
    else { ctx.globalAlpha = 1 - k * k; txt(f.text, f.x, f.y - k * 16, 8, f.color, 'center'); ctx.globalAlpha = 1; }
  });
  g.restore();
  if (S.flash > 0 && !REDUCE) { g.fillStyle = 'rgba(255,255,255,' + (S.flash * .35).toFixed(2) + ')'; g.fillRect(0, 0, W, H); }
  // HUD
  g.fillStyle = 'rgba(8,5,24,.8)'; g.fillRect(0, 0, W, 13);
  txt(L('PICKED ') + Math.min(S.picked, GOAL) + '/' + GOAL, 4, 3, 8, CREAM, 'left', null);
  txt('SUP BRO x' + S.sup, 118, 3, 8, YEL, 'left', null);
  px(256, 3, 60, 8, INK); px(257, 4, 58, 6, '#3a2a7a'); px(257, 4, Math.round(58 * S.meter / 100), 6, PINK);
  txt('TRAPNÝ', 212, 3, 8, CREAM, 'left', null);
  px(0, 13, W, 2, '#3a2a7a'); px(0, 13, Math.round(W * Math.min(1, S.picked / GOAL)), 2, YEL);
  if (S.banner > 0) { const b = Math.floor(S.t * 8) % 2; txt('MEGA TRAPNÝ!', W / 2, 60, 16, b ? YEL : PINK, 'center'); }
  if (S.mode === 'done') {
    g.fillStyle = 'rgba(8,5,24,.82)'; g.fillRect(0, 13, W, H - 13);
    px(50, 28, 220, 126, INK); px(53, 31, 214, 120, '#2a1f55'); px(53, 31, 214, 3, CYAN);
    txt('MEGA FUN!', W / 2, 40, 16, Math.floor(S.t * 4) % 2 ? PINK : YEL, 'center');
    txt('FAMILY TRADITION UNLOCKED', W / 2, 62, 8, CREAM, 'center');
    txt(L('MUSHROOMS  ') + S.picked, 76, 80, 8, CREAM, 'left');
    txt(L('SUP BROS   ') + S.sup, 76, 92, 8, YEL, 'left');
    txt(L('TIME       ') + fmtT(S.time), 76, 104, 8, CREAM, 'left');
    txt(L('BEST TIME  ') + fmtT(S.bestTime) + (S.newBest ? L('  NEW!') : ''), 76, 116, 8, CYAN, 'left');
    if (Math.floor(S.t * 2) % 2) txt(COARSE ? 'TAP TO PLAY AGAIN' : 'CLICK OR PRESS ENTER', W / 2, 136, 8, PINK, 'center');
  }
  if (S.hint > 0 && S.mode === 'play') { g.fillStyle = 'rgba(8,5,24,.7)'; g.fillRect(40, 150, 240, 20); txt(S.started ? 'GRAB THE MUSHROOMS...' : (COARSE ? 'TAP OR USE THE BUTTONS' : 'ARROWS / WASD OR CLICK TO MOVE'), W / 2, 156, 8, YEL, 'center', null); }
}

/* ---------- input ---------- */
const keyMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
let visible = true;
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible) for (const k in keys) keys[k] = false; }, { threshold: .4 }).observe(cv);
document.addEventListener('keydown', e => {
  if (S.mode === 'done' && visible && (e.key === 'Enter') && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) { e.preventDefault(); resetGame(); return; }
  const k = keyMap[e.key]; if (!k || !visible) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  e.preventDefault(); keys[k] = true; S.started = true;
});
document.addEventListener('keyup', e => { const k = keyMap[e.key]; if (k) keys[k] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function toWorld(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
let dragging = false, down = null;
function aim(e) { const [x, y] = toWorld(e); S.p.tx = clamp(x, LEFT, RIGHT); S.p.ty = clamp(y + 4, TOP + 6, BOT); S.started = true; }
cv.addEventListener('pointerdown', e => {
  if (S.mode === 'done') { if (S.fin && S.fin.t > 9.6) resetGame(); return; }
  if (S.mode !== 'play') return;
  down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  if (e.pointerType !== 'touch') { dragging = true; try { cv.setPointerCapture(e.pointerId); } catch (er) {} aim(e); beep(440, .04, 'square', .02); }
});
cv.addEventListener('pointermove', e => { if (dragging) aim(e); });
cv.addEventListener('pointerup', e => {
  dragging = false;
  // touch: a short tap moves the girl, a vertical drag is left to scroll the page
  if (e.pointerType === 'touch' && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12 && performance.now() - down.t < 500) { aim(e); beep(440, .04, 'square', .02); }
  down = null;
});
cv.addEventListener('pointercancel', () => { dragging = false; down = null; });
document.querySelectorAll('#dpad [data-k]').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); keys[k] = true; S.started = true; S.p.tx = S.p.ty = null; b.classList.add('down'); try { b.setPointerCapture(e.pointerId); } catch (er) {} };
  const off = () => { keys[k] = false; b.classList.remove('down'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
const COARSE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const rpb = document.getElementById('greplay'); if (rpb) rpb.addEventListener('click', resetGame);
const mus = document.getElementById('gmusic'); if (mus) mus.addEventListener('click', () => { if (window.__toggleSong) window.__toggleSong(); });
const mb = document.getElementById('gmute');
if (mb) mb.addEventListener('click', () => { muted = !muted; mb.textContent = L(muted ? 'SOUND: OFF' : 'SOUND: ON'); mb.setAttribute('aria-pressed', String(muted)); });

/* ---------- loop ---------- */
buildBg();
let last = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
  if (visible && !document.hidden) { update(dt); }
  render();
  requestAnimationFrame(frame);
}
window.__game = { S, update, render, pick, uncleAppears, resetGame, GOAL };
requestAnimationFrame(frame);
})();
