import { Language, LocalizedText } from "@/types";

export function t(text: LocalizedText | undefined, lang: Language): string {
  if (!text) return "";
  return text[lang] || text.en || text.fr || "";
}

export const defaultContent = {
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
  footerText: {
    fr: "© Annabelle Voyage 2026",
    en: "© Annabelle Voyage 2026",
  },
};

export const navLabels = {
  about: { fr: "À propos", en: "About" },
  portfolio: { fr: "Portfolio", en: "Portfolio" },
  partnerships: { fr: "Partenariats", en: "Partnerships" },
  contact: { fr: "Contact", en: "Contact" },
};

export const statsLabels = {
  countries: { fr: "Pays visités", en: "Countries visited" },
  followers: { fr: "Abonnés", en: "Followers" },
  collaborations: { fr: "Collaborations", en: "Collaborations" },
};

export const filterLabels = {
  all: { fr: "Tout", en: "All" },
  hotel: { fr: "Hôtel", en: "Hotel" },
  paysage: { fr: "Paysage", en: "Landscape" },
  lifestyle: { fr: "Lifestyle", en: "Lifestyle" },
  drone: { fr: "Drone", en: "Drone" },
  activity: { fr: "Activité", en: "Activity" },
};
