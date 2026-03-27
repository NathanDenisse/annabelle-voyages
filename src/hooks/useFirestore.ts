"use client";

import { useState, useEffect } from "react";
import {
  onSiteContentChange,
  onSocialLinksChange,
  onPortfolioChange,
  onPartnershipsChange,
  onMessagesChange,
  onStorageTrackingChange,
} from "@/lib/firestore";
import {
  SiteContent,
  StorageTrackingEntry,
  SocialLinks,
  PortfolioItem,
  Partnership,
  ContactMessage,
} from "@/types";
import { defaultContent, statsLabels } from "@/lib/i18n";

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

  // Return defaults if Firestore has no data yet
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
      setItems(data);
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
    videoUrl: "https://www.youtube.com/watch?v=jkOtTMXUR54",
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
      setItems(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { items: items.length > 0 ? items : defaultPartnerships, loading };
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
