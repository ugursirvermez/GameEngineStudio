# Eğitimde Modelleme ve Tasarım

Eğitim Fakültesi · 2025–2026 Güz · Unity 6 ile 2B ve 3B paralel yürütülen 14 haftalık ders.

**Site:** <https://ugursirvermez.github.io/GameEngineStudio/>

| Sayfa | İçerik |
|---|---|
| [Giriş](https://ugursirvermez.github.io/GameEngineStudio/) | Etkileşimli 1. hafta dersi: 3B sahne (2B ⟷ 3B), şehir ⟷ metro şeması, sarkaç (benzetimden oyuna), bileşen kurucu, oyun döngüsü, iki kesir oyunu (içsel/dışsal bütünleşme), konu sınıflandırma, dönem planı, not dağılımı, gömülü atölye. |
| [Haftalık materyaller](https://ugursirvermez.github.io/GameEngineStudio/materyaller/) | 2–14. haftaların ders notları; her birinde o haftanın konusunu deneyen etkileşimler (Unity editörü, PPU/filtre, Tilemap, yerel/dünya koordinatları, collider/trigger, ışık ve gölge maliyeti, animasyon, arayüz çapaları, ses…), Unity 6 uyumlu kodlar, tekrar soruları. |
| [Etkinlikler](https://ugursirvermez.github.io/GameEngineStudio/etkinlikler/) | 14 haftalık sınıf etkinliği: adım adım yönergeler (2B/3B sekmeli, işaretlenebilir), indirilebilir telifsiz başlangıç dosyaları (sprite, karo seti, doku ve normal haritası, ses, C# script), tamamlanma ölçütleri, sık sorunlar, yazdırılabilir çalışma kâğıtları. Script'ler Unity 6 ile derlenerek denendi. |
| [Atölye](https://ugursirvermez.github.io/GameEngineStudio/atolye/) | Tarayıcıda çalışan, Three.js ile hazırlanmış altı aşamalı etkileşimli atölye: doku, materyal, GameObject, ışık ve yüzey, dünya, avatar. |

## Değerlendirme

| Bileşen | Oran | Zaman |
|---|---|---|
| Vize (uygulamalı sınav) | %40 | 8. hafta, bilgisayar başında, 90 dk |
| Final projesi | %60 | 14. hafta, sunum ve teslim |

Ölçüt tabloları giriş sayfasının 7. bölümünde.

## Atölyeden görüntüler

![GameObject aşaması](GIF-1.gif)
![Dünya aşaması](GIF-3.gif)
![Avatar aşaması](GIF-2.gif)

## Dosya yapısı

```
index.html          Giriş dersi (1. hafta)
materyaller/        2–14. hafta ders notları ve liste sayfası
etkinlikler/        14 etkinlik sayfası; dosyalar/ altında haftalık başlangıç dosyaları ve zip'ler
atolye/             Etkileşimli Three.js atölyesi
css/site.css        Giriş ve materyal sayfalarının stili
js/site.js          İçindekiler, ilerleme çubuğu, etkileşim yükleyici
js/w/               Etkileşimler (her biri ayrı modül; ui.js ortak yardımcılar)
docs/               Ders planının Excel sürümü
```

Yerel önizleme için proje klasöründe:

```bash
python3 -m http.server 8000
```

## Lisans

MIT. Ayrıntı için [LICENSE](LICENSE).
