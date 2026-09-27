// Model sadeleştirir: aynı şehir, gerçek hâli ve şematik metro haritası.
import { h, svg, slider, seg, clamp, lerp, ease, tr } from './ui.js';

const ST = {
  //            gerçek konum     şematik konum
  liman:     { n: 'Liman',      g: [70, 382],  s: [80, 340] },
  carsi:     { n: 'Çarşı',      g: [205, 330], s: [220, 340] },
  belediye:  { n: 'Belediye',   g: [322, 226], s: [360, 200] },
  univ:      { n: 'Üniversite', g: [505, 192], s: [500, 200] },
  stadyum:   { n: 'Stadyum',    g: [700, 72],  s: [640, 60] },
  gol:       { n: 'Göl',        g: [296, 42],  s: [360, 60] },
  park:      { n: 'Park',       g: [344, 122], s: [360, 130] },
  hastane:   { n: 'Hastane',    g: [470, 306], s: [500, 340] },
  terminal:  { n: 'Terminal',   g: [742, 362], s: [720, 340] },
  muze:      { n: 'Müze',       g: [112, 178], s: [80, 200] },
  kutuphane: { n: 'Kütüphane',  g: [262, 318], s: [360, 340] },
  sanayi:    { n: 'Sanayi',     g: [566, 428], s: [570, 410] },
};
const LINES = [
  { c: '#d64541', stops: ['liman', 'carsi', 'belediye', 'univ', 'stadyum'] },
  { c: '#2e9e5b', stops: ['gol', 'park', 'belediye', 'hastane', 'terminal'] },
  { c: '#8e44ad', stops: ['muze', 'carsi', 'kutuphane', 'hastane', 'sanayi'] },
];
const M_PER_PX = 18;   // gerçek haritada 1 piksel = 18 m

