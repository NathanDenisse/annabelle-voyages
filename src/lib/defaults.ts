import { Partnership, Testimonial, NextTrip } from "@/types";

export const defaultPartnerships: Partnership[] = [
  {
    id: "default-1",
    name: "Pines and Palms Resort",
    description: {
      fr: "Premier partenariat — séjour en collaboration dans les magnifiques Florida Keys.",
      en: "First partnership — collaborative stay in the beautiful Florida Keys.",
    },
    logoUrl: "",
    gallery: [
      {
        type: "video",
        url: "https://www.youtube.com/watch?v=jkOtTMXUR54",
        platform: "youtube",
        format: "horizontal",
      },
    ],
    externalLink: "https://www.pinesandpalms.com",
    order: 0,
    visible: true,
  },
];

export const seedTestimonials: Omit<Testimonial, "id">[] = [
  {
    text: {
      fr: "Une créatrice passionnée qui sublime chaque lieu qu'elle visite. Ses contenus ont dépassé toutes nos attentes.",
      en: "A passionate creator who elevates every place she visits. Her content exceeded all our expectations.",
    },
    role: { fr: "Partenaire hôtelier", en: "Hotel partner" },
    rating: 5,
    order: 0,
    visible: true,
  },
  {
    text: {
      fr: "Annabelle a su capturer l'essence de notre établissement avec authenticité et élégance.",
      en: "Annabelle captured the essence of our establishment with authenticity and elegance.",
    },
    role: { fr: "Resort & Spa", en: "Resort & Spa" },
    rating: 5,
    order: 1,
    visible: true,
  },
  {
    text: {
      fr: "Une collaboration fluide et un résultat magnifique. Les retours de notre communauté ont été incroyables.",
      en: "A seamless collaboration with a magnificent result. The feedback from our community has been incredible.",
    },
    role: { fr: "Marque lifestyle", en: "Lifestyle brand" },
    rating: 5,
    order: 2,
    visible: true,
  },
  {
    text: {
      fr: "Son regard unique et sa sensibilité artistique font toute la différence. Un vrai plaisir de travailler ensemble.",
      en: "Her unique perspective and artistic sensitivity make all the difference. A true pleasure to work together.",
    },
    role: { fr: "Office de tourisme", en: "Tourism board" },
    rating: 5,
    order: 3,
    visible: true,
  },
  {
    text: {
      fr: "Des vidéos immersives qui donnent instantanément envie de réserver. Exactement ce qu'on recherchait.",
      en: "Immersive videos that instantly make you want to book. Exactly what we were looking for.",
    },
    role: { fr: "Agence de voyage", en: "Travel agency" },
    rating: 5,
    order: 4,
    visible: true,
  },
];

export const defaultTestimonials: Testimonial[] = seedTestimonials.map((t, i) => ({
  ...t,
  id: `default-${i}`,
}));

export const defaultNextTrip: NextTrip = {
  id: "main",
  destination: { fr: "Polynésie Française", en: "French Polynesia" },
  period: { fr: "Été 2026", en: "Summer 2026" },
  places: ["Moorea", "Rangiroa", "Bora Bora", "Maupiti", "Fakarava", "Raiatea"],
  pitch: {
    fr: "Vous cherchez du contenu authentique depuis le paradis ? Collaborons ensemble.",
    en: "Looking for authentic content from paradise? Let's collaborate.",
  },
  visible: true,
  backgroundVideoUrl: "",
};
