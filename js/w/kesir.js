// İçsel ve dışsal bütünleşme: aynı konu (kesirler), iki oyun.
// A: kesir sorusu, oyunda ilerlemenin geçiş koşulu (dışsal).
// B: kesri sayı doğrusunda bulmak, oyunun temel eylemi (içsel).
import { h, seg, button, canvasStage, loop, clamp, lerp, tr, rr, COL } from './ui.js';

const QA = [
  { q: '3/4', o: ['0,75', '0,34', '0,43'], a: 0 },
  { q: '1/2', o: ['0,12', '0,5', '1,2'], a: 1 },
  { q: '2/5', o: ['2,5', '0,25', '0,4'], a: 2 },
  { q: '1/4', o: ['0,25', '0,14', '0,4'], a: 0 },
  { q: '3/10', o: ['3,1', '0,3', '0,13'], a: 1 },
];
const LV = [
  { max: 1, den: 4, n: 3, d: 4 },
  { max: 1, den: 8, n: 5, d: 8 },
  { max: 1, den: 6, n: 2, d: 3 },
  { max: 2, den: 4, n: 5, d: 4 },
  { max: 1, den: 10, n: 2, d: 5 },
];

function drawKid(ctx, x, y, col, t) {
  ctx.fillStyle = col; rr(ctx, x - 14, y - 40, 28, 40, 9); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 5, y - 28, 4, 0, 7); ctx.arc(x + 6, y - 28, 4, 0, 7); ctx.fill();
  ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(x - 4, y - 27, 1.8, 0, 7); ctx.arc(x + 7, y - 27, 1.8, 0, 7); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const s = Math.sin(t * 14) * 5;
  ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6 + s, y + 8); ctx.moveTo(x + 6, y); ctx.lineTo(x + 6 - s, y + 8); ctx.stroke();
}

