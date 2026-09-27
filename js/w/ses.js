// Ses geri bildirimi: aynı sesin art arda çalınması ve perde rastgeleliği.
import { h, seg, button, canvasStage } from './ui.js';

export default function mount(root) {
  let ac = null, rand = false, kind = 'dogru';
  const hits = [];
  const st = canvasStage(root, { aspect: 0.25, min: 170, max: 220 });
  const sK = seg({ label: 'Ses', options: [{ v: 'dogru', t: 'Doğru yanıt' }, { v: 'yanlis', t: 'Yanlış yanıt' }], value: 'dogru', onchange: (v) => (kind = v) });
  const sR = seg({ label: 'Perde', options: [{ v: 0, t: 'Sabit' }, { v: 1, t: '±%5 rastgele' }], value: 0, onchange: (v) => (rand = !!+v) });
  const one = button('Bir kez çal', () => play(1));
  const five = button('Art arda 6 kez', () => play(6), 'btn btn-solid');
  root.append(h('div', { class: 'w-bar' }, sK.el, sR.el, one, five));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Hoparlörü açın. Önce <i>Sabit</i> perdeyle art arda çalın, sonra <i>±%5 rastgele</i> ile. İkincisi, oyuncu arka arkaya doğru yanıt verdiğinde aynı sesin mekanik tekrarı gibi duyulmaz. Koddaki karşılığı: <code>kaynak.pitch = Random.Range(0.95f, 1.05f);</code>' }));

  function tone(t0, f, dur, type, gain) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function play(n) {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    hits.length = 0;
    for (let i = 0; i < n; i++) {
      const p = rand ? 0.95 + Math.random() * 0.1 : 1;
      const t0 = ac.currentTime + 0.05 + i * 0.28;
      if (kind === 'dogru') { tone(t0, 660 * p, 0.16, 'triangle', 0.25); tone(t0 + 0.08, 990 * p, 0.2, 'triangle', 0.2); }
      else { tone(t0, 180 * p, 0.22, 'square', 0.08); tone(t0 + 0.02, 150 * p, 0.22, 'square', 0.06); }
      hits.push({ p, at: performance.now() + (0.05 + i * 0.28) * 1000 });
    }
    draw(); setTimeout(draw, n * 300 + 200);
  }
  function draw() {
    const { ctx, w, h: H } = st;
    ctx.clearRect(0, 0, w, H);
    const mid = H / 2, x0 = 70, x1 = w - 30;
    ctx.strokeStyle = '#e1ddd3'; ctx.beginPath(); ctx.moveTo(x0, mid); ctx.lineTo(x1, mid); ctx.stroke();
    ctx.fillStyle = '#737885'; ctx.font = '11px IBM Plex Sans, sans-serif';
    ctx.fillText('perde', 14, 20); ctx.fillText('+%5', 30, mid - 52); ctx.fillText('%100', 22, mid + 4); ctx.fillText('−%5', 30, mid + 58);
    hits.forEach((hh, i) => {
      const x = x0 + ((i + 0.5) / 6) * (x1 - x0), y = mid - (hh.p - 1) * 1100;
      ctx.fillStyle = kind === 'dogru' ? '#1e8a4b' : '#c0392b';
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#3f434d'; ctx.fillText((hh.p * 100).toFixed(1).replace('.', ',') + '%', x - 18, y + 24);
    });
    if (!hits.length) { ctx.fillStyle = '#737885'; ctx.fillText('Çalınan her sesin perdesi burada görünecek.', x0, mid - 12); }
  }
  st.onResize(draw); draw();
}
