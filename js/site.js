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


/* ---------- etkinlik: işaretlenebilir adımlar ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
document.querySelectorAll('ol.steps[data-key]').forEach((ol) => {
  const key = 'emt_adim_' + ol.dataset.key;
  const items = [...ol.children];
  let done = store.get(key, []);
  const prog = document.querySelector(`.steps-prog[data-for="${ol.dataset.key}"]`);
  const paint = () => {
    items.forEach((li, i) => { li.classList.toggle('done', done.includes(i)); const c = li.querySelector('.st-t input'); if (c) c.checked = done.includes(i); });
    if (prog) { prog.querySelector('i').style.width = (done.length / items.length) * 100 + '%'; prog.querySelector('b').textContent = `${done.length} / ${items.length}`; }
  };
  items.forEach((li, i) => {
    const t = li.querySelector('.st-t');
    if (!t) return;
    const lab = document.createElement('label');
    const cb = document.createElement('input'); cb.type = 'checkbox';
    cb.addEventListener('change', () => { done = cb.checked ? [...new Set([...done, i])] : done.filter((x) => x !== i); store.set(key, done); paint(); });
    lab.append(cb, 'Tamamladım');
    t.append(lab);
  });
  paint();
});


/* ---------- etkinlik: teslim kontrol listesi ---------- */
document.querySelectorAll('ul.checklist[data-key]').forEach((ul) => {
  const key = 'emt_liste_' + ul.dataset.key;
  let done = store.get(key, []);
  const items = [...ul.children];
  const paint = () => items.forEach((li, i) => { li.classList.toggle('done', done.includes(i)); li.querySelector('input').checked = done.includes(i); });
  items.forEach((li, i) => {
    const cb = document.createElement('input'); cb.type = 'checkbox';
    li.prepend(cb);
    li.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      if (e.target !== cb) cb.checked = !cb.checked;
      done = cb.checked ? [...new Set([...done, i])] : done.filter((x) => x !== i);
      store.set(key, done); paint();
    });
  });
  paint();
});

/* ---------- etkinlik: 2B / 3B sekmeleri (seçim sayfalar arasında hatırlanır) ---------- */
const tabGroups = [...document.querySelectorAll('.tabs[data-tabs], .yolsec[data-tabs]')];
if (tabGroups.length) {
  const setTab = (v, save) => {
    tabGroups.forEach((g) => {
      g.querySelectorAll('.tab-bar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === v));
      g.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('on', p.dataset.tab === v));
    });
    // ders notu: seçilmeyen yolun bölümü katlanır, akışta ve içindekilerde soluklaşır
    document.querySelectorAll('section[data-yol]').forEach((s) => {
      s.classList.toggle('yol-diger', s.dataset.yol !== v);
      s.classList.remove('acik');
      document.querySelectorAll(`.flow a[href="#${s.id}"], .rail a[href="#${s.id}"]`).forEach((a) => a.classList.toggle('soluk', s.dataset.yol !== v));
    });
    if (save) store.set('emt_yol', v);
  };
  tabGroups.forEach((g) => g.querySelectorAll('.tab-bar button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab, true))));
  document.querySelectorAll('section[data-yol]').forEach((s) => {
    s.querySelector('[data-goster]')?.addEventListener('click', () => s.classList.add('acik'));
    s.querySelector('[data-yolgec]')?.addEventListener('click', (e) => { setTab(e.currentTarget.dataset.yolgec, true); s.scrollIntoView({ block: 'start' }); });
  });
  setTab(store.get('emt_yol', '2B'), false);
}

/* ---------- etkinlik: çalışma kâğıtları (otomatik kayıt, yazdırma) ---------- */
document.querySelectorAll('.sheet[data-key]').forEach((sh) => {
  const key = 'emt_form_' + sh.dataset.key;
  const fields = [...sh.querySelectorAll('[name]')];
  const saved = sh.querySelector('.saved');
  const data = store.get(key, {});
  fields.forEach((f) => { if (data[f.name] != null) f.value = data[f.name]; });
  let tmr = 0;
  sh.addEventListener('input', () => {
    clearTimeout(tmr);
    tmr = setTimeout(() => {
      const d = store.get(key, {}); fields.forEach((f) => (d[f.name] = f.value)); store.set(key, d);
      if (saved) saved.textContent = 'Bu tarayıcıda kaydedildi';
    }, 300);
  });
  sh.querySelector('[data-act=clear]')?.addEventListener('click', () => {
    if (!confirm('Bu formdaki bütün yazılar silinsin mi?')) return;
    const d = store.get(key, {}); fields.forEach((f) => { f.value = f.tagName === 'SELECT' ? f.options[0].value : ''; delete d[f.name]; }); store.set(key, d);
    if (saved) saved.textContent = 'Temizlendi';
  });
  sh.querySelector('[data-act=print]')?.addEventListener('click', () => {
    const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const title = sh.querySelector('.sheet-head b').textContent;
    const rows = fields.map((f) => {
      const lab = f.closest('label.f')?.querySelector('span')?.textContent || f.name;
      const val = f.tagName === 'SELECT' ? (f.selectedIndex > 0 ? f.options[f.selectedIndex].text : '') : f.value;
      return `<div class="r"><div class="k">${esc(lab)}</div><div class="v">${esc(val) || '&nbsp;'}</div></div>`;
    }).join('');
    const w = window.open('', '_blank');
    if (!w) { alert('Yazdırma penceresi açılamadı. Tarayıcının açılır pencere engelini kaldırın.'); return; }
    w.document.write(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>
      body{font-family:"IBM Plex Sans",Arial,sans-serif;color:#15171c;margin:2cm;font-size:11pt}
      h1{font-size:15pt;margin:0 0 .2cm} .m{color:#666;font-size:9pt;margin-bottom:.6cm}
      .r{border:1px solid #ccc;border-radius:4px;padding:.25cm .35cm;margin:.25cm 0;break-inside:avoid}
      .k{font-weight:600;font-size:9.5pt;color:#444;margin-bottom:.1cm} .v{white-space:pre-wrap;min-height:.9cm}
    </style></head><body><h1>${esc(title)}</h1><div class="m">Eğitimde Modelleme ve Tasarım · ${esc(document.title.split('·')[0].trim())} · ${new Date().toLocaleDateString('tr-TR')}</div>
    <div class="r"><div class="k">Ad Soyad</div><div class="v">&nbsp;</div></div>${rows}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 250);
  });
});

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
