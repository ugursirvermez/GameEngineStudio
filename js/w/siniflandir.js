// Konuya göre boyut seçimi: 2B yeterli mi, 3B gerekli mi?
import { h } from './ui.js';

const ITEMS = [
  { q: 'Kesirleri sayı doğrusunda gösterme', a: '2b', e: 'Öğrenilecek ilişki tek boyutlu bir doğru üzerinde. 3B hiçbir şey eklemez.' },
  { q: 'Küpün açınımı ve katlanması', a: '3b', e: 'Yüzlerin katlanınca nereye geleceği uzamsal bir ilişki; tek bir 2B çizim bunu gösteremez.' },
  { q: 'Besin zinciri', a: '2b', e: 'Öğeler arasındaki “kim kimi yer” ilişkisi bir şemayla tam olarak gösterilir.' },
  { q: 'Gece–gündüz ve mevsimlerin oluşumu', a: '3b', e: 'Eksen eğikliği ve yörüngedeki konum, bakış açısı değiştirilerek anlaşılır.' },
  { q: 'Cümlenin öğeleri', a: '2b', e: 'Dilsel yapı; sürükle-bırak ve sıralama mekanikleri yeterli.' },
  { q: 'Kalbin odacıkları ve kan akışı', a: 'ikisi', e: 'Akışın yönü öğretilecekse 2B şema yeterli; odacıkların birbirine göre konumu hedefse 3B gerekir. Karar kazanıma bağlı.' },
  { q: 'Harita üzerinde yön bulma', a: '2b', e: 'Harita zaten 2B bir modeldir; öğrenilecek şey onu okumak.' },
  { q: 'Moleküllerin geometrisi', a: '3b', e: 'Bağ açıları ve atomların uzaydaki dizilişi 2B izdüşümde kaybolur.' },
  { q: 'Basit elektrik devresi', a: '2b', e: 'Devre şeması, bağlantı ilişkisini gösteren standart bir 2B modeldir.' },
];

export default function mount(root) {
  let ok = 0, done = 0;
  const score = h('span', { style: { fontSize: '.84rem', color: '#3f434d' } });
  const upd = () => { score.innerHTML = `<b>${done}</b> / ${ITEMS.length} karar · uygun: <b>${ok}</b>`; };
  const grid = h('div', { class: 'cards' });
  ITEMS.forEach((it) => {
    const ex = h('div', { class: 'ex' });
    const b2 = h('button', { type: 'button' }, '2B yeterli');
    const b3 = h('button', { type: 'button' }, '3B gerekli');
    const card = h('div', { class: 'qcard' }, h('div', { class: 'q' }, it.q), h('div', { class: 'opts' }, b2, b3), ex);
    const choose = (c, btn) => {
      if (card.classList.contains('done')) return;
      card.classList.add('done'); done++;
      if (it.a === 'ikisi') { btn.classList.add('pick-mid'); ex.innerHTML = `<b>Tartışmalı.</b> ${it.e}`; ok++; }
      else if (c === it.a) { btn.classList.add('pick-ok'); ex.innerHTML = `<b>Uygun.</b> ${it.e}`; ok++; }
      else { btn.classList.add('pick-no'); (it.a === '2b' ? b2 : b3).classList.add('pick-ok'); ex.innerHTML = `<b>Yeniden düşünün.</b> ${it.e}`; }
      upd();
    };
    b2.addEventListener('click', () => choose('2b', b2));
    b3.addEventListener('click', () => choose('3b', b3));
    grid.append(card);
  });
  const reset = h('button', { type: 'button', class: 'btn', onclick: () => { root.innerHTML = ''; mount(root); } }, 'Sıfırla');
  root.append(grid, h('div', { class: 'w-bar' }, score, reset));
  upd();
}
