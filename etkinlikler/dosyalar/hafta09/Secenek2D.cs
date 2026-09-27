using UnityEngine;

// 2B soru seçeneği. Seçeneğin Collider2D'sinde Is Trigger açık olmalı;
// oyuncu karakterinin Tag'i "Player" olmalı.
public class Secenek2D : MonoBehaviour
{
    [SerializeField] private bool dogruMu;
    [SerializeField] private float geriItmeMesafesi = 0.8f;   // yanlışta oyuncu ne kadar geri itilsin

    private void OnTriggerEnter2D(Collider2D diger)
    {
        if (!diger.CompareTag("Player")) return;

        if (dogruMu)
        {
            Debug.Log($"Doğru: {name}");
            gameObject.SetActive(false);                       // seçenek toplanır
        }
        else
        {
            Debug.Log($"Yanlış: {name}. Tekrar dene.");
            // Oyuncuyu seçenekten uzaklaştır; seçenek yerinde kalır, yeniden denenebilir.
            float yon = Mathf.Sign(diger.transform.position.x - transform.position.x);
            diger.transform.position += new Vector3(yon * geriItmeMesafesi, 0f, 0f);
            Rigidbody2D rb = diger.attachedRigidbody;
            if (rb != null) rb.linearVelocity = new Vector2(rb.linearVelocity.x, 5f);
        }
    }
}
