// Arayüz çapaları ve Canvas Scaler: ekran boyutu değişince ne oluyor?
import { h, slider, seg } from './ui.js';

export default function mount(root) {
  let anchors = 'dogru', scale = 'ekran', wPct = 100, ratio = 16 / 9;
  const screen = h('div', { style: { position: 'relative', margin: '0 auto', background: 'linear-gradient(#8fb3cf,#cfe0ea 60%,#b9a784 60%)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 0 3px #15171c' } });
  const el = (txt, css) => { const d = h('div', { style: Object.assign({ position: 'absolute', background: 'rgba(21,23,28,.82)', color: '#fff', borderRadius: '6px', fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'IBM Plex Sans, sans-serif' }, css) }, txt); screen.append(d); return d; };
  const score = el('Doğru: 3', {}), timer = el('01:24', {}), btn = el('Yeniden dene', { background: '#3e44b8' }), bar = el('', { background: 'rgba(21,23,28,.5)' });
  const wrap = h('div', { class: 'w-stage', style: { padding: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '320px' } }, screen);
  root.append(wrap);
  const slW = slider({ label: 'Ekran genişliği', min: 40, max: 100, step: 1, value: 100, fmt: (v) => v + '%', oninput: (v) => { wPct = v; lay(); } });
  const sR = seg({ label: 'Oran', options: [{ v: '16:9', t: '16:9 projeksiyon' }, { v: '4:3', t: '4:3' }, { v: '9:16', t: 'Telefon' }], value: '16:9', onchange: (v) => { const [a, b] = v.split(':'); ratio = a / b; lay(); } });
  const sA = seg({ label: 'Çapalar', options: [{ v: 'dogru', t: 'Kenarlara' }, { v: 'orta', t: 'Hepsi ortaya' }], value: 'dogru', onchange: (v) => { anchors = v; lay(); } });
  const sS = seg({ label: 'Canvas Scaler', options: [{ v: 'ekran', t: 'Scale With Screen Size' }, { v: 'sabit', t: 'Constant Pixel Size' }], value: 'ekran', onchange: (v) => { scale = v; lay(); } });
  root.append(h('div', { class: 'w-bar' }, slW.el, sR.el, sA.el, sS.el));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Arayüz 1920 × 1080 için tasarlandı. <i>Telefon</i> oranına geçin, sonra çapaları <i>Hepsi ortaya</i> yapın: öğeler ekranın dışına taşar. <i>Constant Pixel Size</i> seçiliyken ekranı küçültünce yazıların ekrana göre büyüdüğüne dikkat edin.' }));

  function lay() {
    const maxW = wrap.clientWidth - 40, maxH = 300;
    let W = maxW * (wPct / 100), H = W / ratio;
    if (H > maxH) { H = maxH; W = H * ratio; }
    screen.style.width = W + 'px'; screen.style.height = H + 'px';
    // referans 1920x1080: ölçek katsayısı
    // Scale With Screen Size, Match = 0,5: genişlik ve yükseklik oranlarının geometrik ortalaması
    const k = scale === 'ekran' ? Math.sqrt((W / 1920) * (H / 1080)) * 2.4 : 0.9;
    const f = (px) => px * k;
    [score, timer, btn].forEach((e) => { e.style.fontSize = f(30) + 'px'; e.style.padding = `${f(10)}px ${f(18)}px`; });
    bar.style.height = f(18) + 'px'; bar.style.width = f(360) + 'px';
    const m = f(28);
    const place = (e, ax, ay, dx, dy) => {
      // ax, ay: çapa (0 sol/üst, .5 orta, 1 sağ/alt); dx, dy: 1920x1080 tasarımındaki uzaklık
      const ew = e.offsetWidth, eh = e.offsetHeight;
      e.style.left = ax * W + f(dx) - ax * ew + 'px';
      e.style.top = ay * H + f(dy) - ay * eh + 'px';
    };
    if (anchors === 'dogru') {
      place(score, 0, 0, 28, 28); place(timer, 1, 0, -28, 28); place(btn, 0.5, 1, 0, -28); place(bar, 0.5, 0, 0, 40);
    } else {
      // ortaya çapalı: tasarım ekranındaki konumlarını merkeze göre korurlar
      place(score, 0.5, 0.5, -960 + 28 + 90, -540 + 28 + 25); place(timer, 0.5, 0.5, 960 - 28 - 70, -540 + 28 + 25);
      place(btn, 0.5, 0.5, 0, 540 - 28 - 30); place(bar, 0.5, 0.5, 0, -540 + 49);
    }
  }
  new ResizeObserver(lay).observe(wrap);
  requestAnimationFrame(lay);
}
