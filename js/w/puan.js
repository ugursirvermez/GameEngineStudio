// Değerlendirme: 100 puanın ölçütlere dağılımı.
import { h } from './ui.js';

const PARTS = [
  { k: 'Vize', c: '#3e44b8', items: [
    ['Proje kurulumu ve düzeni', 5, 'Doğru şablon, anlamlı klasör ve dosya adları, kaydedilmiş sahne.'],
    ['Varlıklar ve materyal', 8, '2B: sprite’ların doğru ayarlarla içe aktarılması. 3B: materyal kurulup nesneye uygulanması.'],
    ['Sahne', 9, 'Tilemap ya da 3B yapılarla kurulmuş, dolaşılabilir ve okunaklı bir alan.'],
    ['Hareket kodu', 12, 'Girdiyi okuyan, hatasız derlenen ve oynanabilir bir hareket.'],
    ['Öğretimsel gerekçe', 6, 'Sahnenin hangi öğrenme çıktısını nasıl hedeflediğinin yazılı açıklaması.'],
  ] },
  { k: 'Final', c: '#cf7614', items: [
    ['Teknik işlevsellik', 15, 'Prototip baştan sona hatasız oynanıyor; hareket, etkileşim ve geri bildirim çalışıyor.'],
    ['Öğretim tasarımı', 15, 'Açık bir öğrenme çıktısı, hedef kitleye uygunluk, çıktının oyunun temel eylemine yerleştirilmesi.'],
    ['Modelleme ve görsel tasarım', 10, 'Tutarlı görseller, düzenli sahne, okunaklı arayüz, amaca uygun kamera ve ışık.'],
    ['Kod düzeni', 8, 'Anlamlı adlandırma, görevlerin bileşenlere bölünmesi, açıklama satırları.'],
    ['Kullanıcı testi', 6, 'En az üç kişiyle deneme, bulguların raporlanması, en az iki düzeltme.'],
    ['Sunum', 6, 'Oyunun oynatılması; öğrenme çıktısının ve tasarım kararlarının gerekçelendirilmesi.'],
  ] },
];

export default function mount(root) {
  const bar = h('div', { style: { display: 'flex', height: '54px', gap: '2px', borderRadius: '10px', overflow: 'hidden' } });
  const tops = h('div', { style: { display: 'flex', fontSize: '.78rem', fontWeight: 600, marginBottom: '.45rem' } });
  const info = h('div', { style: { minHeight: '4.4rem', marginTop: '.9rem', fontSize: '.9rem' } });
  const segs = [];
  PARTS.forEach((P) => {
    const tot = P.items.reduce((s, x) => s + x[1], 0);
    tops.append(h('div', { style: { flex: tot, color: P.c } }, `${P.k} · %${tot}`, h('span', { style: { color: '#737885', fontWeight: 400 } }, P.k === 'Vize' ? '  8. hafta, uygulamalı' : '  14. hafta, proje ve sunum')));
    P.items.forEach((it, i) => {
      const s = h('button', { type: 'button', title: it[0], style: { flex: it[1], border: 'none', cursor: 'pointer', background: P.c, opacity: 0.55 + (i % 2) * 0.2, color: '#fff', fontSize: '.72rem', fontWeight: 600, padding: 0 } }, String(it[1]));
      s.addEventListener('mouseenter', () => sel(s, P, it)); s.addEventListener('focus', () => sel(s, P, it)); s.addEventListener('click', () => sel(s, P, it));
      segs.push(s); bar.append(s);
    });
  });
  function sel(s, P, it) {
    segs.forEach((x) => (x.style.boxShadow = 'none'));
    s.style.boxShadow = 'inset 0 -5px 0 rgba(0,0,0,.35)';
    info.innerHTML = '';
    info.append(h('div', { style: { display: 'flex', gap: '.6rem', alignItems: 'baseline' } },
      h('span', { class: 'pill', style: { background: P.c, color: '#fff' } }, P.k),
      h('b', {}, it[0]), h('span', { style: { fontFamily: 'IBM Plex Mono, monospace', color: P.c, fontWeight: 600 } }, it[1] + ' puan')),
      h('div', { style: { color: '#3f434d', marginTop: '.3rem' } }, it[2]));
  }
  root.append(h('div', { style: { padding: '1.1rem 1.15rem' } }, tops, bar, info));
  sel(segs[3], PARTS[0], PARTS[0].items[3]);
}
