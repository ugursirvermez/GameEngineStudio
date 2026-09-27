using UnityEngine;

// 12. hafta sürümü: 9. haftadaki Secenek3D.cs'nin yerine kullanın.
public class Secenek3D : MonoBehaviour
{
    [SerializeField] private bool dogruMu;
    [SerializeField] private Color dogruRengi = new Color(0.2f, 0.7f, 0.35f);
    [SerializeField] private Color yanlisRengi = new Color(0.85f, 0.25f, 0.2f);

    private Renderer rend;
    private Color ilkRenk;
    private bool bitti;

    void Awake()
    {
        rend = GetComponent<Renderer>();
        ilkRenk = rend.material.GetColor("_BaseColor");
    }

    public void Sec()
    {
        if (bitti) return;
        if (SkorYonetici.Ornek != null) SkorYonetici.Ornek.Kaydet(dogruMu);

        if (dogruMu)
        {
            bitti = true;
            rend.material.SetColor("_BaseColor", dogruRengi);
        }
        else
        {
            rend.material.SetColor("_BaseColor", yanlisRengi);
            Invoke(nameof(RengiSifirla), 0.6f);
        }
    }

    private void RengiSifirla()
    {
        rend.material.SetColor("_BaseColor", ilkRenk);
    }
}
