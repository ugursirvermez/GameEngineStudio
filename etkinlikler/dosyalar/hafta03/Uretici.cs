using UnityEngine;

// Belirli aralıklarla bir prefab'dan yeni kopya üretir.
public class Uretici : MonoBehaviour
{
    [SerializeField] private GameObject kalip;        // Inspector'dan prefab atanır
    [SerializeField] private float aralik = 2f;       // saniye
    [SerializeField] private int enFazla = 10;
    [SerializeField] private float yayilma = 3f;      // üretim noktası çevresinde yatay rastgele sapma

    private int uretilen;

    void Start()
    {
        InvokeRepeating(nameof(Uret), 0f, aralik);
    }

    void Uret()
    {
        if (uretilen >= enFazla)
        {
            CancelInvoke(nameof(Uret));
            return;
        }
        Vector3 konum = transform.position + new Vector3(Random.Range(-yayilma, yayilma), 0f, 0f);
        Instantiate(kalip, konum, Quaternion.identity);
        uretilen++;
    }
}
