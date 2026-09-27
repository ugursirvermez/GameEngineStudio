// Collider ve trigger: aynı top, iki kutu, olay günlüğü.
import { h, button, canvasStage, loop, rr, COL } from './ui.js';

export default function mount(root) {
  const boxes = [{ n: 'Kutu A', trig: false, inside: false }, { n: 'Kutu B', trig: true, inside: false }];
  let rb = true, ball = null, t0 = performance.now();
  const logEl = h('div', { style: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '.74rem', lineHeight: 1.7, height: '100%', overflow: 'auto', padding: '.6rem .8rem' } });
  const log = (txt, col) => {
    const s = ((performance.now() - t0) / 1000).toFixed(2);
    logEl.prepend(h('div', { style: { color: col || '#c8ccd6' } }, `[${s}] ${txt}`));
    while (logEl.childNodes.length > 40) logEl.lastChild.remove();
  };
  const left = h('div', {}); const right = h('div', { style: { background: '#151821', color: '#c8ccd6', display: 'flex', flexDirection: 'column' } },
    h('div', { style: { padding: '.45rem .8rem', fontSize: '.72rem', borderBottom: '1px solid #262b39', color: '#8a90a0' } }, 'Console'), logEl);
  root.append(h('div', { class: 'split' }, left, right));
  const st = canvasStage(left, { aspect: 0.62, min: 300, max: 400 });
  log('Bir kutunun üstünden top bırakın.', '#8a90a0');

  const tg = (i) => {
    const inp = h('input', { type: 'checkbox', checked: boxes[i].trig });
    inp.addEventListener('change', () => { boxes[i].trig = inp.checked; });
    return h('label', { class: 'chk', style: { padding: '.25rem .4rem' } }, inp, h('span', { class: 't' }, `${boxes[i].n}: Is Trigger`));
  };
  const rbIn = h('input', { type: 'checkbox', checked: true }); rbIn.addEventListener('change', () => { rb = rbIn.checked; });
  root.append(h('div', { class: 'w-bar' },
    button('A’nın üstünden bırak', () => drop(0), 'btn btn-solid'), button('B’nin üstünden bırak', () => drop(1), 'btn btn-solid'),
    tg(0), tg(1), h('label', { class: 'chk', style: { padding: '.25rem .4rem' } }, rbIn, h('span', { class: 't' }, 'Topta Rigidbody2D'))));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>A katı, B trigger. İkisinin üstünden de top bırakıp Console’daki iletileri karşılaştırın. Sonra topun Rigidbody2D’sini kapatın: top düşer mi, ileti gelir mi?' }));

  const geo = () => {
    const w = st.w, H = st.h, gy = H - 40;
    return { gy, B: [{ x: w * 0.18, y: gy - 80, w: w * 0.26, h: 80 }, { x: w * 0.56, y: gy - 80, w: w * 0.26, h: 80 }] };
  };
  function drop(i) {
    const g = geo(); const b = g.B[i];
    ball = { x: b.x + b.w / 2, y: 30, vy: 0, r: 16, rest: false, onBox: null };
    boxes.forEach((bx) => (bx.inside = false));
    if (!rb) log('Top bırakıldı ama Rigidbody2D yok: fizik motoru onu hareket ettirmiyor.', '#ffcf66');
  }
  loop(root, (dt) => {
    const g = geo();
    if (ball && rb && !ball.rest) {
      const prevY = ball.y; ball.vy += 1400 * dt; ball.y += ball.vy * dt;
      g.B.forEach((b, i) => {
        const over = ball.x > b.x && ball.x < b.x + b.w;
        const touching = over && ball.y + ball.r >= b.y && ball.y - ball.r <= b.y + b.h;
        if (!boxes[i].trig) {
          if (over && ball.vy > 0 && prevY + ball.r <= b.y + 1 && ball.y + ball.r >= b.y) { ball.y = b.y - ball.r; if (ball.vy > 120) log(`OnCollisionEnter2D → ${boxes[i].n}`, '#7fd1a8'); ball.vy = ball.vy > 120 ? -ball.vy * 0.35 : 0; if (!ball.vy) ball.rest = true; }
        } else {
          if (touching && !boxes[i].inside) { boxes[i].inside = true; log(`OnTriggerEnter2D → ${boxes[i].n}`, '#ffcf66'); }
          if (!touching && boxes[i].inside) { boxes[i].inside = false; log(`OnTriggerExit2D → ${boxes[i].n}`, '#f3a86b'); }
        }
      });
      if (ball.y + ball.r >= g.gy) { ball.y = g.gy - ball.r; if (ball.vy > 120) log('OnCollisionEnter2D → Zemin', '#7fd1a8'); ball.vy = ball.vy > 120 ? -ball.vy * 0.35 : 0; if (!ball.vy) ball.rest = true; }
    }
    draw(g);
  });
  function draw(g) {
    const { ctx, w, h: H } = st;
    ctx.clearRect(0, 0, w, H);
    ctx.fillStyle = '#d9cfba'; ctx.fillRect(0, g.gy, w, H - g.gy);
    g.B.forEach((b, i) => {
      const trig = boxes[i].trig;
      ctx.fillStyle = trig ? 'rgba(207,118,20,.12)' : '#c9bda3'; rr(ctx, b.x, b.y, b.w, b.h, 6); ctx.fill();
      ctx.strokeStyle = trig ? COL.c3d : '#27b35a'; ctx.lineWidth = 2; if (trig) ctx.setLineDash([6, 5]);
      rr(ctx, b.x, b.y, b.w, b.h, 6); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = COL.ink; ctx.font = '600 12px IBM Plex Sans, sans-serif';
      ctx.fillText(`${boxes[i].n} · ${trig ? 'trigger' : 'katı'}`, b.x + 8, b.y + 20);
      if (boxes[i].inside) { ctx.fillStyle = COL.c3d; ctx.fillText('içeride', b.x + 8, b.y + 38); }
    });
    if (ball) { ctx.fillStyle = COL.acc; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill(); }
  }
}
