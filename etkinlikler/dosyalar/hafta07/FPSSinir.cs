using UnityEngine;

// Kare hızını sınırlar. Hareket kodunun Time.deltaTime'a doğru bağlanıp
// bağlanmadığını sınamak için: 30 ve 120 değerlerinde karakter aynı hızda gitmeli.
public class FPSSinir : MonoBehaviour
{
    [SerializeField] private int hedefKareHizi = 30;

    void Start()
    {
        QualitySettings.vSyncCount = 0;              // dikey eşitleme açıkken sınır uygulanmaz
        Application.targetFrameRate = hedefKareHizi;
    }
}
