using UnityEngine;

// Rigidbody2D'nin yatay hızını Animator'daki "Speed" parametresine yazar
// ve karakteri gittiği yöne çevirir. Klip seçimini Animator Controller yapar.
[RequireComponent(typeof(Animator), typeof(SpriteRenderer), typeof(Rigidbody2D))]
public class KarakterAnimasyonu2D : MonoBehaviour
{
    private Animator animator;
    private SpriteRenderer spriteRenderer;
    private Rigidbody2D rb;

    void Awake()
    {
        animator = GetComponent<Animator>();
        spriteRenderer = GetComponent<SpriteRenderer>();
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        float yatayHiz = rb.linearVelocity.x;
        animator.SetFloat("Speed", Mathf.Abs(yatayHiz));

        if (Mathf.Abs(yatayHiz) > 0.01f)
            spriteRenderer.flipX = yatayHiz < 0f;          // görseller sağa bakacak biçimde çizildi
    }
}
