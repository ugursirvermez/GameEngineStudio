using UnityEngine;

// 3B soru seçeneği. TiklaSec script'i fareyle tıklanan seçeneğin Sec() metodunu çağırır.
public class Secenek3D : MonoBehaviour
{
    [SerializeField] private bool dogruMu;
    [SerializeField] private Color dogruRengi = new Color(0.2f, 0.7f, 0.35f);
    [SerializeField] private Color yanlisRengi = new Color(0.85f, 0.25f, 0.2f);

    private Renderer rend;
    private Color ilkRenk;

    void Awake()
    {
        rend = GetComponent<Renderer>();
        ilkRenk = rend.material.GetColor("_BaseColor");   // URP Lit materyalinde temel renk
    }

    public void Sec()
    {
        if (dogruMu)
        {
            Debug.Log($"Doğru: {name}");
            rend.material.SetColor("_BaseColor", dogruRengi);
        }
        else
        {
            Debug.Log($"Yanlış: {name}. Tekrar dene.");
            rend.material.SetColor("_BaseColor", yanlisRengi);
            Invoke(nameof(RengiSifirla), 0.6f);
        }
    }

    private void RengiSifirla()
    {
        rend.material.SetColor("_BaseColor", ilkRenk);
    }
}
