// Sprite içe aktarma: Pixels Per Unit ve Filter Mode.
import { h, seg, canvasStage, COL } from './ui.js';

const PAL = { '.': null, k: '#1d1e22', b: '#3e44b8', l: '#6f76e6', s: '#f0c8a4', w: '#ffffff', r: '#c9543f' };
const ART = [
  '................', '.....kkkkkk.....', '....kssssssk....', '...kssssssssk...', '...kswkssswks...', '...kssssssssk...',
  '...ksssrrsssk...', '....kssssssk....', '.....kkkkkk.....', '....kbbbbbbk....', '...kbllbbllbk...', '...kbbbbbbbbk...',
  '...kbbbbbbbbk...', '....kbbkkbbk....', '....kkk..kkk....', '................',
];

export default function mount(root) {
  const src = document.createElement('canvas'); src.width = src.height = 16;
  const sx = src.getContext('2d');
  ART.forEach((row, y) => [...row].forEach((c, x) => { if (PAL[c]) { sx.fillStyle = PAL[c]; sx.fillRect(x, y, 1, 1); } }));
  let ppu = 16, filter = 'point';
  const st = canvasStage(root, { aspect: 0.42, min: 280, max: 380 });
  const rd = h('div', { class: 'read' });
  const sP = seg({ label: 'Pixels Per Unit', options: [8, 16, 32, 64].map((v) => ({ v, t: String(v) })), value: 16, onchange: (v) => { ppu = +v; draw(); } });
  const sF = seg({ label: 'Filter Mode', options: [{ v: 'point', t: 'Point' }, { v: 'bilinear', t: 'Bilinear' }], value: 'point', onchange: (v) => { filter = v; draw(); } });
  root.append(h('div', { class: 'w-bar' }, sP.el, sF.el, rd));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>16 × 16 piksellik karakter, 1 × 1 birimlik ızgaraya oturmalı. PPU’yu değiştirip karakterin karoya göre nasıl büyüyüp küçüldüğüne, sonra <i>Bilinear</i>’e geçip piksellerin nasıl bulanıklaştığına bakın.' }));
  st.onResize(draw);

  function draw() {
    const { ctx, w, h: H } = st;
    ctx.clearRect(0, 0, w, H);
    const U = Math.min(96, H / 3.2);         // 1 Unity birimi kaç ekran pikseli
    const gy = H - 40, ox = 40;
    ctx.strokeStyle = '#e6e2d8'; ctx.lineWidth = 1;
    for (let x = ox; x < w; x += U) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, gy); ctx.stroke(); }
    for (let y = gy; y > 10; y -= U) { ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(w - 10, y); ctx.stroke(); }
    ctx.fillStyle = COL.mute; ctx.font = '11px IBM Plex Sans, sans-serif'; ctx.fillText('1 birim', ox + 4, gy + 16);
    ctx.strokeStyle = COL.ink2; ctx.beginPath(); ctx.moveTo(ox, gy + 4); ctx.lineTo(ox + U, gy + 4); ctx.stroke();
    // karo (16 px, PPU 16 → tam 1 birim)
    ctx.fillStyle = '#b98d5a'; ctx.fillRect(ox, gy - U, U, U); ctx.fillStyle = '#6aa84f'; ctx.fillRect(ox, gy - U, U, U * 0.22);
    ctx.fillStyle = COL.mute; ctx.fillText('Karo (PPU 16)', ox, gy - U - 6);
    // karakter
    const size = (16 / ppu) * U;
    ctx.imageSmoothingEnabled = filter === 'bilinear';
    ctx.imageSmoothingQuality = 'high';
    const cx = ox + U * 1.6;
    ctx.drawImage(src, cx, gy - size, size, size);
    ctx.strokeStyle = 'rgba(62,68,184,.5)'; ctx.setLineDash([3, 3]); ctx.strokeRect(cx, gy - size, size, size); ctx.setLineDash([]);
    // büyütülmüş ayrıntı
    const zx = w - 200, zs = 150;
    if (zx > cx + size + 20) {
      ctx.imageSmoothingEnabled = filter === 'bilinear';
      ctx.drawImage(src, 3, 2, 10, 8, zx, 24, zs, zs * 0.8);
      ctx.strokeStyle = COL.line; ctx.strokeRect(zx, 24, zs, zs * 0.8);
      ctx.fillStyle = COL.mute; ctx.fillText('Yakından', zx, 18);
    }
    const u = 16 / ppu;
    rd.innerHTML = `<span>Sahnedeki boyut <b>${u.toString().replace('.', ',')} × ${u.toString().replace('.', ',')} birim</b></span>`;
  }
  draw();
}
