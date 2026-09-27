using UnityEngine;
using UnityEngine.InputSystem;

// Kameradan, farenin tıklandığı noktaya ışın gönderir.
// Işın bir Secenek3D'ye çarparsa onun Sec() metodunu çağırır.
public class TiklaSec : MonoBehaviour
{
    [SerializeField] private LayerMask secilebilir = ~0;   // varsayılan: bütün katmanlar
    [SerializeField] private float menzil = 100f;

    void Update()
    {
        if (Mouse.current == null || !Mouse.current.leftButton.wasPressedThisFrame) return;

        Ray isin = Camera.main.ScreenPointToRay(Mouse.current.position.ReadValue());
        if (Physics.Raycast(isin, out RaycastHit carpma, menzil, secilebilir))
        {
            Secenek3D secenek = carpma.collider.GetComponent<Secenek3D>();
            if (secenek != null) secenek.Sec();
        }
    }
}
