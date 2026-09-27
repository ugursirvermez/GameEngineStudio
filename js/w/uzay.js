// Yerel ve dünya koordinatları: ebeveyn dönünce çocuk da döner; Space.Self ile Space.World.
import { h, slider, seg, button, canvasStage, loop, tr, rr, COL } from './ui.js';

export default function mount(root) {
  const st = canvasStage(root, { aspect: 0.48, min: 280, max: 420 });
  const car = { x: 0, y: 0, a: 0.5 };
  const child = { lx: 1.2, ly: 0 };      // yerel konum (ebeveyne göre)
  let space = 'Self', moving = false;
  const slA = slider({ label: 'Ebeveynin dönüşü', min: -180, max: 180, step: 1, value: 29, fmt: (v) => v + '°', oninput: (v) => { car.a = (v * Math.PI) / 180; } });
  const slC = slider({ label: 'Çocuğun yerel x', min: 0.5, max: 2.2, step: 0.01, value: 1.2, fmt: (v) => tr(v), oninput: (v) => { child.lx = v; } });
  const sS = seg({ label: 'Translate', options: [{ v: 'Self', t: 'Space.Self' }, { v: 'World', t: 'Space.World' }], value: 'Self', onchange: (v) => { space = v; } });
  const go = button('İleri git', null, 'btn btn-solid');
  const hold = (v) => (e) => { e.preventDefault(); moving = v; };
  go.addEventListener('pointerdown', hold(true)); go.addEventListener('pointerup', hold(false)); go.addEventListener('pointerleave', hold(false));
  const reset = button('Başa al', () => { car.x = 0; car.y = 0; });
  const rd = h('div', { class: 'read', style: { flex: '1 1 100%' } });
  root.append(h('div', { class: 'w-bar' }, slA.el, slC.el, sS.el, go, reset, rd));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Ebeveyni döndürün: çocuğun <i>yerel</i> konumu hiç değişmezken <i>dünya</i> konumu değişiyor. Sonra <i>İleri git</i>’e basılı tutun ve <code>Space.Self</code> ile <code>Space.World</code> arasındaki farka bakın.' }));

  loop(root, (dt) => {
    if (moving) {
      const d = 1.6 * dt;
      if (space === 'Self') { car.x += Math.cos(car.a) * d; car.y += Math.sin(car.a) * d; }
      else car.x += d;
      if (Math.abs(car.x) > 5 || Math.abs(car.y) > 3) { car.x = 0; car.y = 0; }
    }
    draw();
  });

  function draw() {
    const { ctx, w, h: H } = st; const U = Math.min(w / 9, H / 5.2), O = { x: w * 0.4, y: H * 0.58 };
    const P = (x, y) => ({ x: O.x + x * U, y: O.y - y * U });
    ctx.clearRect(0, 0, w, H);
    ctx.strokeStyle = '#efece5'; ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { const a = P(i, -5), b = P(i, 5); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); const c = P(-8, i), d = P(8, i); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
    // dünya eksenleri
    const arrow = (p, dx, dy, col, lab) => {
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + dx, p.y + dy); ctx.stroke();
      const a = Math.atan2(dy, dx); ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + dy);
      ctx.lineTo(p.x + dx - 8 * Math.cos(a - 0.4), p.y + dy - 8 * Math.sin(a - 0.4)); ctx.lineTo(p.x + dx - 8 * Math.cos(a + 0.4), p.y + dy - 8 * Math.sin(a + 0.4)); ctx.fill();
      if (lab) { ctx.font = '600 11px IBM Plex Sans, sans-serif'; ctx.fillText(lab, p.x + dx + 4, p.y + dy - 4); }
    };
    const o = P(0, 0);
    arrow(o, U * 1.4, 0, '#c9c4b8', 'Dünya X'); arrow(o, 0, -U * 1.4, '#c9c4b8', 'Dünya Y');
    // ebeveyn
    const pc = P(car.x, car.y);
    ctx.save(); ctx.translate(pc.x, pc.y); ctx.rotate(-car.a);
    ctx.fillStyle = COL.acc; rr(ctx, -U * 0.7, -U * 0.4, U * 1.4, U * 0.8, 8); ctx.fill();
    ctx.fillStyle = '#9aa0ff'; rr(ctx, U * 0.25, -U * 0.3, U * 0.3, U * 0.6, 4); ctx.fill();
    ctx.restore();
    arrow(pc, Math.cos(car.a) * U, -Math.sin(car.a) * U, '#e0473b', 'yerel x');
    arrow(pc, -Math.sin(car.a) * U * 0.8, -Math.cos(car.a) * U * 0.8, '#34a853', 'yerel y');
    // çocuk: dünya konumu = ebeveyn + döndürülmüş yerel konum
    const wx = car.x + Math.cos(car.a) * child.lx - Math.sin(car.a) * child.ly;
    const wy = car.y + Math.sin(car.a) * child.lx + Math.cos(car.a) * child.ly;
    const cc = P(wx, wy);
    ctx.strokeStyle = 'rgba(62,68,184,.35)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(pc.x, pc.y); ctx.lineTo(cc.x, cc.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = COL.c3d; ctx.beginPath(); ctx.arc(cc.x, cc.y, U * 0.22, 0, 7); ctx.fill();
    ctx.fillStyle = COL.ink; ctx.font = '600 12px IBM Plex Sans, sans-serif';
    ctx.fillText('Ebeveyn', pc.x - U * 0.6, pc.y + U * 0.75); ctx.fillText('Çocuk', cc.x + U * 0.3, cc.y + 4);
    rd.innerHTML = `<span>Çocuk <code>localPosition</code> <b>(${tr(child.lx)}, ${tr(child.ly)})</b></span><span>Çocuk <code>position</code> (dünya) <b>(${tr(wx)}, ${tr(wy)})</b></span>`;
  }
}
