using UnityEngine;

// Katmanı kameranın hareketinin belirli bir oranında izletir.
// Oran 1: katman kamerayla birlikte gider, ekranda sabit durur (çok uzak).
// Oran 0: katman dünyada sabittir, ekranda kamera hızıyla kayar (çok yakın).
public class Paralaks : MonoBehaviour
{
    [SerializeField] private Transform kamera;
    [SerializeField, Range(0f, 1f)] private float oran = 0.5f;

    private Vector3 baslangic;
    private Vector3 kameraBaslangic;

    void Start()
    {
        if (kamera == null) kamera = Camera.main.transform;
        baslangic = transform.position;
        kameraBaslangic = kamera.position;
    }

    void LateUpdate()
    {
        Vector3 fark = kamera.position - kameraBaslangic;
        transform.position = new Vector3(baslangic.x + fark.x * oran, baslangic.y + fark.y * oran, baslangic.z);
    }
}
