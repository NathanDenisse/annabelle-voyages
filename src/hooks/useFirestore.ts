"use client";

import { useState, useEffect, useRef } from "react";
import {
  onSiteContentChange,
  onSocialLinksChange,
  onPortfolioChange,
  onPartnershipsChange,
  onMessagesChange,
  onStorageTrackingChange,
  onTestimonialsChange,
  addTestimonial,
  onNextTripChange,
} from "@/lib/firestore";
import {
  SiteContent,
  StorageTrackingEntry,
  SocialLinks,
  PortfolioItem,
  Partnership,
  ContactMessage,
  Testimonial,
  NextTrip,
  MediaItem,
  LocalizedText,
  MediaCategory,
} from "@/types";
import { defaultContent, statsLabels } from "@/lib/i18n";

// ─── Normalization helpers ────────────────────────────────────────────────────
// Firestore documents may still contain legacy fields (imageUrl, videoUrl,
// mp4VideoUrl, images[]). These helpers build gallery[] from those fields
// so the rest of the app always sees a clean, normalized object.

function buildGalleryFromLegacyPortfolio(raw: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];
  const mp4Url = raw.mp4VideoUrl as string | undefined;
  const videoUrl = raw.videoUrl as string | undefined;
  const imageUrl = raw.imageUrl as string | undefined;
  const thumbUrl = raw.thumbnailUrl as string | undefined;

  if (mp4Url) {
    items.push({ type: "video", url: mp4Url, platform: "mp4", format: "vertical", thumbnailUrl: thumbUrl });
  }
  if (videoUrl) {
    const isShort = /youtube\.com\/shorts\//.test(videoUrl);
    items.push({ type: "video", url: videoUrl, platform: "youtube", format: isShort ? "vertical" : "horizontal" });
  }
  if (imageUrl) {
    items.push({ type: "image", url: imageUrl });
  }
  return items;
}

function buildGalleryFromLegacyPartnership(raw: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];
  const mp4Url = raw.mp4VideoUrl as string | undefined;
  const videoUrl = raw.videoUrl as string | undefined;
  const images = raw.images as string[] | undefined;

  if (mp4Url) {
    items.push({ type: "video", url: mp4Url, platform: "mp4", format: "vertical" });
  }
  if (videoUrl) {
    const isShort = /youtube\.com\/shorts\//.test(videoUrl);
    items.push({ type: "video", url: videoUrl, platform: "youtube", format: isShort ? "vertical" : "horizontal" });
  }
  if (images && images.length > 0) {
    images.forEach((url) => items.push({ type: "image", url }));
  }
  return items;
}

function normalizePortfolio(items: PortfolioItem[]): PortfolioItem[] {
  return items.map((item) => {
    const raw = item as unknown as Record<string, unknown>;
    const hasGallery = Array.isArray(raw.gallery) && (raw.gallery as unknown[]).length > 0;
    return {
      id: item.id,
      title: (raw.title as LocalizedText) || { fr: "", en: "" },
      description: (raw.description as LocalizedText) || { fr: "", en: "" },
      location: (raw.location as string) || "",
      category: (raw.category as MediaCategory) || "hotel",
      gallery: hasGallery ? (raw.gallery as MediaItem[]) : buildGalleryFromLegacyPortfolio(raw),
      visible: (raw.visible as boolean) !== false,
      order: (raw.order as number) ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });
}

function normalizePartnerships(items: Partnership[]): Partnership[] {
  return items.map((item) => {
    const raw = item as unknown as Record<string, unknown>;
    const hasGallery = Array.isArray(raw.gallery) && (raw.gallery as unknown[]).length > 0;
    return {
      id: item.id,
      name: (raw.name as string) || "",
      description: (raw.description as LocalizedText) || { fr: "", en: "" },
      logoUrl: (raw.logoUrl as string) || "",
      gallery: hasGallery ? (raw.gallery as MediaItem[]) : buildGalleryFromLegacyPartnership(raw),
      externalLink: (raw.externalLink as string) || "",
      visible: (raw.visible as boolean) !== false,
      order: (raw.order as number) ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSiteContentChange((data) => {
      setContent(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const safeContent: SiteContent = content ?? {
    id: "main",
    heroTagline: defaultContent.heroTagline,
    heroCta: defaultContent.heroCta,
    aboutBio: defaultContent.aboutBio,
    aboutTitle: defaultContent.aboutTitle,
    portfolioTitle: defaultContent.portfolioTitle,
    partnershipsTitle: defaultContent.partnershipsTitle,
    contactTitle: defaultContent.contactTitle,
    contactSubtitle: defaultContent.contactSubtitle,
    contactEmail: "annabelle.cathala@gmail.com",
    footerText: defaultContent.footerText,
    stats: { countries: 15, followers: 500, collaborations: 1 },
    statsLabels: {
      countries: statsLabels.countries,
      followers: statsLabels.followers,
      collaborations: statsLabels.collaborations,
    },
  };

  return { content: safeContent, loading };
}

export function useSocialLinks() {
  const [socials, setSocials] = useState<SocialLinks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSocialLinksChange((data) => {
      setSocials(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const safeSocials: SocialLinks = socials ?? {
    id: "main",
    instagram: "https://www.instagram.com/annabellecathala",
    youtube: "https://www.youtube.com/@annabellecathala",
    tiktok: "",
  };

  return { socials: safeSocials, loading };
}

export function usePortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onPortfolioChange((data) => {
      setItems(normalizePortfolio(data));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { items, loading };
}

const defaultPartnerships: Partnership[] = [
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

export function usePartnerships() {
  const [items, setItems] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onPartnershipsChange((data) => {
      setItems(normalizePartnerships(data));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { items: items.length > 0 ? items : defaultPartnerships, loading };
}

const seedTestimonials: Omit<Testimonial, "id">[] = [
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

const defaultTestimonials: Testimonial[] = seedTestimonials.map((t, i) => ({
  ...t,
  id: `default-${i}`,
}));

export function useTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onTestimonialsChange((data) => {
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true;
        // Seed sequentially to avoid duplicate writes from concurrent hook instances
        (async () => {
          try {
            for (const t of seedTestimonials) {
              await addTestimonial(t);
            }
          } catch (err) {
            console.error("[useTestimonials] Seed failed:", err);
          }
        })();
      }
      setItems(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { items: items.length > 0 ? items : defaultTestimonials, loading };
}

export function useMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onMessagesChange((data) => {
      setMessages(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const unreadCount = messages.filter((m) => !m.read).length;

  return { messages, loading, unreadCount };
}

export function useStorageTracking() {
  const [entries, setEntries] = useState<StorageTrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onStorageTrackingChange((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const totalBytes = entries.reduce((sum, e) => sum + (e.fileSize || 0), 0);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayBytes = entries
    .filter((e) => e.uploadedAt && new Date(e.uploadedAt) >= todayStart)
    .reduce((sum, e) => sum + (e.fileSize || 0), 0);

  return { entries, loading, totalBytes, todayBytes };
}

const defaultNextTrip: NextTrip = {
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

export function useNextTrip() {
  const [data, setData] = useState<NextTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onNextTripChange((d) => {
      setData(d);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { data: data ?? defaultNextTrip, loading };
}