export default function mount(root) {
  let game = 'A';
  const tabs = seg({ options: [{ v: 'A', t: 'Oyun A' }, { v: 'B', t: 'Oyun B' }], value: 'A', onchange: (v) => { game = v; show(); } });
  const head = h('div', { class: 'w-bar', style: { borderTop: 'none', borderBottom: '1px solid #ece9e2' } }, tabs.el,
    h('span', { style: { fontSize: '.84rem', color: '#3f434d' } }, 'İki oyun da aynı kazanımı hedefliyor: ', h('b', {}, 'kesirleri tanır ve sayı doğrusunda gösterir.')));
  root.append(head);

  const holder = h('div', {});
  root.append(holder);
  const st = canvasStage(holder, { aspect: 0.38, min: 260, max: 340 });
  const { ctx } = st;
  const overlay = h('div', { style: { position: 'absolute', inset: '0', display: 'none', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,250,247,.72)' } });
  st.wrap.append(overlay);

  const info = h('div', { class: 'msg info', style: { flex: '1 1 20rem' } });
  const ctlB = h('div', { style: { display: 'none', gap: '.5rem', alignItems: 'center' } });
  const jumpBtn = button('Zıpla', () => jumpB(), 'btn btn-solid');
  ctlB.append(h('span', { style: { fontSize: '.78rem', color: '#737885' } }, 'Yeşil işareti sürükleyin'), jumpBtn);
  const bar = h('div', { class: 'w-bar' }, info, ctlB, button('Baştan', () => (game === 'A' ? resetA() : resetB(0))));
  root.append(bar);

  const stats = { A: { ok: 0, no: 0 }, B: { hit: 0, tries: 0 } };
  const refl = h('div', { style: { padding: '.9rem 1.15rem', borderTop: '1px solid #ece9e2', fontSize: '.88rem', color: '#3f434d' } });
  const reveal = h('div', { style: { display: 'none', marginTop: '.5rem' } },
    h('p', { style: { margin: '.3rem 0' }, html: '<b>A</b>’da oyunun eylemi (koşmak, zıplamak) kesirle ilgili değil; soru yalnızca engeli geçmenin koşulu. Kesir bilgisi oyuna <i>dışarıdan</i> eklenmiş. <b>B</b>’de zıplamanın nereye ineceğine karar vermek, kesri sayı doğrusunda konumlandırmanın ta kendisi. Kazanım oyunun <i>içinde</i>.' }),
    h('p', { style: { margin: '.3rem 0' }, html: 'B’nin 3. ve 5. seviyelerine dikkat: 2/3’ü altıda birlerle, 2/5’i onda birlerle bölünmüş bir doğruda bulmak denk kesir bilgisini gerektiriyor. A’daki sorular ise ezberlenebilir.' }));
  const revealBtn = button('Karşılaştırmayı göster', () => { reveal.style.display = ''; revealBtn.style.display = 'none'; });
  const statTxt = h('div', { class: 'read' });
  refl.append(h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '.6rem 1.5rem', alignItems: 'center', justifyContent: 'space-between' } },
    h('span', {}, h('b', {}, 'Soru: '), 'Hangi oyunda kesirler hakkında düşünmek zorunda kaldınız?'), statTxt, revealBtn), reveal);
  root.append(refl);
  const upStats = () => { statTxt.innerHTML = `<span>A: <b>${stats.A.ok}</b> doğru, <b>${stats.A.no}</b> yanlış</span><span>B: <b>${stats.B.hit}</b> isabet / <b>${stats.B.tries}</b> zıplama</span>`; };
  upStats();

  // ================= OYUN A =================
  const A = { x: 60, wall: 0, qi: 0, state: 'run', jumpT: 0, bump: 0, scroll: 0 };
  function resetA() { A.x = 60; A.wall = 0; A.qi = 0; A.state = 'run'; A.scroll = 0; overlay.style.display = 'none'; infoA(); }
  function infoA(msg) { info.className = 'msg info'; info.innerHTML = msg || `Koş, duvara gelince soruyu yanıtla. Duvar ${Math.min(A.wall + 1, QA.length)} / ${QA.length}.`; }
  function askA() {
    const q = QA[A.qi];
    overlay.innerHTML = '';
    const box = h('div', { style: { background: '#fff', border: '1px solid #e1ddd3', borderRadius: '12px', padding: '1rem 1.2rem', boxShadow: '0 8px 28px rgba(0,0,0,.1)', textAlign: 'center' } },
      h('div', { style: { fontSize: '.8rem', color: '#737885' } }, 'Duvarı geçmek için yanıtla'),
      h('div', { style: { fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 600, margin: '.2rem 0 .7rem' } }, `${q.q} = ?`),
      h('div', { style: { display: 'flex', gap: '.5rem', justifyContent: 'center' } },
        q.o.map((o, i) => button(o, () => answerA(i), 'btn'))));
    overlay.append(box); overlay.style.display = 'flex';
  }
  function answerA(i) {
    const q = QA[A.qi];
    overlay.style.display = 'none';
    if (i === q.a) { stats.A.ok++; A.state = 'jump'; A.jumpT = 0; info.className = 'msg good'; info.textContent = 'Doğru. Karakter duvarın üstünden atlıyor.'; }
    else { stats.A.no++; A.state = 'bump'; A.bump = 0.5; info.className = 'msg bad'; info.textContent = `Yanlış. ${q.q} = ${q.o[q.a]}. Karakter geri sekiyor; aynı duvara yeniden gelecek.`; }
    upStats();
  }

  // ================= OYUN B =================
  const B = { lv: 0, mark: 0.3, state: 'aim', t: 0, from: 0, to: 0, land: null, hitAt: null };
  function lineGeom() { const x0 = 70, x1 = st.w - 70, y = st.h - 70; return { x0, x1, y, len: x1 - x0 }; }
  function resetB(lv = B.lv) { B.lv = lv; B.mark = 0.3 * LV[lv].max; B.state = 'aim'; B.land = null; B.from = 0; infoB(); }
  function infoB(msg, cls = 'info') {
    const L = LV[B.lv];
    info.className = 'msg ' + cls;
    info.innerHTML = msg || `Seviye ${B.lv + 1} / ${LV.length}. Karakterin <b>${L.n}/${L.d}</b> noktasına inmesini sağlayın.`;
  }
  function jumpB() {
    if (game !== 'B' || B.state !== 'aim') return;
    B.state = 'fly'; B.t = 0; B.to = B.mark; stats.B.tries++; upStats();
  }
  function landB() {
    const L = LV[B.lv], goal = L.n / L.d, err = Math.abs(B.to - goal);
    B.land = B.to; B.from = B.to;
    const fr = (v) => { const k = Math.round(v * L.den); return `${k}/${L.den}`; };
    if (err <= 0.025 * L.max) {
      stats.B.hit++; upStats(); B.state = 'won';
      infoB(`<b>İsabet.</b> ${L.n}/${L.d}${L.den !== L.d ? ` = ${L.n * (L.den / L.d)}/${L.den}` : ''} noktasına indiniz.`, 'good');
      setTimeout(() => { if (game === 'B' && B.state === 'won') resetB((B.lv + 1) % LV.length); }, 1900);
    } else {
      B.state = 'aim';
      infoB(`Yaklaşık ${fr(B.to)} noktasına indiniz; hedef ${L.n}/${L.d}. ${B.to > goal ? 'Biraz geri.' : 'Biraz ileri.'}`, 'bad');
    }
  }
  let dragB = false;
  st.cv.addEventListener('pointerdown', (e) => {
    if (game !== 'B' || B.state !== 'aim') return;
    const g = lineGeom(), p = st.pos(e);
    if (Math.abs(p.y - g.y) < 60) { dragB = true; st.cv.setPointerCapture(e.pointerId); move(p); }
  });
  const move = (p) => { const g = lineGeom(), L = LV[B.lv]; B.mark = clamp((p.x - g.x0) / g.len, 0, 1) * L.max; };
  st.cv.addEventListener('pointermove', (e) => { if (dragB) move(st.pos(e)); });
  st.cv.addEventListener('pointerup', () => (dragB = false));
  st.cv.style.touchAction = 'none';
  st.cv.tabIndex = 0;
  st.cv.addEventListener('keydown', (e) => {
    if (game !== 'B') return;
    const L = LV[B.lv];
    if (e.key === 'ArrowRight') { B.mark = clamp(B.mark + 0.005 * L.max, 0, L.max); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { B.mark = clamp(B.mark - 0.005 * L.max, 0, L.max); e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Enter') { jumpB(); e.preventDefault(); }
  });

  function show() {
    ctlB.style.display = game === 'B' ? 'flex' : 'none';
    overlay.style.display = 'none';
    if (game === 'A') { resetA(); } else { resetB(B.lv); }
  }

  let clock = 0;
  loop(root, (dt) => {
    clock += dt;
    if (game === 'A') stepA(dt); else stepB(dt);
    game === 'A' ? drawA() : drawB();
  });

  function stepA(dt) {
    const wallX = 360;
    if (A.state === 'run') {
      A.scroll += 120 * dt;
      if (A.wall >= QA.length) { A.state = 'end'; info.className = 'msg good'; info.textContent = `Bitti: ${stats.A.ok} doğru, ${stats.A.no} yanlış. Oyunun kendisi koşup zıplamaktı.`; return; }
      A.x = Math.min(A.x + 150 * dt, wallX - 40);
      if (A.x >= wallX - 40) { A.state = 'ask'; askA(); }
    } else if (A.state === 'jump') {
      A.jumpT += dt * 1.6;
      A.x = lerp(wallX - 40, wallX + 60, Math.min(A.jumpT, 1));
      if (A.jumpT >= 1) { A.wall++; A.qi = (A.qi + 1) % QA.length; A.x = 60; A.state = 'run'; infoA(); }
    } else if (A.state === 'bump') {
      A.bump -= dt; A.x -= 200 * dt;
      if (A.bump <= 0) { A.x = Math.max(A.x, 80); A.state = 'run'; }
    }
  }
  function drawA() {
    const { w, h: H } = st; const gy = H - 50;
    ctx.clearRect(0, 0, w, H);
    ctx.fillStyle = '#eef3f7'; ctx.fillRect(0, 0, w, gy);
    // tepeler (kayan arka plan)
    ctx.fillStyle = '#dde8e0';
    for (let i = -1; i < 6; i++) { const x = ((i * 220 - A.scroll * 0.3) % 1320 + 1320) % 1320 - 220; ctx.beginPath(); ctx.arc(x, gy + 20, 110, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#d9cfba'; ctx.fillRect(0, gy, w, H - gy);
    const wallX = 360;
    ctx.fillStyle = '#b86b4b'; rr(ctx, wallX, gy - 70, 26, 70, 3); ctx.fill();
    ctx.strokeStyle = '#9c5539'; ctx.lineWidth = 1; for (let y = gy - 60; y < gy; y += 14) { ctx.beginPath(); ctx.moveTo(wallX, y); ctx.lineTo(wallX + 26, y); ctx.stroke(); }
    let y = gy;
    if (A.state === 'jump') y = gy - Math.sin(Math.min(A.jumpT, 1) * Math.PI) * 110;
    drawKid(ctx, A.x, y, COL.c3d, A.state === 'run' ? clock : 0);
    ctx.fillStyle = COL.ink2; ctx.font = '600 13px IBM Plex Sans, sans-serif';
    ctx.fillText(`Duvar ${Math.min(A.wall + 1, QA.length)} / ${QA.length}`, 18, 26);
    ctx.font = '12px IBM Plex Sans, sans-serif'; ctx.fillStyle = COL.mute;
    ctx.fillText('Oyunun eylemi: koşmak ve zıplamak', 18, 44);
  }

  function stepB(dt) {
    if (B.state === 'fly') {
      B.t += dt * 1.4;
      if (B.t >= 1) { B.t = 1; landB(); }
    }
  }
  function drawB() {
    const { w, h: H } = st; const g = lineGeom(), L = LV[B.lv];
    ctx.clearRect(0, 0, w, H);
    ctx.fillStyle = '#eef3f7'; ctx.fillRect(0, 0, w, g.y);
    ctx.fillStyle = '#d9cfba'; ctx.fillRect(0, g.y, w, H - g.y);
    // sayı doğrusu
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.x0, g.y); ctx.lineTo(g.x1, g.y); ctx.stroke();
    const n = L.den * L.max;
    for (let i = 0; i <= n; i++) {
      const x = g.x0 + (i / n) * g.len, whole = i % L.den === 0;
      ctx.lineWidth = whole ? 3 : 1.5; ctx.beginPath(); ctx.moveTo(x, g.y - (whole ? 14 : 8)); ctx.lineTo(x, g.y + (whole ? 14 : 8)); ctx.stroke();
      if (whole) { ctx.fillStyle = COL.ink; ctx.font = '600 15px IBM Plex Sans, sans-serif'; ctx.fillText(String(i / L.den), x - 4, g.y + 34); }
    }
    const X = (v) => g.x0 + (v / L.max) * g.len;
    // hedef bayrağı yalnızca isabetten sonra görünür
    if (B.state === 'won') {
      const gx = X(L.n / L.d);
      ctx.strokeStyle = B.state === 'won' ? COL.good : '#c9c4b8'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, g.y - 90); ctx.lineTo(gx, g.y); ctx.stroke(); ctx.setLineDash([]);
      if (B.state === 'won') { ctx.fillStyle = COL.good; ctx.font = '600 13px IBM Plex Sans, sans-serif'; ctx.fillText(`${L.n}/${L.d}`, gx + 6, g.y - 78); }
    }
    // nişan işareti
    if (B.state === 'aim') {
      const mx = X(B.mark);
      ctx.fillStyle = COL.good; ctx.beginPath(); ctx.moveTo(mx, g.y - 6); ctx.lineTo(mx - 9, g.y - 22); ctx.lineTo(mx + 9, g.y - 22); ctx.fill();
      ctx.strokeStyle = 'rgba(30,138,75,.35)'; ctx.setLineDash([3, 5]); ctx.lineWidth = 2;
      const fx = X(B.from); ctx.beginPath(); ctx.moveTo(fx, g.y - 40);
      ctx.quadraticCurveTo((fx + mx) / 2, g.y - 150, mx, g.y - 40); ctx.stroke(); ctx.setLineDash([]);
    }
    // karakter
    let kx, ky;
    if (B.state === 'fly') { const tt = B.t; kx = lerp(X(B.from), X(B.to), tt); ky = g.y - Math.sin(tt * Math.PI) * 110; }
    else { kx = X(B.from); ky = g.y; }
    drawKid(ctx, kx, ky - 1, COL.c2d, 0);
    ctx.fillStyle = COL.ink; ctx.font = '600 22px Fraunces, serif';
    ctx.fillText(`${L.n}/${L.d}`, 18, 34);
    ctx.font = '12px IBM Plex Sans, sans-serif'; ctx.fillStyle = COL.mute;
    ctx.fillText('noktasına in · oyunun eylemi: kesri doğru üzerinde bulmak', 18, 54);
  }

  show();
}
