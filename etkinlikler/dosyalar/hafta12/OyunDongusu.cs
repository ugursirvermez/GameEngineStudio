using UnityEngine;
using UnityEngine.SceneManagement;
using TMPro;

// Oyunun bitişini ve yeniden başlatılmasını yönetir.
public class OyunDongusu : MonoBehaviour
{
    [SerializeField] private GameObject bitisPaneli;
    [SerializeField] private TMP_Text ozetMetni;

    void Start()
    {
        bitisPaneli.SetActive(false);
    }

    public void OyunuBitir()
    {
        if (SkorYonetici.Ornek != null)
        {
            SkorYonetici.Ornek.Durdur();
            ozetMetni.text = SkorYonetici.Ornek.OturumOzeti();
        }
        bitisPaneli.SetActive(true);
        Time.timeScale = 0f;                  // oyunu dondur
    }

    // "Yeniden dene" düğmesinin On Click () listesine bağlanır
    public void YenidenDene()
    {
        Time.timeScale = 1f;                  // sahne yüklemeden önce geri al
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}
