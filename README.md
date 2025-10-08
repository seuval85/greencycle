# GreenCycle — Starter E‑Commerce (Espaces Verts & Camping)

**Objectif :** un **site vitrine + catalogue** prêt à déployer, avec **admin locale (offline)**, **import/export CSV/JSON**, et **génération d’un flux Google Merchant**. Parfait pour lancer rapidement (MVP) puis connecter des marketplaces (Amazon, ManoMano, Leboncoin) via outils multicanaux.

## 1) Déploiement rapide (au choix)

### A. Hébergement statique (gratuit)
- **Netlify** : drag & drop le dossier ; active le redirect vers `/index.html` si besoin.
- **Vercel** : import Git → deploy.
- **GitHub Pages** : push puis activer Pages.
- **OVH / O2Switch** : uploader via FTP dans `www/`.

> PWA activée : `manifest.json` + `sw.js` (cache offline basique).

### B. Domaine & SEO
- Configurer votre domaine (ex. `greencycle.fr`).
- Remplacer les URL `https://example.com/` dans `sitemap.xml` et `feeds/google-products.xml`.
- Soumettre le **sitemap** dans Google Search Console.

## 2) Gestion catalogue

- **Fichier source** : `products.json` (éditable à la main).
- **Admin locale** : `admin.html`
  - Import/Export **JSON** et **CSV** (boutons).
  - Ajout rapide d’articles (SKU auto si absent).
  - Export **`google-products.xml`** (à placer dans `/feeds/` côté hébergement).
- Les formulaires **Leads** (proposer un matériel) sont stockés en **localStorage**. Export CSV pour traitement.

> Pour la prod : connectez un **Webhook** (Zapier/Make) pour envoyer les leads vers **Google Sheets** ou **votre CRM**.

## 3) Connexion marketplaces (stratégie)
- Utiliser un **agrégateur multicanal** (ex. BaseLinker) pour synchroniser le catalogue vers Amazon/ManoMano.
- Mapper les champs depuis `products.json` (SKU, title, price, condition, brand, image, category).
- Récupérer les **commandes marketplace** → export CSV → intégration comptable.

## 4) Personnalisation
- Styles : `styles.css`
- Landing & catalogue : `index.html`
- Logique front : `app.js` (site) / `admin.js` (admin)
- Logos & images : `/assets/`
- Flux Google Merchant : `/feeds/google-products.xml` (régénéré via Admin)

## 5) Sécurité / Légal
- Ajouter **CGV, Mentions Légales, Politique de retour** (liens pied de page).
- Mettre en place un **bandeau cookies** si vous ajoutez Analytics / pixels.

## 6) Roadmap d’évolution
- Authentification admin + base de données (Supabase / Firebase).
- Paiement (Stripe) + panier.
- Connecteur marketplaces (API) pour fully auto.
- Estimation IA (upload photo → cote) et module dépôt-vente pro.

---

**Fichiers clés** : `index.html`, `admin.html`, `products.json`, `feeds/google-products.xml`  
**Date du build** : 2025-10-08
