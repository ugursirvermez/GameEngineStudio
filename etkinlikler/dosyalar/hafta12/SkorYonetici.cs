using UnityEngine;
using TMPro;

// Oturum boyunca doğru/yanlış sayısını ve geçen süreyi tutar, göstergeleri günceller.
// Sahnede bir tane bulunur; öteki script'ler SkorYonetici.Ornek ile erişir.
public class SkorYonetici : MonoBehaviour
{
    public static SkorYonetici Ornek { get; private set; }

    [SerializeField] private TMP_Text skorMetni;   // sol üst
    [SerializeField] private TMP_Text sureMetni;   // sağ üst

    private int dogru;
    private int yanlis;
    private float sure;
    private bool sayiyor = true;

    void Awake()
    {
        if (Ornek != null && Ornek != this) { Destroy(gameObject); return; }
        Ornek = this;
    }

    void Start()
    {
        Yenile();
    }

    void Update()
    {
        if (!sayiyor) return;
        sure += Time.deltaTime;
        sureMetni.text = SureYazisi();
    }

    public void Kaydet(bool dogruMu)
    {
        if (dogruMu) dogru++; else yanlis++;
        Yenile();
    }

    public void Durdur()
    {
        sayiyor = false;
    }

    public string OturumOzeti()
    {
        int toplam = dogru + yanlis;
        if (toplam == 0) return "Henüz deneme yapılmadı.";
        int oran = Mathf.RoundToInt(100f * dogru / toplam);
        return $"{toplam} denemede {dogru} doğru (%{oran})\nSüre: {SureYazisi()}";
    }

    private void Yenile()
    {
        skorMetni.text = $"Doğru: {dogru}   Yanlış: {yanlis}";
    }

    private string SureYazisi()
    {
        return $"{(int)(sure / 60):00}:{(int)(sure % 60):00}";
    }
}
