// GameObject + bileşenler: bir nesnenin ne olduğunu ona eklenen bileşenler belirler.
import { h, button, canvasStage, loop, clamp, rr, COL } from './ui.js';

const COMPS = [
  { id: 'tr', t: 'Transform', d: 'Konum, dönüş, ölçek. Her nesnede vardır, kaldırılamaz.', locked: true },
  { id: 'sr', t: 'Sprite Renderer', d: 'Nesneyi ekranda bir görüntü olarak çizer.' },
  { id: 'rb', t: 'Rigidbody2D', d: 'Yerçekimi ve kuvvetlerden etkilenmesini sağlar.' },
  { id: 'co', t: 'BoxCollider2D', d: 'Başka nesnelere temas eden bir sınır ekler.' },
  { id: 'pm', t: 'PlayerMovement', d: 'Script: ok tuşlarıyla yürür, boşlukla zıplar.' },
];

export default function mount(root) {
  const on = { tr: true, sr: false, rb: false, co: false, pm: false };
  const panel = h('div', { class: 'w-panel' },
    h('div', { style: { fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#737885', fontWeight: 600, margin: '.1rem .55rem .5rem' } }, 'Inspector · Oyuncu'),
    COMPS.map((c) => {
      const inp = h('input', { type: 'checkbox', checked: on[c.id], disabled: c.locked });
      inp.addEventListener('change', () => { on[c.id] = inp.checked; if (c.id === 'pm' && inp.checked) st.cv.focus(); describe(); });
      return h('label', { class: 'chk' + (c.locked ? ' locked' : '') }, inp, h('span', {}, h('span', { class: 't' }, c.t), h('span', { class: 'd' }, c.d)));
    }));
  const right = h('div', {});
  root.append(h('div', { class: 'w-side' }, panel, right));
  const st = canvasStage(right, { aspect: 0.56, min: 300, max: 420 });
  const { ctx } = st;
  st.cv.tabIndex = 0;
  st.cv.style.outline = 'none';

  const status = h('div', { class: 'msg info', style: { flex: '1 1 18rem' } });
  const keys = { l: false, r: false, j: false };
  const hold = (k) => {
    const b = button(k === 'l' ? '◀' : k === 'r' ? '▶' : 'Zıpla', null);
    const set = (v) => (e) => { e.preventDefault(); keys[k] = v; };
    b.addEventListener('pointerdown', set(true)); b.addEventListener('pointerup', set(false)); b.addEventListener('pointerleave', set(false));
    return b;
  };
  const pad = h('div', { style: { display: 'flex', gap: '.4rem' } }, hold('l'), hold('r'), hold('j'));
  const reset = button('Sıfırla', () => { p.x = st.w * 0.45; p.y = 70; p.vx = p.vy = 0; falls = 0; });
  root.append(h('div', { class: 'w-bar' }, status, pad, reset));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Bileşenleri tek tek açın. Önce yalnızca <i>Rigidbody2D</i>’yi açtığınızda nesne nereye gidiyor? Sonra <i>BoxCollider2D</i>’yi ekleyin. <i>PlayerMovement</i> açıkken tuvale tıklayıp <span class="kbd">←</span> <span class="kbd">→</span> <span class="kbd">boşluk</span> ile oynayın.' }));

  const map = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', Space: 'j', ArrowUp: 'j', KeyW: 'j' };
  st.cv.addEventListener('keydown', (e) => { if (map[e.code]) { keys[map[e.code]] = true; e.preventDefault(); } });
  st.cv.addEventListener('keyup', (e) => { if (map[e.code]) keys[map[e.code]] = false; });
  st.cv.addEventListener('pointerdown', () => st.cv.focus());

  const p = { x: 0, y: 70, vx: 0, vy: 0, w: 38, h: 50, face: 1 };
  let falls = 0, grounded = false;
  const groundY = () => st.h - 52;
  const plat = () => ({ x: st.w * 0.64, y: st.h - 132, w: 130, h: 16 });
  st.onResize(() => { if (!p.x) p.x = st.w * 0.45; });
  p.x = st.w * 0.45;

  function describe() {
    const s = [];
    if (!on.sr) s.push('Görünmüyor: yalnızca bir konum bilgisi var (Sahne görünümündeki kesik çizgi).');
    else s.push('Ekranda bir görüntü olarak çiziliyor.');
    if (on.rb && !on.co) s.push('Yerçekimine tabi ama çarpışma sınırı olmadığı için zeminin içinden geçip düşüyor.');
    if (on.rb && on.co) s.push('Düşüyor ve zemine çarpıp duruyor.');
    if (!on.rb && on.co) s.push('Sınırı var ama Rigidbody olmadığı için yerinden kıpırdamıyor.');
    if (on.pm && !on.rb) s.push('Script tuşları okuyor, nesne kayıyor; zıplamak için fizik gerekir.');
    if (on.pm && on.rb) s.push('Tuşlarla hareket ediyor.');
    status.textContent = s.join(' ');
    pad.style.display = on.pm ? 'flex' : 'none';
  }
  describe();

  loop(root, (dt) => {
    const G = 1500, gy = groundY(), pl = plat();
    if (on.pm) {
      const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      p.vx = dir * 220; if (dir) p.face = dir;
      if (keys.j && on.rb && grounded) { p.vy = -620; grounded = false; }
    } else p.vx = 0;
    if (on.rb) p.vy += G * dt; else p.vy = 0;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, p.w / 2 + 4, st.w - p.w / 2 - 4);
    grounded = false;
    if (on.co && on.rb) {
      if (p.y + p.h / 2 >= gy && p.y - p.vy * dt + p.h / 2 <= gy + 1) { p.y = gy - p.h / 2; p.vy = 0; grounded = true; }
      const top = pl.y;
      if (p.vy >= 0 && p.x > pl.x - p.w / 2 && p.x < pl.x + pl.w + p.w / 2 && p.y + p.h / 2 >= top && p.y + p.h / 2 - p.vy * dt <= top + 2) { p.y = top - p.h / 2; p.vy = 0; grounded = true; }
      if (p.y + p.h / 2 > gy) { p.y = gy - p.h / 2; p.vy = 0; grounded = true; }
    }
    if (p.y - p.h / 2 > st.h + 20) { p.y = -40; p.vy = 0; falls++; }
    draw();
  });

  function draw() {
    const { w, h: H } = st; const gy = groundY(), pl = plat();
    ctx.clearRect(0, 0, w, H);
    // sahne ızgarası
    ctx.strokeStyle = '#efece5'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // zemin ve platform (onların collider'ı her zaman var)
    ctx.fillStyle = '#d9cfba'; ctx.fillRect(0, gy, w, H - gy);
    ctx.fillStyle = '#c7bca4'; ctx.fillRect(0, gy, w, 4);
    ctx.fillStyle = '#d9cfba'; rr(ctx, pl.x, pl.y, pl.w, pl.h, 4); ctx.fill();
    ctx.fillStyle = COL.mute; ctx.font = '11px IBM Plex Sans, sans-serif';
    ctx.fillText('Zemin (BoxCollider2D)', 10, gy + 20);
    const x = p.x - p.w / 2, y = p.y - p.h / 2;
    // sprite
    if (on.sr) {
      ctx.fillStyle = COL.acc; rr(ctx, x, y, p.w, p.h, 10); ctx.fill();
      ctx.fillStyle = '#fff';
      const ex = p.x + p.face * 6;
      ctx.beginPath(); ctx.arc(ex - 6, y + 17, 5, 0, 7); ctx.arc(ex + 6, y + 17, 5, 0, 7); ctx.fill();
      ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.arc(ex - 5 + p.face * 1.5, y + 18, 2.2, 0, 7); ctx.arc(ex + 7 + p.face * 1.5, y + 18, 2.2, 0, 7); ctx.fill();
    } else {
      ctx.setLineDash([4, 4]); ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = 1.2; rr(ctx, x, y, p.w, p.h, 10); ctx.stroke(); ctx.setLineDash([]);
    }
    // collider gizmo
    if (on.co) { ctx.strokeStyle = '#27b35a'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, p.w, p.h); }
    // transform gizmo
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#e0473b'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 34, p.y); ctx.stroke();
    ctx.fillStyle = '#e0473b'; ctx.beginPath(); ctx.moveTo(p.x + 40, p.y); ctx.lineTo(p.x + 31, p.y - 5); ctx.lineTo(p.x + 31, p.y + 5); ctx.fill();
    ctx.strokeStyle = '#34a853'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 34); ctx.stroke();
    ctx.fillStyle = '#34a853'; ctx.beginPath(); ctx.moveTo(p.x, p.y - 40); ctx.lineTo(p.x - 5, p.y - 31); ctx.lineTo(p.x + 5, p.y - 31); ctx.fill();
    ctx.fillStyle = COL.ink2; ctx.font = '11px IBM Plex Mono, monospace';
    const ux = ((p.x - w / 2) / 32).toFixed(1), uy = ((gy - p.y) / 32).toFixed(1);
    ctx.fillText(`Position (${ux}, ${uy})`, 10, 18);
    if (falls) ctx.fillText(`Düşme sayısı: ${falls}`, 10, 34);
  }
}
