# Annabelle Voyages

Site vitrine portfolio + back-office admin pour Annabelle Cathala, créatrice de contenu voyage.

**Stack :** Next.js 14 · TypeScript · Tailwind CSS · Firebase (Firestore + Auth + Storage) · Framer Motion

---

## Setup rapide

### 1. Créer un projet Firebase

1. Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. Créez un nouveau projet (ex: `annabelle-voyages`)
3. Activez les services :
   - **Firestore Database** → créer en mode production
   - **Authentication** → activer Email/Password
   - **Storage** → créer avec les règles par défaut

### 2. Créer le compte admin

Dans Firebase Console → Authentication → Users → Add User :
- Email : `annabelle.cathala@gmail.com` (ou votre email)
- Mot de passe : à définir

### 3. Récupérer les clés Firebase

Dans Firebase Console → Paramètres du projet (⚙️) → Vos applications → Web :
- Créez une app web si pas déjà fait
- Copiez la configuration Firebase (objet `firebaseConfig`)

### 4. Configurer l'environnement

```bash
cp .env.local.example .env.local
```

Remplissez `.env.local` avec vos clés Firebase :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
```

### 5. Installer et lancer

```bash
npm install
npm run dev
```

Le site est accessible sur [http://localhost:3000](http://localhost:3000)
L'admin est accessible sur [http://localhost:3000/admin](http://localhost:3000/admin)

### 6. (Optionnel) Seeder les données initiales

```bash
npm run seed
```

Cela initialise dans Firestore :
- Les textes par défaut du site
- Les liens réseaux sociaux
- Le portfolio avec la vidéo Pines and Palms Resort
- Le partenariat Pines and Palms Resort

### 7. Déployer les règles de sécurité Firebase

Installez Firebase CLI si nécessaire :
```bash
npm install -g firebase-tools
firebase login
firebase init  # Sélectionnez Firestore + Storage, projet existant
firebase deploy --only firestore:rules,storage
```

---

## Déploiement sur Vercel

### Option A — Via GitHub (recommandé)

1. Push le code sur GitHub
2. Allez sur [vercel.com](https://vercel.com) → New Project → importer le repo
3. Dans les variables d'environnement Vercel, ajoutez toutes les variables de `.env.local`
4. Deploy !

### Option B — Via CLI

```bash
npm install -g vercel
vercel --prod
```

Puis ajoutez les variables d'env dans le dashboard Vercel.

---

## Structure du projet

```
annabelle-voyages/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Site vitrine (one-page)
│   │   ├── admin/             # Back-office admin (protégé Firebase Auth)
│   │   └── login/             # Page de connexion
│   ├── components/
│   │   ├── site/              # Hero, About, Portfolio, etc.
│   │   └── admin/             # Sidebar, MediaUploader, etc.
│   ├── lib/
│   │   ├── firebase.ts        # Config Firebase
│   │   ├── firestore.ts       # CRUD Firestore
│   │   ├── storage.ts         # Upload + compression images
│   │   ├── auth.ts            # Firebase Auth
│   │   └── i18n.ts            # Traductions FR/EN
│   ├── hooks/                 # useAuth, useFirestore, useLanguage
│   └── types/                 # Types TypeScript
├── scripts/seed.ts            # Script d'initialisation Firestore
├── firestore.rules            # Règles de sécurité Firestore
├── storage.rules              # Règles de sécurité Storage
└── .env.local.example         # Template variables d'environnement
```

---

## Fonctionnalités

### Site vitrine
- One-page scrollable avec navigation smooth
- Toggle FR / EN (persisté en localStorage)
- Real-time : les modifs admin sont instantanées sans reload
- Animations Framer Motion au scroll
- Responsive mobile-first

### Sections
- **Hero** : plein écran, image/vidéo de fond, tagline, CTA, icônes réseaux
- **À propos** : photo, bio, statistiques (pays / abonnés / collabs)
- **Portfolio** : grille filtrée par catégorie, lightbox avec vidéos YouTube
- **Partenariats** : cards avec logos, descriptions, liens externes
- **Contact** : formulaire → Firestore, email affiché

### Admin (/admin)
- Protégé Firebase Auth
- Mobile-first (sidebar slide-out sur mobile)
- Dashboard avec stats et accès rapide
- Gestion portfolio : upload images (compression auto), vidéos YouTube, drag & drop ordre, visible/masqué
- Gestion partenariats : upload logo, descriptions bilingues
- Édition textes bilingues (FR/EN) pour toutes les sections
- Gestion hero : upload image de fond
- Gestion réseaux sociaux
- Messages du formulaire contact : lecture, réponse (mailto), suppression

---

## Technologies

| Package | Usage |
|---------|-------|
| `next` | Framework React, App Router |
| `firebase` | Firestore, Auth, Storage |
| `framer-motion` | Animations scroll |
| `@dnd-kit/core` | Drag & drop portfolio |
| `browser-image-compression` | Compression images côté client |
| `react-hot-toast` | Notifications |
| `lucide-react` | Icônes |
| `tailwindcss` | Styles |
