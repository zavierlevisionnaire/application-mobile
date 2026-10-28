# ÉCHO DU NORD TV — Kit de démarrage

Cette version est une première application web progressive (PWA) : elle s’adapte au mobile, peut être ajoutée à l’écran d’accueil Android et peut être hébergée sur un service statique gratuit. Le direct TV n’est pas encore inclus.

## 1. Aperçu
Ouvrir `index.html` dans un navigateur permet de voir une maquette avec des exemples. Pour utiliser les fonctions de rédaction et synchroniser les articles entre plusieurs appareils, il faut configurer Supabase et héberger le site en HTTPS.

## 2. Configurer la base de données (offre gratuite disponible)
1. Créer un projet sur https://supabase.com/.
2. Dans le tableau de bord, ouvrir **SQL Editor** puis **New query**.
3. Copier le contenu de `supabase_schema.sql`, exécuter la requête et vérifier la création de la table `articles`.
4. Dans **Project Settings > API** (ou la section API du projet), copier l’URL du projet et la clé publique `anon` / publishable. Ne jamais utiliser la clé `service_role` dans l’application.
5. Ouvrir `app.js` et remplacer :
   - `COLLER_ICI_URL_SUPABASE` par l’URL du projet ;
   - `COLLER_ICI_CLE_PUBLIQUE_ANON` par la clé publique.
6. Dans **Authentication > Providers / Sign In**, laisser l’authentification par e-mail activée et désactiver les inscriptions publiques si cette option est disponible.
7. Dans **Authentication > Users**, créer/inviter le compte de la rédaction. Ne pas publier les identifiants dans un document public.

Les politiques SQL fournies limitent chaque compte à ses propres articles pour les opérations de rédaction. Pour plusieurs rédacteurs qui doivent modifier les articles des autres, il faudra ajouter un système de rôles adapté avant la mise en production.

## 3. Héberger gratuitement
Le site doit être servi par une URL HTTPS pour que l’installation PWA fonctionne correctement.
- Créer un compte GitHub et un dépôt privé/public selon vos préférences, puis y déposer les fichiers du dossier.
- Déployer le dépôt sur un hébergeur statique comme Netlify ou Cloudflare Pages (offres gratuites soumises à leurs conditions et limites).
- Ouvrir l’URL HTTPS publiée et tester l’accueil, la recherche, les rubriques et la connexion rédaction.
- Ne jamais placer une clé secrète ou une clé `service_role` dans les fichiers du site.

## 4. Installer sur Android
1. Ouvrir l’adresse HTTPS du site dans Chrome sur Android.
2. Appuyer sur le menu ⋮ puis **Installer l’application** ou **Ajouter à l’écran d’accueil**.
3. Vérifier que l’icône et le nom ÉCHO DU NORD TV apparaissent sur l’écran d’accueil.

## 5. Publier un article depuis téléphone ou ordinateur
1. Ouvrir le site publié.
2. Déplier **Espace rédaction / administration**.
3. Se connecter avec le compte de rédaction.
4. Renseigner le titre, la rubrique, le résumé, le contenu et éventuellement l’URL d’une image.
5. Cocher **Publier immédiatement** puis enregistrer.
L’article sera stocké en ligne et apparaîtra sur les autres appareils après rechargement.

## 6. Avant une vraie mise en production
- Remplacer les exemples par des articles réels et vérifiés.
- Tester les politiques de sécurité et le flux de connexion.
- Ajouter une fonction d’envoi d’images (par exemple Supabase Storage) plutôt que d’exiger une URL.
- Prévoir une politique de confidentialité, des contacts éditoriaux, une sauvegarde et un processus de correction.
- Configurer les notifications push dans une étape ultérieure.
- Le direct TV nécessitera une source de streaming autorisée (URL HLS ou lecteur du fournisseur) et des tests de bande passante.

## 7. Google Play
La PWA peut être installée depuis le navigateur sans passer par Google Play. Pour une publication sur Google Play, il faudra créer un compte développeur, vérifier les exigences et frais en vigueur, préparer une version Android empaquetée et fournir les éléments demandés par la console. Le kit actuel n’est pas encore un APK/AAB Google Play.

## Fichiers
- `index.html` : interface principale
- `styles.css` : identité graphique responsive
- `app.js` : actualités, recherche, authentification et rédaction
- `manifest.webmanifest` et `service-worker.js` : installation et cache PWA
- `supabase_schema.sql` : table et règles d’accès
- `assets/logo-echo-du-nord.png` : logo fourni

Le kit est un point de départ technique, pas encore un service public hébergé ni une application publiée.
