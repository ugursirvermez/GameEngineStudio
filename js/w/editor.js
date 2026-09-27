// Unity editörü: pencereler ve Play Mode'da yapılan değişikliğin geri alınması.
import { h, button } from './ui.js';

const PANES = {
  hierarchy: ['Hierarchy', 'Sahnedeki bütün nesnelerin listesi. İç içe nesneler girintiyle gösterilir. Bir nesneye tıklamak onu seçer.'],
  scene: ['Scene', 'Sahnenin düzenlendiği görünüm. Nesneler burada seçilir, taşınır, döndürülür. Oyun çalışırken de açık kalır.'],
  game: ['Game', 'Oyunun kameradan nasıl görüneceğini gösterir. Oynat düğmesine basıldığında oyun burada oynanır.'],
  inspector: ['Inspector', 'Seçili nesnenin bileşenleri ve ayarları. Bir değeri buradan değiştirmek, koda dokunmadan davranışı değiştirir.'],
  project: ['Project', 'Projedeki bütün dosyalar (varlıklar). Bilgisayardaki Assets klasörünün karşılığıdır.'],
  console: ['Console', 'Hata, uyarı ve koddan yazdırılan iletiler. Kırmızı bir satır varsa oyun derlenmemiş demektir.'],
};

export default function mount(root) {
  if (!document.getElementById('ed-css')) {
    document.head.append(h('style', { id: 'ed-css', html: `
      .ed{display:grid;grid-template-columns:1fr 2.3fr 1.25fr;grid-template-rows:auto 1fr 7.5rem;gap:3px;background:#1e2129;padding:3px;height:420px;font-size:.72rem;color:#c8ccd6;transition:background .3s}
      .ed.play{background:#3a3150}
      .ed .bar{grid-column:1/-1;display:flex;justify-content:center;gap:4px;padding:4px;background:#2a2e38;border-radius:3px}
      .ed .bar button{width:30px;height:22px;border:none;border-radius:3px;background:#3b404d;color:#dfe2ea;cursor:pointer;font-size:.8rem}
      .ed .bar button.on{background:#4f7cff;color:#fff}
      .ed .p{background:#282c36;border-radius:3px;cursor:pointer;display:flex;flex-direction:column;overflow:hidden;outline:2px solid transparent;transition:outline-color .15s}
      .ed .p:hover{outline-color:#4a5061}.ed .p.sel{outline-color:#7c86ff}
      .ed .ph{background:#303542;padding:3px 8px;font-weight:600;color:#e5e7ee;display:flex;gap:10px}
      .ed .ph span.dim{color:#8a90a0;font-weight:400}
      .ed .pb{padding:6px 8px;line-height:1.7;flex:1}
      .ed .row{display:flex;justify-content:space-between;gap:6px;align-items:center}
      .ed input{width:3.8rem;background:#1c1f27;border:1px solid #454b5a;color:#fff;border-radius:3px;padding:1px 4px;font:inherit}
      .ed .view{flex:1;background:linear-gradient(#556a86,#8ea3bd 55%,#6d6450 55%,#5c5444);position:relative}
      .ed .obj{position:absolute;bottom:34%;width:34px;height:44px;border-radius:8px;background:#3e44b8}
      .ed .bottom{grid-column:1/-1;display:grid;grid-template-columns:2.3fr 1.5fr;gap:3px}
      @media (max-width:700px){.ed{grid-template-columns:1fr;grid-template-rows:auto;height:auto}.ed .bottom{grid-template-columns:1fr}.ed .view{min-height:150px}}
    ` }));
  }
  let base = 5, val = 5, playing = false, x = 0, raf = 0;
  const speed = h('input', { type: 'number', value: val, step: 1 });
  const obj = h('div', { class: 'obj', style: { left: '20%' } });
  const view = h('div', { class: 'view' }, obj);
  const consoleBody = h('div', { class: 'pb' }, h('div', {}, 'Oynat düğmesine basın.'));
  const playBtn = h('button', { type: 'button', title: 'Oynat' }, '▶');

  const pane = (id, body, extra = {}) => {
    const el = h('div', { class: 'p', 'data-p': id, ...extra }, h('div', { class: 'ph' }, PANES[id][0], id === 'scene' ? h('span', { class: 'dim' }, 'Game') : null), body);
    el.addEventListener('click', () => select(id));
    return el;
  };
  const ed = h('div', { class: 'ed' },
    h('div', { class: 'bar' }, playBtn, h('button', { type: 'button', title: 'Duraklat' }, '❚❚'), h('button', { type: 'button', title: 'Adım' }, '▶❚')),
    pane('hierarchy', h('div', { class: 'pb' }, '▾ Sahne', h('br'), '   Main Camera', h('br'), '   Global Light 2D', h('br'), h('b', { style: { color: '#fff' } }, '   Oyuncu'), h('br'), '   Zemin')),
    pane('scene', view),
    pane('inspector', h('div', { class: 'pb' },
      h('div', { style: { fontWeight: 600, color: '#fff' } }, 'Oyuncu'),
      h('div', { class: 'dim' }, '▾ Transform'),
      h('div', { class: 'row' }, 'Position', h('span', {}, '0  0  0')),
      h('div', { class: 'dim' }, '▾ Sprite Renderer'),
      h('div', { class: 'dim' }, '▾ Hareket (Script)'),
      h('div', { class: 'row' }, 'Hız', speed))),
    h('div', { class: 'bottom' }, pane('project', h('div', { class: 'pb' }, '▸ Assets / _Proje / Scenes · Scripts · Sprites')), pane('console', consoleBody)));
  root.append(ed);

  const info = h('div', { class: 'msg info', style: { flex: '1 1 22rem' } });
  root.append(h('div', { class: 'w-bar' }, info));
  root.append(h('p', { class: 'try', html: '<b>Dene</b>Pencerelere tıklayıp ne işe yaradıklarını okuyun. Sonra ▶ ile oyunu başlatın, oyun çalışırken Inspector’daki <i>Hız</i> değerini 12 yapın ve ▶’a yeniden basıp oyunu durdurun. Değere ne oldu?' }));

  function select(id) {
    ed.querySelectorAll('.p').forEach((p) => p.classList.toggle('sel', p.dataset.p === id));
    info.innerHTML = `<b>${PANES[id][0]}.</b> ${PANES[id][1]}`;
  }
  function log(t, c = '#c8ccd6') { consoleBody.prepend(h('div', { style: { color: c } }, t)); }

  speed.addEventListener('input', () => { val = +speed.value || 0; if (!playing) base = val; });
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.classList.toggle('on', playing);
    ed.classList.toggle('play', playing);
    if (playing) {
      log('Play Mode başladı. Editör rengi değişti: şu an yapılan değişiklikler geçicidir.');
      const step = () => { x = (x + val * 0.12) % 100; obj.style.left = 10 + x * 0.75 + '%'; raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(raf);
      const changed = val !== base;
      val = base; speed.value = base; obj.style.left = '20%'; x = 0;
      log(changed ? `Play Mode bitti. Hız ${base} değerine geri döndü.` : 'Play Mode bitti.', changed ? '#ffcf66' : '#c8ccd6');
      if (changed) { info.className = 'msg bad'; info.innerHTML = '<b>Değişiklik kayboldu.</b> Oyun çalışırken Inspector’da yapılan değişiklikler, oyun durunca geri alınır. Kalıcı değişiklik oyun durdurulmuşken yapılır.'; return; }
    }
    info.className = 'msg info';
  });
  select('inspector');
}
