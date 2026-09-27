// Eğitimde Modelleme ve Tasarım — ortak sayfa betiği
// Görünüm (eğitmen/sunum), içindekiler, ilerleme çubuğu, ders zamanlayıcısı, etkileşim yükleyici

const root = document.documentElement;

/* ---------- görünüm ---------- */
const KEY = 'emt_gorunum';
const modeBtn = document.getElementById('modeBtn');
function setMode(m) {
  root.classList.toggle('sunum', m === 'sunum');
  if (modeBtn) modeBtn.textContent = m === 'sunum' ? 'Eğitmen görünümü' : 'Sunum görünümü';
}
if (modeBtn) {
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  setMode(new URLSearchParams(location.search).get('gorunum') || saved || 'egitmen');
  modeBtn.addEventListener('click', () => {
    const m = root.classList.contains('sunum') ? 'egitmen' : 'sunum';
    setMode(m);
    try { localStorage.setItem(KEY, m); } catch (e) {}
  });
}

/* ---------- ilerleme çubuğu ---------- */
const prog = document.getElementById('progress');
const onScroll = () => {
  const max = root.scrollHeight - root.clientHeight;
  if (prog) prog.style.width = (max > 0 ? (root.scrollTop / max) * 100 : 0) + '%';
};
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- koyu açılış üzerinde üst şerit ---------- */
const mast = document.querySelector('.masthead');
const hero = document.querySelector('.hero');
if (mast && hero) {
  const dk = () => mast.classList.toggle('on-dark', hero.getBoundingClientRect().bottom > mast.offsetHeight);
  document.addEventListener('scroll', dk, { passive: true }); dk();
}

/* ---------- içindekiler ---------- */
const links = [...document.querySelectorAll('.rail a[href^="#"]')];
const rail = document.querySelector('.rail');
const io2 = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-15% 0px -70% 0px' });
links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean).forEach((s) => io2.observe(s));
if (rail && hero) new IntersectionObserver(([e]) => rail.classList.toggle('hidden', e.isIntersecting)).observe(hero);

/* ---------- ders zamanlayıcısı ---------- */
const tm = document.getElementById('timer');
if (tm) {
  const segs = [...tm.querySelectorAll('.timer-seg')];
  const plan = segs.map((s) => ({ el: s, min: +s.dataset.min, target: s.dataset.target }));
  const total = plan.reduce((a, p) => a + p.min, 0) * 60;
  segs.forEach((s) => (s.style.flexGrow = s.dataset.min));
  const clock = tm.querySelector('.timer-clock');
  const now = tm.querySelector('.timer-now');
  const startBtn = tm.querySelector('[data-act=start]');
  const resetBtn = tm.querySelector('[data-act=reset]');
  let running = false, elapsed = 0, last = 0, iv = 0;
  try { elapsed = +sessionStorage.getItem('emt_timer') || 0; } catch (e) {}
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function paint() {
    let acc = 0, cur = null;
    plan.forEach((p) => {
      const a = acc * 60, b = (acc + p.min) * 60;
      const f = Math.max(0, Math.min(1, (elapsed - a) / (b - a)));
      p.el.querySelector('i').style.width = f * 100 + '%';
      const isNow = elapsed >= a && elapsed < b && (running || elapsed > 0);
      p.el.classList.toggle('now', isNow);
      if (isNow) cur = { p, left: b - elapsed };
      acc += p.min;
    });
    clock.textContent = `${fmt(elapsed)} / ${fmt(total)}`;
    now.innerHTML = cur ? `Şu an: <b>${cur.p.el.querySelector('span').textContent}</b> · bu bölüm için ${Math.ceil(cur.left / 60)} dk kaldı`
      : elapsed >= total ? '<b>Ders süresi doldu.</b>' : 'Dersi başlatınca hangi bölümde olmanız gerektiği burada görünür.';
    try { sessionStorage.setItem('emt_timer', String(Math.floor(elapsed))); } catch (e) {}
  }
  const tick = () => { const t = performance.now(); elapsed = Math.min(total, elapsed + (t - last) / 1000); last = t; paint(); };
  startBtn.addEventListener('click', () => {
    running = !running;
    if (running) { last = performance.now(); iv = setInterval(tick, 500); startBtn.textContent = 'Duraklat'; }
    else { clearInterval(iv); startBtn.textContent = elapsed ? 'Devam et' : 'Dersi başlat'; }
    paint();
  });
  resetBtn.addEventListener('click', () => { elapsed = 0; if (running) startBtn.click(); startBtn.textContent = 'Dersi başlat'; paint(); });
  segs.forEach((s) => s.addEventListener('click', () => {
    const t = document.getElementById(s.dataset.target);
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  }));
  if (elapsed) startBtn.textContent = 'Devam et';
  paint();
}

/* ---------- etkileşim yükleyici ---------- */
const wBase = new URL('./w/', import.meta.url);
const VER = new URL(import.meta.url).searchParams.get('v') || '1';   // önbellek için sürüm
const pending = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  pending.unobserve(e.target);
  const el = e.target;
  import(new URL(el.dataset.widget + '.js?v=' + VER, wBase).href)
    .then((m) => m.default(el))
    .catch((err) => {
      console.error(err);
      el.innerHTML = '<p class="msg bad" style="margin:1rem">Bu etkileşim yüklenemedi. Sayfayı bir web sunucusu üzerinden açtığınızdan emin olun.</p>';
    });
}), { rootMargin: '400px 0px' });
document.querySelectorAll('[data-widget]').forEach((el) => { el.classList.add('w'); pending.observe(el); });
