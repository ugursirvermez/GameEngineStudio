// Tilemap: karo boyama, Rule Tile ve collider birleştirme.
import { h, seg, button, canvasStage, COL } from './ui.js';

const CW = 22, CH = 10;
export default function mount(root) {
  const grid = Array.from({ length: CH }, () => Array(CW).fill(0));
  const fill = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = 1; };
  fill(0, 21, 8, 9); fill(4, 7, 5, 5); fill(11, 14, 6, 7); fill(17, 20, 3, 3); fill(18, 18, 4, 7);
  let rule = true, col = 'yok', erase = false;
  const st = canvasStage(root, { aspect: 0.45, min: 240, max: 400 });
  const sR = seg({ label: 'Karo', options: [{ v: 1, t: 'Rule Tile' }, { v: 0, t: 'Düz karo' }], value: 1, onchange: (v) => { rule = !!+v; draw(); } });
  const sC = seg({ label: 'Collider', options: [{ v: 'yok', t: 'Gizle' }, { v: 'tek', t: 'Tilemap Collider 2D' }, { v: 'bir', t: '+ Composite (Merge)' }], value: 'yok', onchange: (v) => { col = v; draw(); } });
  const sE = seg({ options: [{ v: 0, t: 'Boya' }, { v: 1, t: 'Sil' }], value: 0, onchange: (v) => { erase = !!+v; } });
  const cnt = h('div', { class: 'read' });
  root.append(h('div', { class: 'w-bar' }, sE.el, sR.el, sC.el, cnt));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Izgaraya tıklayıp sürükleyerek karo boyayın. <i>Rule Tile</i> açıkken kenarlar ve üst yüzeyler kendiliğinden doğru görünür. Sonra collider görünümünü açın: tek tek sınırlar ile birleştirilmiş sınır arasındaki farka ve sınır sayısına bakın.' }));

  const cell = () => Math.floor(Math.min(st.w / CW, st.h / CH));
  let painting = false;
  const at = (e) => { const p = st.pos(e), c = cell(), ox = (st.w - c * CW) / 2; return [Math.floor((p.x - ox) / c), Math.floor(p.y / c)]; };
  const paint = (e) => { const [x, y] = at(e); if (x >= 0 && y >= 0 && x < CW && y < CH) { grid[y][x] = erase ? 0 : 1; draw(); } };
  st.cv.addEventListener('pointerdown', (e) => { painting = true; st.cv.setPointerCapture(e.pointerId); paint(e); });
  st.cv.addEventListener('pointermove', (e) => painting && paint(e));
  st.cv.addEventListener('pointerup', () => (painting = false));
  st.cv.style.touchAction = 'none'; st.cv.style.cursor = 'crosshair';
  st.onResize(draw);

  function draw() {
    const { ctx, w, h: H } = st; const c = cell(), ox = (w - c * CW) / 2;
    ctx.clearRect(0, 0, w, H);
    ctx.fillStyle = '#e8f1f6'; ctx.fillRect(ox, 0, c * CW, c * CH);
    ctx.strokeStyle = 'rgba(0,0,0,.05)';
    for (let x = 0; x <= CW; x++) { ctx.beginPath(); ctx.moveTo(ox + x * c, 0); ctx.lineTo(ox + x * c, c * CH); ctx.stroke(); }
    for (let y = 0; y <= CH; y++) { ctx.beginPath(); ctx.moveTo(ox, y * c); ctx.lineTo(ox + CW * c, y * c); ctx.stroke(); }
    const g = (x, y) => (x >= 0 && y >= 0 && x < CW && y < CH ? grid[y][x] : (y >= CH ? 1 : 0));
    let n = 0;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      if (!grid[y][x]) continue; n++;
      const px = ox + x * c, py = y * c;
      if (!rule) {
        ctx.fillStyle = '#9b7653'; ctx.fillRect(px, py, c, c);
        ctx.fillStyle = '#6aa84f'; ctx.fillRect(px, py, c, c * 0.25);
        ctx.strokeStyle = '#7a5b3e'; ctx.strokeRect(px + 0.5, py + 0.5, c - 1, c - 1);
      } else {
        const up = g(x, y - 1), L = g(x - 1, y), R = g(x + 1, y);
        ctx.fillStyle = up ? '#8a6848' : '#9b7653'; ctx.fillRect(px, py, c, c);
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(px + c * 0.3, py + c * 0.55, c * 0.12, c * 0.1);
        if (!up) {
          ctx.fillStyle = '#6aa84f';
          ctx.beginPath(); ctx.roundRect(px - (L ? 0 : 1), py, c + (L ? 0 : 1) + (R ? 0 : 1), c * 0.3, [L ? 0 : c * 0.2, R ? 0 : c * 0.2, 0, 0]); ctx.fill();
        }
        if (!L) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(px, py, 2, c); }
        if (!R) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(px + c - 2, py, 2, c); }
      }
    }
    let shapes = 0;
    if (col === 'tek') {
      ctx.strokeStyle = '#27b35a'; ctx.lineWidth = 1.2;
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (grid[y][x]) { ctx.strokeRect(ox + x * c + 1.5, y * c + 1.5, c - 3, c - 3); shapes++; }
    } else if (col === 'bir') {
      ctx.strokeStyle = '#27b35a'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        if (!grid[y][x]) continue;
        const px = ox + x * c, py = y * c;
        if (!g(x, y - 1)) { ctx.moveTo(px, py); ctx.lineTo(px + c, py); }
        if (y < CH - 1 && !g(x, y + 1)) { ctx.moveTo(px, py + c); ctx.lineTo(px + c, py + c); }
        if (!g(x - 1, y) && x > 0) { ctx.moveTo(px, py); ctx.lineTo(px, py + c); }
        if (!g(x + 1, y) && x < CW - 1) { ctx.moveTo(px + c, py); ctx.lineTo(px + c, py + c); }
      }
      ctx.stroke();
      // bağlı bölge sayısı
      const seen = grid.map((r) => r.map(() => false));
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (grid[y][x] && !seen[y][x]) {
        shapes++; const st2 = [[x, y]]; seen[y][x] = true;
        while (st2.length) { const [a, b] = st2.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = a + dx, Y = b + dy; if (X >= 0 && Y >= 0 && X < CW && Y < CH && grid[Y][X] && !seen[Y][X]) { seen[Y][X] = true; st2.push([X, Y]); } }); }
      }
    }
    cnt.innerHTML = `<span>Karo <b>${n}</b></span>` + (col !== 'yok' ? `<span>Collider şekli <b>${shapes}</b></span>` : '');
  }
  draw();
}