export default function mount(root) {
  const S = svg('svg', { viewBox: '0 0 800 460', role: 'img', 'aria-label': 'Şehir ve metro haritası' });
  const stage = h('div', { class: 'w-stage' }, S);
  root.append(stage);

  // --- arka plan: şehrin kendisi (şemada kaybolacak) ---
  const bgG = svg('g');
  bgG.append(svg('path', { d: 'M0,410 C60,392 120,418 170,440 L170,460 L0,460 Z M0,300 C30,330 40,380 0,400 Z', fill: '#cfe3ef' }));
  bgG.append(svg('path', { d: 'M150,0 C210,90 250,140 240,220 C230,300 330,330 420,360 C500,386 560,380 620,460', fill: 'none', stroke: '#cfe3ef', 'stroke-width': 16 }));
  bgG.append(svg('ellipse', { cx: 300, cy: 34, rx: 70, ry: 26, fill: '#cfe3ef' }));
  bgG.append(svg('ellipse', { cx: 372, cy: 120, rx: 52, ry: 30, fill: '#dcebd3' }));
  bgG.append(svg('ellipse', { cx: 650, cy: 110, rx: 60, ry: 38, fill: '#dcebd3' }));
  // sokaklar (sabit tohumlu rastgele)
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const streets = svg('g', { stroke: '#e3ddd0', 'stroke-width': 2, fill: 'none' });
  for (let i = 0; i < 26; i++) {
    const x = rnd() * 800, y = rnd() * 460, a = rnd() * Math.PI, l = 80 + rnd() * 220;
    streets.append(svg('line', { x1: x, y1: y, x2: x + Math.cos(a) * l, y2: y + Math.sin(a) * l }));
  }
  const blocks = svg('g', { fill: '#ebe6da' });
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 780, y = rnd() * 440;
    blocks.append(svg('rect', { x, y, width: 8 + rnd() * 16, height: 6 + rnd() * 12, rx: 1, transform: `rotate(${(rnd() - 0.5) * 50} ${x} ${y})` }));
  }
  bgG.prepend(blocks); bgG.prepend(streets);
  S.append(bgG);

  const lineG = svg('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const paths = LINES.map((L) => { const p = svg('path', { stroke: L.c, 'stroke-width': 7 }); lineG.append(p); return p; });
  S.append(lineG);
  const measure = svg('line', { stroke: '#15171c', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
  S.append(measure);

  const stG = svg('g');
  const nodes = {};
  const counts = {};
  LINES.forEach((L) => L.stops.forEach((s) => (counts[s] = (counts[s] || 0) + 1)));
  for (const [id, st] of Object.entries(ST)) {
    const g = svg('g', { style: 'cursor:pointer' });
    const hub = counts[id] > 1;
    const c = svg('circle', { r: hub ? 9 : 6, fill: '#fff', stroke: hub ? '#15171c' : '#15171c', 'stroke-width': hub ? 3 : 2 });
    const tx = svg('text', { 'font-size': 13, 'font-family': 'IBM Plex Sans, sans-serif', 'font-weight': hub ? 600 : 400, fill: '#15171c', 'paint-order': 'stroke', stroke: '#fbfaf7', 'stroke-width': 4 }, st.n);
    g.append(c, tx);
    g.addEventListener('click', () => pick(id));
    stG.append(g);
    nodes[id] = { g, c, tx };
  }
  S.append(stG);

  // --- panel ---
  const barReal = h('i', { style: { display: 'block', height: '10px', background: '#15171c', borderRadius: '5px' } });
  const barMap = h('i', { style: { display: 'block', height: '10px', background: '#3e44b8', borderRadius: '5px' } });
  const pairTxt = h('div', { style: { fontWeight: 600, fontSize: '.86rem' } });
  const realTxt = h('b'); const mapTxt = h('b'); const verdict = h('div', { style: { fontSize: '.82rem', color: '#3f434d', marginTop: '.4rem' } });
  const panel = h('div', { style: { flex: '1 1 20rem', minWidth: '16rem' } },
    pairTxt,
    h('div', { class: 'read', style: { marginTop: '.4rem' } }, h('span', {}, 'Gerçek uzaklık ', realTxt), h('span', {}, 'Haritadaki uzunluk ', mapTxt)),
    h('div', { style: { display: 'grid', gridTemplateColumns: '5.5rem 1fr', gap: '.35rem .6rem', alignItems: 'center', marginTop: '.5rem', fontSize: '.74rem', color: '#737885' } },
      h('span', {}, 'Gerçek'), h('div', {}, barReal), h('span', {}, 'Harita'), h('div', {}, barMap)),
    verdict);

  let t = 0, sel = ['carsi', 'kutuphane'], nextPick = 0;
  function pick(id) {
    if (sel.includes(id)) return;
    sel[nextPick] = id; nextPick = 1 - nextPick; draw();
  }

  const P = (id) => { const s = ST[id]; const e = ease(t); return [lerp(s.g[0], s.s[0], e), lerp(s.g[1], s.s[1], e)]; };
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function curve(pts, k) {
    // Catmull-Rom → Bézier; k=0 düz çizgi
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
      const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
      d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  // haritadaki uzunluğu gerçek ölçeğe çevirmek için ortalama ölçek katsayısı
  let sumG = 0, sumS = 0;
  LINES.forEach((L) => L.stops.forEach((s, i) => { if (i) { sumG += d2(ST[L.stops[i - 1]].g, ST[s].g); sumS += d2(ST[L.stops[i - 1]].s, ST[s].s); } }));

  function draw() {
    const k = 1 - ease(t);
    bgG.setAttribute('opacity', (1 - ease(clamp(t * 1.4, 0, 1))).toFixed(3));
    LINES.forEach((L, i) => paths[i].setAttribute('d', curve(L.stops.map(P), k * 1.4)));
    for (const id of Object.keys(ST)) {
      const [x, y] = P(id); const n = nodes[id];
      n.c.setAttribute('cx', x); n.c.setAttribute('cy', y);
      n.tx.setAttribute('x', x + 12); n.tx.setAttribute('y', y - 10);
      const on = sel.includes(id);
      n.c.setAttribute('fill', on ? '#3e44b8' : '#fff');
    }
    const a = P(sel[0]), b = P(sel[1]);
    measure.setAttribute('x1', a[0]); measure.setAttribute('y1', a[1]);
    measure.setAttribute('x2', b[0]); measure.setAttribute('y2', b[1]);

    const real = d2(ST[sel[0]].g, ST[sel[1]].g) * M_PER_PX;
    // haritadaki uzunluk: o anki çizimde ölçülen, gerçek ölçeğe çevrilmiş
    const scaleNow = lerp(1, sumG / sumS, ease(t));
    const mapLen = d2(a, b) * scaleNow * M_PER_PX;
    pairTxt.textContent = `${ST[sel[0]].n} – ${ST[sel[1]].n}`;
    realTxt.textContent = tr(real / 1000, 1) + ' km';
    mapTxt.textContent = tr(mapLen / 1000, 1) + ' km';
    const mx = Math.max(real, mapLen, 1);
    barReal.style.width = (real / mx) * 100 + '%';
    barMap.style.width = (mapLen / mx) * 100 + '%';
    const r = mapLen / real;
    verdict.textContent = t < 0.05 ? 'Gerçek haritada iki uzunluk aynıdır.'
      : r > 1.25 ? `Harita bu mesafeyi ${tr(r, 1)} kat uzun gösteriyor.`
      : r < 0.8 ? `Harita bu mesafeyi ${tr(1 / r, 1)} kat kısa gösteriyor.`
      : 'Bu iki durak arasında harita gerçeğe yakın.';
  }

  const sl = slider({ label: 'Şehir', min: 0, max: 1, step: 0.001, value: 0, fmt: () => 'Şema', oninput: (v) => { t = v; draw(); } });
  const sg = seg({ options: [{ v: 0, t: 'Gerçek' }, { v: 0.5, t: 'Ara' }, { v: 1, t: 'Şema' }], value: 0, onchange: (v) => { t = +v; sl.set(t); draw(); } });
  sg.el.style.alignSelf = 'flex-start';
  root.append(h('div', { class: 'w-bar' }, h('div', { style: { flex: '1 1 18rem', display: 'flex', flexDirection: 'column', gap: '.6rem' } }, sl.el, sg.el), panel));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Kaydırıcıyı sona getirin. Çarşı ile Kütüphane şemada, Kütüphane ile Hastane kadar uzak görünüyor. Gerçekte öyle mi? Karşılaştırmak için haritada başka iki durağa tıklayın.' }));
  draw();
}
