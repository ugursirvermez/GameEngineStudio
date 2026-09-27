using UnityEngine;
using UnityEngine.InputSystem;

// 7. hafta etkinliği: GÖREV yorumlarının altını doldurun.
// Çözüm etkinlik sayfasında, "Çözümü göster" düğmesinin altında.
[RequireComponent(typeof(CharacterController))]
public class Hareket3D : MonoBehaviour
{
    [SerializeField] private float hiz = 5f;
    [SerializeField] private float ziplamaHizi = 6f;
    [SerializeField] private float yercekimi = -20f;

    private CharacterController cc;
    private InputAction hareket;
    private InputAction zipla;
    private float dikeyHiz;

    void Awake()
    {
        cc = GetComponent<CharacterController>();

        // GÖREV 1: "Move" ve "Jump" eylemlerini bulup hareket ve zipla alanlarına atayın.
    }

    void Update()
    {
        Vector2 girdi = Vector2.zero;
        // GÖREV 2: girdi değişkenine Move eyleminin değerini okuyun.

        // GÖREV 3: Karakterin baktığı yöne göre yatay yön vektörünü hesaplayın:
        //          transform.right * girdi.x + transform.forward * girdi.y
        //          Uzunluğu 1'i aşıyorsa normalleştirin (çapraz hız sorunu).
        Vector3 yon = Vector3.zero;

        // GÖREV 4: Zemindeyse (cc.isGrounded) dikeyHiz = -1f yapın;
        //          Jump bu karede basıldıysa dikeyHiz = ziplamaHizi yapın.

        dikeyHiz += yercekimi * Time.deltaTime;

        // GÖREV 5: Yatay ve dikey hızı birleştirip karede TEK bir cc.Move çağrısıyla uygulayın.
        //          İpucu: cc.Move((yon * hiz + Vector3.up * dikeyHiz) * Time.deltaTime);
    }
}
