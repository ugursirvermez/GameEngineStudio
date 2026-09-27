// Vize hazırlığı: öz değerlendirme listesi ve 90 dakikalık deneme zamanlayıcısı.
import { h, button } from './ui.js';

const ITEMS = [
  ['Doğru şablonla proje açıp klasör düzenini kurmak', 'hafta-02.html'],
  ['Bir nesneye bileşen ekleyip prefab’a çevirmek', 'hafta-03.html'],
  ['Sprite’ı doğru PPU ve Point filtreyle içe aktarmak', 'hafta-04.html'],
  ['Materyal kurup bir nesneye uygulamak', 'hafta-04.html'],
  ['Tilemap döşeyip Composite Collider 2D kurmak', 'hafta-05.html'],
  ['Blok taslak kurup parçaları ızgaraya oturtmak', 'hafta-05.html'],
  ['Kamerayı doğru türde ve makul ayarlarla yerleştirmek', 'hafta-06.html'],
  ['Hareket kodunu notlara bakmadan yazmak', 'hafta-07.html'],
];
const PLAN = [[10, 'Okuma ve karar'], [10, 'Kurulum ve varlıklar'], [25, 'Sahne'], [25, 'Hareket kodu'], [10, 'Gerekçe metni'], [10, 'Kontrol']];
const KEY = 'emt_vize_liste';

export default function mount(root) {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  const pr = h('i', { style: { display: 'block', height: '100%', background: '#1e8a4b', borderRadius: '4px', transition: 'width .3s' } });
  const prT = h('b');
  const list = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(19rem, 1fr))', gap: '.2rem .8rem', padding: '.8rem 1rem' } },
    ITEMS.map(([t, l], i) => {
      const cb = h('input', { type: 'checkbox', checked: saved.includes(i) });
      cb.addEventListener('change', () => {
        saved = cb.checked ? [...new Set([...saved, i])] : saved.filter((x) => x !== i);
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
        upd();
      });
      return h('label', { class: 'chk' }, cb, h('span', {}, t, h('span', { class: 'd' }, h('a', { href: l }, l.replace('hafta-0', '').replace('.html', '. hafta notu')))));
    }));
  const upd = () => { pr.style.width = (saved.length / ITEMS.length) * 100 + '%'; prT.textContent = `${saved.length} / ${ITEMS.length}`; };
  root.append(h('div', { style: { padding: '.9rem 1.15rem 0', fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '.8rem' } },
    h('span', {}, 'Notlara bakmadan yapabildiklerim'), h('div', { style: { flex: 1, height: '8px', background: '#ece9e2', borderRadius: '4px' } }, pr), prT), list);
  upd();

  // deneme zamanlayıcısı
  const total = PLAN.reduce((a, p) => a + p[0], 0) * 60;
  const segs = PLAN.map(([m, t]) => h('div', { style: { flex: m, background: '#f1efe9', borderRadius: '6px', position: 'relative', overflow: 'hidden', fontSize: '.68rem', padding: '.35rem .45rem', lineHeight: 1.25 } },
    h('i', { style: { position: 'absolute', inset: '0 auto 0 0', width: '0', background: '#d9dbf7' } }), h('span', { style: { position: 'relative' } }, t), h('small', { style: { position: 'relative', display: 'block', color: '#737885' } }, m + ' dk')));
  const clock = h('span', { style: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '1.1rem' } }, '00:00');
  let el = 0, run = false, last = 0, iv = 0;
  const paint = () => {
    let acc = 0;
    PLAN.forEach(([m], i) => { const a = acc * 60, b = (acc + m) * 60; segs[i].firstChild.style.width = Math.max(0, Math.min(1, (el - a) / (b - a))) * 100 + '%'; segs[i].style.outline = el >= a && el < b && el > 0 ? '2px solid #3e44b8' : 'none'; acc += m; });
    clock.textContent = `${String(Math.floor(el / 60)).padStart(2, '0')}:${String(Math.floor(el % 60)).padStart(2, '0')} / 90:00`;
  };
  const startBtn = button('Deneme sınavını başlat', () => {
    run = !run; startBtn.textContent = run ? 'Duraklat' : 'Devam et';
    if (run) { last = performance.now(); iv = setInterval(() => { const t = performance.now(); el = Math.min(total, el + (t - last) / 1000); last = t; paint(); }, 500); } else clearInterval(iv);
  }, 'btn btn-solid');
  root.append(h('div', { class: 'w-bar', style: { flexDirection: 'column', alignItems: 'stretch' } },
    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '.8rem', alignItems: 'center', justifyContent: 'space-between' } },
      h('span', { style: { fontSize: '.84rem' } }, h('b', {}, 'Önerilen 90 dakika. '), 'Kendi deneme projenizi yaparken zamanı tutun.'), h('span', { style: { display: 'flex', gap: '.6rem', alignItems: 'center' } }, clock, startBtn, button('Sıfırla', () => { el = 0; if (run) startBtn.click(); startBtn.textContent = 'Deneme sınavını başlat'; paint(); }))),
    h('div', { style: { display: 'flex', gap: '3px', minHeight: '42px' } }, segs)));
  paint();
}
