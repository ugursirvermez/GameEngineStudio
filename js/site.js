// Eğitimde Modelleme ve Tasarım — ortak sayfa betiği
// İçindekiler, ilerleme çubuğu, etkileşim yükleyici

const root = document.documentElement;

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
