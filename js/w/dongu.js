// Oyun döngüsü ve Time.deltaTime: kare başına hareket ile saniye başına hareket.
import { h, seg, button, canvasStage, loop, tr, rr, COL } from './ui.js';

export default function mount(root) {
  const st = canvasStage(root, { aspect: 0.36, min: 250, max: 330 });
  const { ctx } = st;

  let fps = 60, slow = false, running = true;
  let acc = 0, frames = 0, time = 0, phase = 0;
  const A = { x: 0, done: null }, B = { x: 0, done: null };
  const SPEED = 240;                  // px/s, 60 fps'te A da aynı hızda
  const PER_FRAME = SPEED / 60;       // A: kare başına 4 px

  const reset = () => { A.x = B.x = 0; A.done = B.done = null; frames = 0; time = 0; acc = 0; running = true; };
  const sgF = seg({ label: 'Kare hızı', options: [15, 30, 60, 120].map((v) => ({ v, t: v + ' FPS' })), value: 60, onchange: (v) => { fps = +v; reset(); } });
  const sgS = seg({ options: [{ v: 0, t: 'Normal' }, { v: 1, t: 'Yavaş çekim' }], value: 0, onchange: (v) => { slow = !!+v; } });
  const rF = h('b'), rDt = h('b'), rT = h('b');
  root.append(h('div', { class: 'w-bar' }, sgF.el, sgS.el, button('Yeniden başlat', reset),
    h('div', { class: 'read' }, h('span', {}, 'Kare ', rF), h('span', {}, 'deltaTime ', rDt), h('span', {}, 'Süre ', rT))));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>60 FPS’te iki top birlikte varıyor. Kare hızını 30’a, sonra 120’ye çıkarın. Üstteki kod, hızlı bilgisayarda hızlı, yavaş bilgisayarda yavaş çalışan bir oyun demektir.' }));

  loop(root, (dt) => {
    if (running) {
      const d = slow ? dt * 0.2 : dt;
      time += d; acc += d;
      const step = 1 / fps;
      while (acc >= step) {
        acc -= step; frames++;
        A.x += PER_FRAME; B.x += SPEED * step;      // bir kare: girdi → güncelle → çiz
        const end = st.w - 150;
        if (A.x >= end && A.done == null) { A.x = end; A.done = time; }
        if (B.x >= end && B.done == null) { B.x = end; B.done = time; }
        A.x = Math.min(A.x, end); B.x = Math.min(B.x, end);
        if (A.done != null && B.done != null) { running = false; setTimeout(() => { if (!running) reset(); }, 2200); }
      }
      phase = acc / step;
    }
    rF.textContent = frames; rDt.textContent = tr(1 / fps, 4) + ' s'; rT.textContent = tr(time, 1) + ' s';
    draw();
  });

  function lane(y, x, label, codeTxt, col, done) {
    const x0 = 24, end = st.w - 150;
    ctx.fillStyle = '#f1efe9'; rr(ctx, x0 - 10, y - 26, end - x0 + 40, 52, 26); ctx.fill();
    ctx.strokeStyle = '#15171c'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(end + 16, y - 26); ctx.lineTo(end + 16, y + 26); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0 + 12 + x, y, 16, 0, 7); ctx.fill();
    ctx.fillStyle = COL.ink; ctx.font = '600 12px IBM Plex Sans, sans-serif'; ctx.fillText(label, x0, y - 34);
    ctx.font = '12px IBM Plex Mono, monospace'; ctx.fillStyle = COL.ink2; ctx.fillText(codeTxt, x0 + 150, y - 34);
    ctx.font = '600 12px IBM Plex Sans, sans-serif'; ctx.fillStyle = done != null ? col : COL.mute;
    ctx.fillText(done != null ? tr(done, 2) + ' s' : '…', end + 28, y + 4);
  }

  function draw() {
    const { w, h: H } = st;
    ctx.clearRect(0, 0, w, H);
    lane(H * 0.27, A.x, 'deltaTime yok', 'x += 4;', COL.c3d, A.done);
    lane(H * 0.62, B.x, 'deltaTime ile', 'x += 240 * Time.deltaTime;', COL.c2d, B.done);
    // döngü aşamaları
    const names = ['Girdi', 'Güncelle', 'Çiz'];
    const cur = Math.min(2, Math.floor(phase * 3));
    const y = H - 30;
    ctx.fillStyle = COL.mute; ctx.font = '11px IBM Plex Sans, sans-serif'; ctx.fillText('Her karede:', 24, y + 14);
    names.forEach((n, i) => {
      const x = 100 + i * 112;
      const lit = slow ? i === cur : true;
      ctx.fillStyle = slow && lit ? COL.acc : '#ece9e2'; rr(ctx, x, y, 100, 20, 10); ctx.fill();
      ctx.fillStyle = slow && lit ? '#fff' : COL.ink2;
      ctx.fillText(`${i + 1}  ${n}`, x + 12, y + 14);
      if (i < 2) { ctx.fillStyle = COL.mute; ctx.fillText('→', x + 102, y + 14); }
    });
  }
}
