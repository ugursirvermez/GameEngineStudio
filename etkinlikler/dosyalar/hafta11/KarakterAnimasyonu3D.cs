using UnityEngine;

// CharacterController'ın yatay hızını Animator'daki "Speed" parametresine yazar.
// Blend Tree bu değere göre bekleme, yürüme ve koşma arasında geçiş yapar.
[RequireComponent(typeof(CharacterController))]
public class KarakterAnimasyonu3D : MonoBehaviour
{
    [SerializeField] private Animator animator;   // model çocuk nesnedeyse buraya sürükleyin

    private CharacterController cc;

    void Awake()
    {
        cc = GetComponent<CharacterController>();
        if (animator == null) animator = GetComponentInChildren<Animator>();
    }

    void Update()
    {
        Vector3 v = cc.velocity;
        float yatayHiz = new Vector3(v.x, 0f, v.z).magnitude;
        animator.SetFloat("Speed", yatayHiz, 0.1f, Time.deltaTime);   // 0,1 s yumuşatma
    }
}
