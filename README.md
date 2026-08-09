# Pensée à toi 💕

Prototype V1 gratuit, installable comme PWA.

## Ce qui fonctionne déjà
- Écran principal inspiré de la maquette
- Bouton « Je pense à toi » + animation
- Pensées rapides
- Pensée personnalisée
- Historique local des pensées
- Compteur de retrouvailles (préparé)
- Installation PWA sur Android/Chrome
- Aucun serveur et aucun paiement pour cette V1

## Tester
Le plus simple est d'héberger gratuitement le dossier sur GitHub Pages, Cloudflare Pages ou Vercel.

## Prochaine étape : vraie connexion entre deux téléphones
Pour cela, ajouter un backend gratuit (par exemple Supabase) avec :
- authentification
- table couples
- table thoughts
- abonnement temps réel
- règles de sécurité RLS

Ne mets jamais une clé secrète/service-role dans le navigateur. Seule la clé publique/anon est destinée au client.

## Architecture prévue
users -> couples -> thoughts
                 -> reunion_date
                 -> memories

Puis notifications push via un service compatible PWA/Android.
