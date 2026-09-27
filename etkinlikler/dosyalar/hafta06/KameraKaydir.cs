using UnityEngine;
using UnityEngine.InputSystem;

// Kamerayı Move eylemiyle (ok tuşları / A-D) yatayda kaydırır. Paralaksı denemek için.
public class KameraKaydir : MonoBehaviour
{
    [SerializeField] private float hiz = 5f;

    private InputAction hareket;

    void Start()
    {
        hareket = InputSystem.actions.FindAction("Move");
    }

    void Update()
    {
        float x = hareket.ReadValue<Vector2>().x;
        transform.Translate(x * hiz * Time.deltaTime, 0f, 0f, Space.World);
    }
}
