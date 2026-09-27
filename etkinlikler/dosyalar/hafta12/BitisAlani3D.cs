using UnityEngine;

// Oyuncu bu alana girince oyun biter. Collider'da Is Trigger açık olmalı.
// CharacterController kullanan oyuncular da trigger bildirimlerini tetikler.
public class BitisAlani3D : MonoBehaviour
{
    [SerializeField] private OyunDongusu oyunDongusu;

    private void OnTriggerEnter(Collider diger)
    {
        if (diger.CompareTag("Player")) oyunDongusu.OyunuBitir();
    }
}
