export type Language = "fr" | "en";

export interface LocalizedText {
  fr: string;
  en: string;
}

// Firestore Collections

export interface SiteContent {
  id: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  aboutImageUrl?: string;
  heroTagline: LocalizedText;
  heroCta: LocalizedText;
  aboutBio: LocalizedText;
  aboutTitle: LocalizedText;
  portfolioTitle: LocalizedText;
  partnershipsTitle: LocalizedText;
  contactTitle: LocalizedText;
  contactSubtitle: LocalizedText;
  contactEmail: string;
  footerText: LocalizedText;
  stats: {
    countries: number;
    followers: number;
    collaborations: number;
  };
  statsLabels: {
    countries: LocalizedText;
    followers: LocalizedText;
    collaborations: LocalizedText;
  };
  updatedAt?: Date;
}

export interface SocialLinks {
  id: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  updatedAt?: Date;
}

export type MediaCategory = "hotel" | "paysage" | "lifestyle" | "drone";

export interface MediaItem {
  type: "image" | "video";
  url: string;
  platform?: "youtube" | "mp4";
}

export interface PortfolioItem {
  id: string;
  title: LocalizedText;
  location: string;
  category: MediaCategory;
  description: LocalizedText;
  type: "image" | "video";
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string; // YouTube/TikTok URL
  mp4VideoUrl?: string; // Direct MP4 from Firebase Storage
  gallery?: MediaItem[]; // Multi-media gallery
  order: number;
  visible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Partnership {
  id: string;
  name: string;
  description: LocalizedText;
  logoUrl?: string;
  images?: string[];
  videoUrl?: string; // YouTube URL
  mp4VideoUrl?: string; // Direct MP4 from Firebase Storage
  gallery?: MediaItem[]; // Multi-media gallery
  externalLink: string;
  order: number;
  visible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StorageTrackingEntry {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  type: "image" | "video";
  url: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface HeroMedia {
  id: string;
  type: "image" | "video";
  url: string;
  updatedAt?: Date;
}

export interface Testimonial {
  id: string;
  text: LocalizedText;
  role: LocalizedText;
  rating: number;
  order: number;
  visible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin form types
export interface PortfolioItemForm {
  title: LocalizedText;
  location: string;
  category: MediaCategory;
  description: LocalizedText;
  type: "image" | "video";
  videoUrl?: string;
  visible: boolean;
}

export interface PartnershipForm {
  name: string;
  description: LocalizedText;
  externalLink: string;
  visible: boolean;
}

export const CATEGORY_LABELS: Record<MediaCategory, LocalizedText> = {
  hotel: { fr: "Hôtel", en: "Hotel" },
  paysage: { fr: "Paysage", en: "Landscape" },
  lifestyle: { fr: "Lifestyle", en: "Lifestyle" },
  drone: { fr: "Drone", en: "Drone" },
};
