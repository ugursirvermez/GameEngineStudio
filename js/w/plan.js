// 14 haftalık plan: haftaya tıklayınca ayrıntı açılır.
import { h } from './ui.js';

const W = [
  ['Derse giriş', 'Model, modelleme ve oyun motorları', 'Sprite tabanlı üretim', 'Mesh ve materyal tabanlı üretim'],
  ['Unity ve şablonlar', 'Unity arayüzü, proje yapısı ve şablonlar', 'Universal 2D şablonu', 'Universal 3D şablonu'],
  ['GameObject', 'GameObject, bileşen ve prefab', 'Sprite Renderer, sıralama katmanları', 'Mesh Filter, Mesh Renderer, hiyerarşi'],
  ['Görsel varlıklar', 'Sprite, doku ve materyal', 'Sprite içe aktarma, Sprite Atlas', 'Materyal, doku, normal haritası'],
  ['Sahne tasarımı', 'Tilemap, arazi ve modüler yapılar', 'Tilemap, Rule Tile', 'Blok taslak, Terrain, modüler parçalar'],
  ['Uzay ve kamera', 'Transform, koordinat sistemleri ve kamera', 'Orthographic kamera, paralaks', 'Perspective kamera, Quaternion'],
  ['Hareket', 'C# ile hareket ve girdi', 'Rigidbody2D', 'CharacterController'],
  ['VİZE', 'Uygulamalı sınav · %40', 'Seçilen yolda çalışan sahne', 'Seçilen yolda çalışan sahne'],
  ['Fizik', 'Fizik ve çarpışma', 'Collider2D, trigger', 'Collider, raycast'],
  ['Işık', 'Işıklandırma', 'Light 2D', 'Gerçek zamanlı ve önceden hesaplanmış ışık'],
  ['Animasyon', 'Animasyon ve karakter', 'Sprite animasyonu, Animator', 'Rig, Avatar, Blend Tree'],
  ['Arayüz', 'Kullanıcı arayüzü, oyun döngüsü ve kayıt', 'Canvas, puan ve süre göstergeleri', 'Dünya içi arayüz, kaydetme'],
  ['Yayınlama', 'Ses, efektler, kullanıcı testi ve yayınlama', 'Ses, parçacık efektleri, web derlemesi', 'Görüntü sonrası efektler, performans'],
  ['FİNAL', 'Final projesi sunumları · %60', 'Final projesi', 'Final projesi'],
];

export default function mount(root) {
  const base = root.dataset.base || '';
  const cells = W.map((w, i) => {
    const exam = i === 7 || i === 13;
    return h('button', {
      type: 'button',
      style: {
        border: '1px solid ' + (exam ? '#3e44b8' : '#e1ddd3'), borderRadius: '9px', padding: '.5rem .45rem', textAlign: 'left',
        background: exam ? '#ebecfa' : '#fff', cursor: 'pointer', minHeight: '5.2rem', display: 'flex', flexDirection: 'column', gap: '.25rem',
      },
    },
    h('span', { style: { fontFamily: 'IBM Plex Mono, monospace', fontSize: '.68rem', color: '#737885' } }, String(i + 1).padStart(2, '0')),
    h('span', { style: { fontSize: '.74rem', fontWeight: 600, lineHeight: 1.25, color: exam ? '#3e44b8' : '#15171c' } }, w[0]),
    exam ? null : h('span', { style: { display: 'flex', gap: '3px', marginTop: 'auto' } },
      h('i', { style: { height: '4px', flex: 1, borderRadius: '2px', background: '#0d8a7d' } }),
      h('i', { style: { height: '4px', flex: 1, borderRadius: '2px', background: '#cf7614' } })));
  });
  const grid = h('div', { class: 'plan-grid' }, cells);
  const detail = h('div', { style: { padding: '1rem 1.15rem', borderTop: '1px solid #ece9e2', minHeight: '7.5rem' } });
  root.append(grid, detail);

  const pick = (i) => {
    cells.forEach((c, j) => { c.style.outline = j === i ? '2px solid #3e44b8' : 'none'; c.style.outlineOffset = '1px'; });
    const w = W[i];
    const link = i === 0 ? `${base}./` : `${base}materyaller/hafta-${String(i + 1).padStart(2, '0')}.html`;
    detail.innerHTML = '';
    detail.append(
      h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '.5rem', alignItems: 'baseline' } },
        h('div', {}, h('span', { style: { fontSize: '.72rem', color: '#737885', fontWeight: 600, letterSpacing: '.08em' } }, `${i + 1}. HAFTA`),
          h('div', { style: { fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 600 } }, w[1])),
        h('a', { href: link, class: 'btn' }, i === 0 ? 'Bu sayfa' : 'Ders notunu aç →')),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '.6rem', marginTop: '.7rem' } },
        h('div', { style: { borderLeft: '3px solid #0d8a7d', paddingLeft: '.7rem', fontSize: '.86rem' } }, h('div', { class: 't2d', style: { fontSize: '.72rem' } }, '2B YOLUNDA'), w[2]),
        h('div', { style: { borderLeft: '3px solid #cf7614', paddingLeft: '.7rem', fontSize: '.86rem' } }, h('div', { class: 't3d', style: { fontSize: '.72rem' } }, '3B YOLUNDA'), w[3])));
  };
  cells.forEach((c, i) => c.addEventListener('click', () => pick(i)));
  pick(0);
}
