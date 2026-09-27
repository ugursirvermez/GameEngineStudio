// Benzetim → oyun: sarkaç. Aynı modele hedef ve geri bildirim eklenince oyuna dönüşür.
import { h, slider, seg, button, canvasStage, loop, clamp, tr, rr, COL } from './ui.js';

const G = { dunya: { n: 'Dünya', g: 9.81 }, ay: { n: 'Ay', g: 1.62 }, mars: { n: 'Mars', g: 3.71 }, jupiter: { n: 'Jüpiter', g: 24.79 } };
const LEVELS = [
  { pl: 'dunya', T: 2.0 },
  { pl: 'ay', T: 2.0 },
  { pl: 'mars', T: 1.5 },
];
const TOL = 0.05;

export default function mount(root) {
  const st = canvasStage(root, { aspect: 0.46, min: 300, max: 440 });
  const { ctx } = st;

  let L = 1.5, pl = 'dunya', th = 0.35, om = 0, simT = 0;
  let dragging = false, lastCross = null, periods = [], trace = [];
  let game = false, lvl = 0, tries = 0, won = false, okStreak = 0;

  const g = () => G[pl].g;
  const Tth = () => 2 * Math.PI * Math.sqrt(L / g());
  const resetMeasure = () => { lastCross = null; periods = []; okStreak = 0; };

  // --- denetimler ---
  const slL = slider({ label: 'İp uzunluğu', min: 0.1, max: 2.5, step: 0.01, value: L, fmt: (v) => tr(v) + ' m', oninput: (v) => { L = v; resetMeasure(); } });
  const sgG = seg({
    label: 'Gezegen',
    options: Object.entries(G).map(([v, o]) => ({ v, t: o.n })), value: pl,
    onchange: (v) => { if (game) { sgG.set(pl); return; } pl = v; resetMeasure(); },
  });
  const sgMode = seg({ options: [{ v: 'sim', t: 'Benzetim' }, { v: 'oyun', t: 'Oyunlaştır' }], value: 'sim', onchange: (v) => setMode(v === 'oyun') });
  const release = button('Bırak', () => { th = 0.35; om = 0; resetMeasure(); if (game) tries++; });

  const rMeas = h('b', {}, '—'), rTh = h('b', {}, '—');
  const read = h('div', { class: 'read' }, h('span', {}, 'Ölçülen periyot ', rMeas), h('span', {}, 'Kuramsal T = 2π√(L/g) ', rTh));
  const goal = h('div', { class: 'msg info', style: { display: 'none', flex: '1 1 100%' } });
  const nextBtn = button('Sonraki seviye', () => { lvl = (lvl + 1) % LEVELS.length; startLevel(); }, 'btn btn-solid');
  nextBtn.style.display = 'none';

  root.append(h('div', { class: 'w-bar' }, sgMode.el, slL.el, sgG.el, release, read, goal, nextBtn));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Önce <i>Benzetim</i> kipinde ipin uzunluğunu ve gezegeni değiştirip periyodun nasıl değiştiğine bakın. Sonra <i>Oyunlaştır</i>’a geçin: model aynı kalıyor, eklenen yalnızca bir hedef ve geri bildirim.' }));

  function setMode(on) {
    game = on;
    if (on) { lvl = 0; startLevel(); }
    else { goal.style.display = 'none'; nextBtn.style.display = 'none'; sgG.el.style.opacity = ''; }
  }
  function startLevel() {
    const lv = LEVELS[lvl];
    pl = lv.pl; sgG.set(pl); sgG.el.style.opacity = '.5';
    L = 0.5 + Math.random() * 1.6; slL.set(L);
    th = 0.35; om = 0; tries = 1; won = false; resetMeasure();
    nextBtn.style.display = 'none';
    showGoal();
  }
  function showGoal(extra = '') {
    const lv = LEVELS[lvl];
    goal.style.display = '';
    goal.className = 'msg ' + (won ? 'good' : 'info');
    goal.innerHTML = won
      ? `<b>Seviye ${lvl + 1} tamam.</b> ${G[lv.pl].n}’da ${tr(lv.T)} s periyot için ip ≈ ${tr(L)} m. Deneme: ${tries}. ${extra}`
      : `<b>Seviye ${lvl + 1} / ${LEVELS.length}.</b> ${G[lv.pl].n}’dasınız. İpi ayarlayıp sarkacın periyodunu <b>${tr(lv.T)} s</b> yapın (±${tr(TOL)}). ${extra}`;
  }

  // sürükleyerek açıyı ayarla
  const pivot = () => ({ x: st.w * 0.3, y: 34 });
  const scale = () => (st.h - 90) / 2.6;
  st.cv.addEventListener('pointerdown', (e) => {
    const p = st.pos(e), pv = pivot(), s = scale();
    const bx = pv.x + Math.sin(th) * L * s, by = pv.y + Math.cos(th) * L * s;
    if (Math.hypot(p.x - bx, p.y - by) < 40) { dragging = true; st.cv.setPointerCapture(e.pointerId); }
  });
  st.cv.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = st.pos(e), pv = pivot();
    th = clamp(Math.atan2(p.x - pv.x, p.y - pv.y), -1.2, 1.2); om = 0;
  });
  const up = () => { if (dragging) { dragging = false; resetMeasure(); if (game) tries++; } };
  st.cv.addEventListener('pointerup', up); st.cv.addEventListener('pointercancel', up);
  st.cv.style.touchAction = 'none';

  const f = (a) => -(g() / L) * Math.sin(a);
  function step(dt) {
    // RK4
    const k1t = om, k1o = f(th);
    const k2t = om + 0.5 * dt * k1o, k2o = f(th + 0.5 * dt * k1t);
    const k3t = om + 0.5 * dt * k2o, k3o = f(th + 0.5 * dt * k2t);
    const k4t = om + dt * k3o, k4o = f(th + dt * k3t);
    const prev = th;
    th += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    om += (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);
    simT += dt;
    if (prev < 0 && th >= 0) {
      const tc = simT - dt * (th / (th - prev));
      if (lastCross != null) { periods.push(tc - lastCross); if (periods.length > 3) periods.shift(); checkGoal(); }
      lastCross = tc;
    }
  }
  function checkGoal() {
    if (!game || won) return;
    const T = periods[periods.length - 1];
    if (Math.abs(T - LEVELS[lvl].T) <= TOL) { okStreak++; if (okStreak >= 2) { won = true; nextBtn.style.display = ''; nextBtn.textContent = lvl === LEVELS.length - 1 ? 'Baştan başla' : 'Sonraki seviye'; showGoal(lvl === 1 ? 'Ay’da aynı periyot için ip neden bu kadar kısa?' : ''); } }
    else { okStreak = 0; showGoal(T > LEVELS[lvl].T ? 'Şu an <b>yavaş</b> sallanıyor.' : 'Şu an <b>hızlı</b> sallanıyor.'); }
  }

  loop(root, (dt) => {
    if (!dragging) { const n = 8; for (let i = 0; i < n; i++) step(dt / n); }
    trace.push(th); if (trace.length > 360) trace.shift();
    rMeas.textContent = periods.length ? tr(periods[periods.length - 1]) + ' s' : '—';
    rTh.textContent = tr(Tth()) + ' s';
    draw();
  });

  function draw() {
    const { w, h: H } = st; const pv = pivot(), s = scale();
    ctx.clearRect(0, 0, w, H);
    // tavan
    ctx.fillStyle = '#e7e2d6'; ctx.fillRect(pv.x - 70, pv.y - 12, 140, 8);
    // ölçek çizgisi (1 m)
    ctx.strokeStyle = '#c9c4b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(22, pv.y); ctx.lineTo(22, pv.y + s); ctx.stroke();
    ctx.fillStyle = COL.mute; ctx.font = '11px IBM Plex Sans, sans-serif'; ctx.fillText('1 m', 28, pv.y + s / 2);
    // yay izi
    ctx.strokeStyle = '#ece8df'; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(pv.x, pv.y, L * s, Math.PI / 2 - 1.2, Math.PI / 2 + 1.2); ctx.stroke(); ctx.setLineDash([]);
    const bx = pv.x + Math.sin(th) * L * s, by = pv.y + Math.cos(th) * L * s;
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pv.x, pv.y); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = game && won ? COL.good : COL.acc;
    ctx.beginPath(); ctx.arc(bx, by, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx - 4, by - 4, 4, 0, 7); ctx.fill();
    ctx.fillStyle = COL.mute; ctx.fillText(G[pl].n + ' · g = ' + tr(g()) + ' m/s²', pv.x - 60, H - 14);

    // sağda: açı-zaman grafiği
    const gx = w * 0.56, gw = w * 0.4, gy = 40, gh = H - 110;
    ctx.fillStyle = '#fff'; rr(ctx, gx, gy, gw, gh, 8); ctx.fill();
    ctx.strokeStyle = COL.line; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke();
    ctx.fillStyle = COL.mute; ctx.fillText('açı', gx + 8, gy + 16); ctx.fillText('zaman →', gx + gw - 58, gy + gh - 8);
    ctx.strokeStyle = COL.acc; ctx.lineWidth = 2; ctx.beginPath();
    trace.forEach((v, i) => { const x = gx + (i / 360) * gw, y = gy + gh / 2 - (v / 1.3) * (gh / 2 - 10); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    if (game) {
      const lv = LEVELS[lvl];
      ctx.fillStyle = won ? COL.good : COL.ink; ctx.font = '600 13px IBM Plex Sans, sans-serif';
      ctx.fillText(`Hedef: ${tr(lv.T)} s`, gx, gy + gh + 26);
      const T = periods.length ? periods[periods.length - 1] : null;
      // hedef göstergesi
      const bxl = gx + 90, bw = gw - 100, by2 = gy + gh + 18;
      ctx.fillStyle = '#ece8df'; rr(ctx, bxl, by2, bw, 10, 5); ctx.fill();
      const map = (v) => bxl + clamp((v - (lv.T - 1)) / 2, 0, 1) * bw;
      ctx.fillStyle = '#cfe8d8'; ctx.fillRect(map(lv.T - TOL), by2, map(lv.T + TOL) - map(lv.T - TOL), 10);
      if (T) { ctx.fillStyle = won ? COL.good : COL.acc; ctx.beginPath(); ctx.arc(map(T), by2 + 5, 7, 0, 7); ctx.fill(); }
    } else {
      ctx.fillStyle = COL.mute; ctx.font = '12px IBM Plex Sans, sans-serif';
      ctx.fillText('Topu sürükleyip bırakabilirsiniz.', gx, gy + gh + 26);
    }
  }
}
