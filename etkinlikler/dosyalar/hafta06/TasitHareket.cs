using UnityEngine;
using UnityEngine.InputSystem;

// Aracı ileri/geri sürer ve sağa/sola döndürür.
// "Uzay" alanını Inspector'dan Self ya da World yaparak farkı deneyin.
public class TasitHareket : MonoBehaviour
{
    [SerializeField] private float hiz = 6f;
    [SerializeField] private float donusHizi = 90f;
    [SerializeField] private Space uzay = Space.Self;

    private InputAction hareket;

    void Start()
    {
        hareket = InputSystem.actions.FindAction("Move");
    }

    void Update()
    {
        Vector2 girdi = hareket.ReadValue<Vector2>();
        transform.Rotate(0f, girdi.x * donusHizi * Time.deltaTime, 0f, Space.Self);
        transform.Translate(Vector3.forward * girdi.y * hiz * Time.deltaTime, uzay);
    }
}
