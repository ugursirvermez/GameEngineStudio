using UnityEngine;

// 12. hafta sürümü: 9. haftadaki Secenek2D.cs'nin yerine kullanın.
// Sonuçları SkorYonetici'ye bildirir.
public class Secenek2D : MonoBehaviour
{
    [SerializeField] private bool dogruMu;
    [SerializeField] private float geriItmeMesafesi = 0.8f;

    private void OnTriggerEnter2D(Collider2D diger)
    {
        if (!diger.CompareTag("Player")) return;

        if (SkorYonetici.Ornek != null) SkorYonetici.Ornek.Kaydet(dogruMu);

        if (dogruMu)
        {
            gameObject.SetActive(false);
        }
        else
        {
            float yon = Mathf.Sign(diger.transform.position.x - transform.position.x);
            diger.transform.position += new Vector3(yon * geriItmeMesafesi, 0f, 0f);
            Rigidbody2D rb = diger.attachedRigidbody;
            if (rb != null) rb.linearVelocity = new Vector2(rb.linearVelocity.x, 5f);
        }
    }
}
