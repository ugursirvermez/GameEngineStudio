using UnityEngine;

// Nesneyi belirtilen eksen çevresinde döndürür.
// 2B'de eksen (0, 0, 1), 3B'de genellikle (0, 1, 0) seçilir.
public class Donme : MonoBehaviour
{
    [SerializeField] private float derecePerSaniye = 90f;
    [SerializeField] private Vector3 eksen = new Vector3(0f, 0f, 1f);

    void Update()
    {
        transform.Rotate(eksen * derecePerSaniye * Time.deltaTime);
    }
}
