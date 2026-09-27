// Sprite animasyonu: kare sayısı, kare hızı ve Has Exit Time.
import { h, slider, seg, button, canvasStage, loop, COL } from './ui.js';

// Basit bir yürüme döngüsü: faz (0–1) → eklem açıları
function pose(ph) {
  const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
  return { hipA: s * 0.55, hipB: -s * 0.55, kneeA: Math.max(0, -c) * 0.9, kneeB: Math.max(0, c) * 0.9, armA: -s * 0.5, armB: s * 0.5, bob: Math.abs(c) * 3 };
}
function drawMan(ctx, x, y, sc, p, col) {
  ctx.save(); ctx.translate(x, y - p.bob * sc * 0.4); ctx.scale(sc, sc);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const limb = (a, k, len, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, 0); const kx = Math.sin(a) * len, ky = Math.cos(a) * len; ctx.lineTo(kx, ky); ctx.lineTo(kx + Math.sin(a - k) * len, ky + Math.cos(a - k) * len); ctx.stroke(); };
  ctx.save(); ctx.translate(0, 0); limb(p.hipB, p.kneeB, 22, 7, '#2c318e'); ctx.restore();
  ctx.save(); ctx.translate(0, -38); limb(p.armB, 0.4, 16, 6, '#2c318e'); ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -40); ctx.stroke();
  ctx.fillStyle = '#f0c8a4'; ctx.beginPath(); ctx.arc(0, -54, 10, 0, 7); ctx.fill();
  limb(p.hipA, p.kneeA, 22, 7, col);
  ctx.save(); ctx.translate(0, -38); limb(p.armA, 0.4, 16, 6, col); ctx.restore();
  ctx.restore();
}

export default function mount(root) {
  let frames = 8, fps = 10, exitTime = true, state = 'walk', want = 'walk', t = 0, pressAt = 0, lat = null;
  const st = canvasStage(root, { aspect: 0.42, min: 280, max: 360 });
  const sF = seg({ label: 'Döngüdeki kare', options: [4, 8, 12].map((v) => ({ v, t: String(v) })), value: 8, onchange: (v) => (frames = +v) });
  const slR = slider({ label: 'Kare hızı', min: 2, max: 30, step: 1, value: 10, fmt: (v) => v + ' fps', oninput: (v) => (fps = v) });
  const sE = seg({ label: 'Has Exit Time', options: [{ v: 1, t: 'Açık' }, { v: 0, t: 'Kapalı' }], value: 1, onchange: (v) => (exitTime = !!+v) });
  const btn = button('Durdur', () => { want = want === 'walk' ? 'idle' : 'walk'; pressAt = performance.now(); lat = null; btn.textContent = want === 'walk' ? 'Durdur' : 'Yürüt'; if (!exitTime) { state = want; lat = 0; } }, 'btn btn-solid');
  const rd = h('div', { class: 'read' });
  root.append(h('div', { class: 'w-bar' }, sF.el, slR.el, sE.el, btn, rd));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Kare hızını 4’e düşürüp 24’e çıkarın; karakterin hissi nasıl değişiyor? Sonra <i>Durdur</i>’a basın: <i>Has Exit Time</i> açıkken karakter adımını bitirmeden durmaz. Kapatıp aynı şeyi deneyin ve tepki süresine bakın.' }));

  loop(root, (dt) => {
    const cycle = frames / fps;               // bir döngünün süresi (s)
    if (state === 'walk') {
      const prev = t; t = (t + dt / cycle) % 1;
      if (want !== state && exitTime && t < prev) { state = want; lat = performance.now() - pressAt; }
    } else if (want === 'walk') { state = 'walk'; t = 0; lat = 0; }
    const cur = state === 'walk' ? Math.floor(t * frames) : -1;
    rd.innerHTML = `<span>Döngü <b>${cycle.toFixed(2).replace('.', ',')} s</b></span>` + (lat != null ? `<span>Tepki gecikmesi <b>${Math.round(lat)} ms</b></span>` : '');
    draw(cur);
  });

  function draw(cur) {
    const { ctx, w, h: H } = st;
    ctx.clearRect(0, 0, w, H);
    const gy = H * 0.58;
    ctx.fillStyle = '#ece6da'; ctx.fillRect(0, gy + 30, w, 4);
    const p = cur >= 0 ? pose(cur / frames) : { hipA: 0.05, hipB: -0.05, kneeA: 0, kneeB: 0, armA: 0.1, armB: -0.1, bob: 0 };
    drawMan(ctx, w * 0.2, gy - 14, 1.5, p, COL.acc);
    ctx.fillStyle = COL.ink2; ctx.font = '600 12px IBM Plex Sans, sans-serif';
    ctx.fillText(state === 'walk' ? 'Durum: Yürüme' : 'Durum: Bekleme', w * 0.2 - 50, gy + 58);
    // kare şeridi (sprite sheet)
    const x0 = w * 0.4, cw = Math.min(60, (w * 0.56) / frames), ch = cw * 1.4;
    ctx.fillStyle = COL.mute; ctx.font = '11px IBM Plex Sans, sans-serif'; ctx.fillText('Sprite sheet', x0, gy - 74);
    for (let i = 0; i < frames; i++) {
      const x = x0 + i * cw;
      ctx.fillStyle = i === cur ? '#ebecfa' : '#fff'; ctx.fillRect(x, gy - 66, cw - 3, ch);
      ctx.strokeStyle = i === cur ? COL.acc : COL.line; ctx.lineWidth = i === cur ? 2 : 1; ctx.strokeRect(x, gy - 66, cw - 3, ch);
      drawMan(ctx, x + cw / 2 - 1.5, gy - 66 + ch * 0.66, cw / 95, pose(i / frames), i === cur ? COL.acc : "#9aa0b0");
    }
  }
}
