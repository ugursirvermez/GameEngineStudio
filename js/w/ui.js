// Etkileşimli şekiller için ortak yardımcılar

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

export function svg(tag, attrs = {}, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

const fmtDef = (v) => String(v);

// Etiketli kaydırıcı
export function slider({ label, min, max, step = 1, value, fmt = fmtDef, oninput, cls = '' }) {
  const out = h('output');
  const inp = h('input', { type: 'range', min, max, step, value, class: cls, 'aria-label': label });
  const paint = () => {
    const p = ((+inp.value - min) / (max - min)) * 100;
    inp.style.setProperty('--p', p + '%');
    out.textContent = fmt(+inp.value);
  };
  inp.addEventListener('input', () => { paint(); oninput && oninput(+inp.value); });
  paint();
  const el = h('div', { class: 'ctl' }, h('label', {}, label), inp, out);
  return {
    el, input: inp,
    get: () => +inp.value,
    set: (v, fire = false) => { inp.value = v; paint(); if (fire && oninput) oninput(+inp.value); },
    enable: (on) => { inp.disabled = !on; el.style.opacity = on ? '' : '.45'; },
  };
}

// Parçalı seçim düğmesi
export function seg({ label, options, value, onchange }) {
  const btns = options.map((o) => h('button', { type: 'button', 'data-v': o.v }, o.t));
  const box = h('div', { class: 'seg', role: 'group', 'aria-label': label || '' }, btns);
  const set = (v, fire = false) => {
    btns.forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
    if (fire && onchange) onchange(v);
  };
  btns.forEach((b, i) => b.addEventListener('click', () => set(options[i].v, true)));
  set(value);
  const el = label ? h('div', { style: { display: 'flex', alignItems: 'center' } }, h('span', { class: 'seg-l' }, label), box) : box;
  return { el, set };
}

export function button(text, onclick, cls = 'btn') {
  return h('button', { type: 'button', class: cls, onclick }, text);
}

// Kapsayıcıya uyan, yüksek çözünürlüklü tuval
export function canvasStage(parent, { aspect = 0.5, min = 240, max = 560, cls = '' } = {}) {
  const wrap = h('div', { class: 'w-stage ' + cls });
  const cv = h('canvas');
  wrap.append(cv);
  parent.append(wrap);
  const ctx = cv.getContext('2d');
  const st = { wrap, cv, ctx, w: 0, h: 0, dpr: 1, cbs: [] };
  const fit = () => {
    const w = wrap.clientWidth || 600;
    const hh = Math.max(min, Math.min(max, Math.round(w * aspect)));
    st.dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * st.dpr); cv.height = Math.round(hh * st.dpr);
    cv.style.height = hh + 'px';
    st.w = w; st.h = hh;
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    st.cbs.forEach((f) => f(st));
  };
  st.onResize = (f) => st.cbs.push(f);
  new ResizeObserver(fit).observe(wrap);
  fit();
  // tuval koordinatına çevirme
  st.pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  return st;
}

// Yalnızca görünürken çalışan animasyon döngüsü. fn(dt, zaman) çağrılır.
export function loop(el, fn) {
  let vis = false, raf = 0, last = 0;
  const tick = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    fn(dt, t / 1000);
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!raf && vis) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; vis ? start() : stop(); }, { rootMargin: '120px' }).observe(el);
  return { stop, start };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export const tr = (n, d = 2) => Number(n).toFixed(d).replace('.', ',');

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export const COL = {
  ink: '#15171c', ink2: '#3f434d', mute: '#737885', line: '#e1ddd3', paper: '#fbfaf7',
  c2d: '#0d8a7d', c3d: '#cf7614', acc: '#3e44b8', good: '#1e8a4b', bad: '#c0392b',
};
