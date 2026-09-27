using UnityEngine;

// Oyuncu bu alana girince oyun biter. Collider2D'de Is Trigger açık olmalı.
public class BitisAlani2D : MonoBehaviour
{
    [SerializeField] private OyunDongusu oyunDongusu;

    private void OnTriggerEnter2D(Collider2D diger)
    {
        if (diger.CompareTag("Player")) oyunDongusu.OyunuBitir();
    }
}
