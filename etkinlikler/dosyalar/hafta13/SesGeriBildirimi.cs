using UnityEngine;

// Doğru ve yanlış yanıtlar için ses çalar. Sahnede bir tane bulunur;
// Secenek script'leri SesGeriBildirimi.Ornek.Cal(...) ile çağırır.
[RequireComponent(typeof(AudioSource))]
public class SesGeriBildirimi : MonoBehaviour
{
    public static SesGeriBildirimi Ornek { get; private set; }

    [SerializeField] private AudioClip dogruSesi;
    [SerializeField] private AudioClip yanlisSesi;
    [SerializeField, Range(0f, 0.2f)] private float perdeSapmasi = 0.05f;   // ±%5

    private AudioSource kaynak;

    void Awake()
    {
        Ornek = this;
        kaynak = GetComponent<AudioSource>();
    }

    public void Cal(bool dogruMu)
    {
        // Perdeyi hafifçe rastgeleleştir: art arda çalınınca mekanik duyulmaz
        kaynak.pitch = 1f + Random.Range(-perdeSapmasi, perdeSapmasi);
        kaynak.PlayOneShot(dogruMu ? dogruSesi : yanlisSesi);
    }
}
