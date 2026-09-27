// Eğitimde Modelleme ve Tasarım — ortak sayfa betiği
// Görünüm (eğitmen / sunum) ve içindekiler takibi
(function () {
  var root = document.documentElement;
  var KEY = 'emt_gorunum';
  var btn = document.getElementById('modeBtn');

  function uygula(mod) {
    root.classList.toggle('sunum', mod === 'sunum');
    if (btn) btn.textContent = mod === 'sunum' ? 'Eğitmen görünümü' : 'Sunum görünümü';
  }

  if (btn) {
    var istek = new URLSearchParams(location.search).get('gorunum');
    var kayitli = null;
    try { kayitli = localStorage.getItem(KEY); } catch (e) {}
    uygula(istek || kayitli || 'egitmen');
    btn.addEventListener('click', function () {
      var mod = root.classList.contains('sunum') ? 'egitmen' : 'sunum';
      uygula(mod);
      try { localStorage.setItem(KEY, mod); } catch (e) {}
    });
  }

  // İçindekiler: ekranda olan bölümü işaretle
  var baglar = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (!baglar.length || !('IntersectionObserver' in window)) return;
  var bolumler = baglar
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  var gozcu = new IntersectionObserver(function (girdiler) {
    girdiler.forEach(function (g) {
      if (!g.isIntersecting) return;
      baglar.forEach(function (a) {
        a.classList.toggle('on', a.getAttribute('href') === '#' + g.target.id);
      });
    });
  }, { rootMargin: '-10% 0px -75% 0px' });
  bolumler.forEach(function (b) { gozcu.observe(b); });
})();
