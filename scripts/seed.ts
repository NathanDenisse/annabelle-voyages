/**
 * Script de seed pour initialiser les données Firebase
 * Usage: npm run seed
 *
 * IMPORTANT: Configurez d'abord votre .env.local avec les clés Firebase
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { initializeApp } = require("firebase/app");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getFirestore, doc, setDoc, addDoc, collection } = require("firebase/firestore");

// Load env manually for seed script
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found. Copy .env.local.example and fill in your Firebase keys.");
    process.exit(1);
  }
  const env = fs.readFileSync(envPath, "utf-8");
  env.split("\n").forEach((line: string) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0 && !key.startsWith("#")) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  });
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("🌱 Seeding Firestore...\n");

  // 1. Site Content
  console.log("📝 Setting site content...");
  await setDoc(doc(db, "content", "main"), {
    heroTagline: {
      fr: "Française à Dublin · Créatrice de contenu voyage",
      en: "French in Dublin · Travel Content Creator",
    },
    heroCta: {
      fr: "Découvrir mon travail",
      en: "Discover my work",
    },
    aboutTitle: {
      fr: "À Propos",
      en: "About",
    },
    aboutBio: {
      fr: "Parisienne d'origine, Dublinoise d'adoption. Je parcours le monde avec mon fiancé pour capturer les plus beaux paysages et partager nos découvertes. Passionnée de vidéo et de photographie, je crée du contenu authentique qui inspire le voyage.",
      en: "Originally from Paris, now based in Dublin. I travel the world with my fiancé to capture the most beautiful landscapes and share our discoveries. Passionate about video and photography, I create authentic content that inspires travel.",
    },
    portfolioTitle: {
      fr: "Portfolio",
      en: "Portfolio",
    },
    partnershipsTitle: {
      fr: "Partenariats",
      en: "Partnerships",
    },
    contactTitle: {
      fr: "Travaillons ensemble",
      en: "Let's work together",
    },
    contactSubtitle: {
      fr: "Vous êtes un hôtel ou une marque et souhaitez collaborer ? Contactez-moi !",
      en: "Are you a hotel or brand looking to collaborate? Get in touch!",
    },
    contactEmail: "annabelle.cathala@gmail.com",
    footerText: {
      fr: "© Annabelle Voyages 2026",
      en: "© Annabelle Voyages 2026",
    },
    stats: {
      countries: 15,
      followers: 500,
      collaborations: 1,
    },
    statsLabels: {
      countries: { fr: "Pays visités", en: "Countries visited" },
      followers: { fr: "Abonnés", en: "Followers" },
      collaborations: { fr: "Collaborations", en: "Collaborations" },
    },
    updatedAt: new Date(),
  });
  console.log("✅ Site content set\n");

  // 2. Social Links
  console.log("📱 Setting social links...");
  await setDoc(doc(db, "socials", "main"), {
    instagram: "https://www.instagram.com/annabellecathala",
    youtube: "https://www.youtube.com/@annabellecathala",
    tiktok: "",
    updatedAt: new Date(),
  });
  console.log("✅ Social links set\n");

  // 3. Portfolio item
  console.log("🎬 Adding portfolio item...");
  await addDoc(collection(db, "portfolio"), {
    title: {
      fr: "Pines and Palms Resort",
      en: "Pines and Palms Resort",
    },
    location: "Florida Keys, USA",
    category: "hotel",
    description: {
      fr: "Un séjour de rêve dans ce resort idyllique des Florida Keys, en partenariat avec Pines and Palms Resort.",
      en: "A dream stay at this idyllic resort in the Florida Keys, in partnership with Pines and Palms Resort.",
    },
    type: "video",
    videoUrl: "https://www.youtube.com/watch?v=jkOtTMXUR54",
    order: 0,
    visible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("✅ Portfolio item added\n");

  // 4. Partnership
  console.log("🤝 Adding partnership...");
  await addDoc(collection(db, "partnerships"), {
    name: "Pines and Palms Resort",
    description: {
      fr: "Premier partenariat — séjour en collaboration dans les magnifiques Florida Keys.",
      en: "First partnership — collaborative stay in the beautiful Florida Keys.",
    },
    externalLink: "https://www.pinesandpalms.com",
    order: 0,
    visible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("✅ Partnership added\n");

  console.log("🎉 Seed complete!\n");
  console.log("Next steps:");
  console.log("  1. npm run dev");
  console.log("  2. Open http://localhost:3000");
  console.log("  3. Open http://localhost:3000/login (connect with Firebase Auth account)");
  process.exit(0);
}

seed().catch((err: Error) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
