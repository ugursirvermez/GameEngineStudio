using UnityEngine;
using UnityEngine.InputSystem;

// 7. hafta etkinliği: GÖREV yorumlarının altını doldurun.
// Çözüm etkinlik sayfasında, "Çözümü göster" düğmesinin altında.
[RequireComponent(typeof(Rigidbody2D))]
public class Hareket2D : MonoBehaviour
{
    [SerializeField] private float hiz = 6f;
    [SerializeField] private float ziplamaHizi = 12f;
    [SerializeField] private Transform ayak;           // karakterin ayak hizasındaki boş çocuk nesne
    [SerializeField] private LayerMask zeminKatmani;

    private Rigidbody2D rb;
    private InputAction hareket;
    private InputAction zipla;
    private float yatay;
    private bool ziplamaIstendi;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();

        // GÖREV 1: "Move" ve "Jump" eylemlerini bulup hareket ve zipla alanlarına atayın.
        //          İpucu: InputSystem.actions.FindAction("Move")
    }

    void Update()
    {
        // GÖREV 2: Move eyleminin x değerini yatay alanına yazın.
        //          İpucu: hareket.ReadValue<Vector2>().x

        // GÖREV 3: Jump bu karede basıldıysa ziplamaIstendi = true yapın.
        //          İpucu: zipla.WasPressedThisFrame()
    }

    void FixedUpdate()
    {
        // GÖREV 4: rb.linearVelocity'yi ayarlayın. Yatay hız yatay * hiz olsun,
        //          dikey hız KORUNSUN (rb.linearVelocity.y).

        // GÖREV 5: Ayak noktasında zemin var mı? Physics2D.OverlapCircle(ayak.position, 0.1f, zeminKatmani)
        //          Zıplama istendiyse ve zemindeyse dikey hızı ziplamaHizi yapın.

        ziplamaIstendi = false;
    }
}
