"use client";

import { useState, useRef, useEffect } from "react";
import { useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { t, filterLabels } from "@/lib/i18n";
import { PortfolioItem, Partnership, MediaCategory, MediaItem, SiteContent, CATEGORY_LABELS } from "@/types";
import ScrollTeaser from "./ScrollTeaser";
import {
  detectVideoSource,
  getVideoThumbnail,
  getYouTubeId,
} from "@/lib/storage";
import ItemModal from "./ItemModal";

interface PortfolioProps {
  items: PortfolioItem[];
  partnerships?: Partnership[];
  content: SiteContent;
}

/** Convert a Partnership to a PortfolioItem for unified display in "My Work" */
function partnershipToItem(p: Partnership): PortfolioItem {
  // Build gallery: use gallery[] if available, otherwise synthesize from legacy fields
  const gallery: MediaItem[] =
    p.gallery && p.gallery.length > 0
      ? p.gallery
      : [
          ...(p.mp4VideoUrl ? [{ type: "video" as const, url: p.mp4VideoUrl, platform: "mp4" as const }] : []),
          ...(p.videoUrl ? [{ type: "video" as const, url: p.videoUrl, platform: "youtube" as const }] : []),
          ...((p.images ?? []).map((url): MediaItem => ({ type: "image", url }))),
        ];

  // Use first image or logo as static thumbnail fallback
  const imageUrl =
    (p.images && p.images.length > 0 ? p.images[0] : undefined) ??
    p.logoUrl ??
    "";

  return {
    id: `partnership-${p.id}`,
    title: { fr: p.name, en: p.name },
    location: "",
    category: "hotel",
    description: p.description,
    type: gallery[0]?.type === "video" ? "video" : "image",
    imageUrl,
    videoUrl: p.videoUrl,
    mp4VideoUrl: p.mp4VideoUrl,
    gallery,
    order: p.order,
    visible: p.visible !== false,
  };
}

const categories: (MediaCategory | "all")[] = ["all", "hotel", "paysage", "lifestyle", "drone", "activity"];

type CardFormat = "landscape" | "short";

function getCardFormat(item: PortfolioItem): CardFormat {
  // "short" ONLY for YouTube Shorts (URL contains /shorts/) — everything else is landscape
  const first = item.gallery?.[0];
  if (first?.type === "video" && first.platform === "youtube") {
    return detectVideoSource(first.url) === "youtube-short" ? "short" : "landscape";
  }
  if (!item.gallery?.length && item.videoUrl) {
    return detectVideoSource(item.videoUrl) === "youtube-short" ? "short" : "landscape";
  }
  return "landscape";
}

/** Build the lightbox gallery from an item — gallery[] first, then legacy fallback */
function buildGallery(item: PortfolioItem): MediaItem[] {
  if (item.gallery && item.gallery.length > 0) return item.gallery;
  if (item.mp4VideoUrl) return [{ type: "video", url: item.mp4VideoUrl, platform: "mp4" }];
  if (item.videoUrl) return [{ type: "video", url: item.videoUrl, platform: "youtube" }];
  if (item.imageUrl) return [{ type: "image", url: item.imageUrl }];
  return [];
}

/** Card cover thumbnail — follows priority: gallery[0] → mp4VideoUrl → videoUrl → imageUrl */
function getCardThumbnail(item: PortfolioItem): string {
  const first = item.gallery?.[0];
  if (first) {
    if (first.type === "image") return first.url;
    if (first.platform === "mp4") return item.thumbnailUrl || ""; // video tag will play
    const id = getYouTubeId(first.url);
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
  }
  if (item.mp4VideoUrl) return item.thumbnailUrl || "";
  if (item.videoUrl) return getVideoThumbnail(item.videoUrl);
  return item.thumbnailUrl || item.imageUrl || "/images/placeholders/portfolio.svg";
}

function useBreakpoint() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

// ─── Card ───
function MediaCard({
  item,
  lang,
  format,
  onClick,
}: {
  item: PortfolioItem;
  lang: "fr" | "en";
  format: CardFormat;
  onClick: () => void;
}) {
  const [mp4Ready, setMp4Ready] = useState(false);

  const hasGallery = item.gallery && item.gallery.length > 0;
  const firstMedia = hasGallery ? item.gallery![0] : null;
  // MP4 cover: gallery[0] if MP4, else legacy mp4VideoUrl
  const mp4CoverSrc = firstMedia?.platform === "mp4"
    ? firstMedia.url
    : (!hasGallery ? (item.mp4VideoUrl || null) : null);
  const isMp4 = !!mp4CoverSrc;
  // Static thumbnail (YouTube cards show thumbnail only — iframe loads in popup)
  const thumbnail = getCardThumbnail(item);

  const aspectClass = format === "short" ? "aspect-[9/16]" : "aspect-[16/10]";
  const mediaCount = item.gallery?.length ?? 0;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {/* Static thumbnail — always visible; fades out only when MP4 is ready */}
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={t(item.title, lang)}
          fill
          className={`object-cover transition-opacity duration-700 ${mp4Ready ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
        />
      )}

      {/* MP4 autoplay — preload="none" avoids loading every video in the carousel */}
      {isMp4 && mp4CoverSrc && (
        <video
          src={mp4CoverSrc}
          autoPlay muted loop playsInline preload="none"
          onCanPlay={() => setMp4Ready(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${mp4Ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* YouTube: static thumbnail only in card — iframe loads in popup on click */}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

      {/* Category tag */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-white/80 backdrop-blur-sm text-brown-700 text-xs font-sans font-medium px-2.5 py-1 rounded-full">
          {t(CATEGORY_LABELS[item.category], lang)}
        </span>
      </div>

      {/* Media count badge */}
      {mediaCount > 1 && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-sans px-2 py-0.5 rounded-full">
          {mediaCount}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10 pointer-events-none">
        <h3 className="font-serif text-lg sm:text-xl font-medium text-white leading-tight line-clamp-2">
          {t(item.title, lang)}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={11} className="text-white/60 flex-shrink-0" />
          <p className="font-sans text-xs text-white/60 truncate">{item.location}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───
export default function Portfolio({ items, partnerships = [], content }: PortfolioProps) {
  const { lang } = useLanguage();
  const isDesktop = useBreakpoint();
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "all">("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [scrollPaused, setScrollPaused] = useState(false);
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });

  const autoScrollPlugin = useRef(AutoScroll({
    speed: 0.4,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
    startDelay: 0,
  })).current;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true, active: !isDesktop },
    [autoScrollPlugin]
  );

  // Merge portfolio items + partnerships (partnerships always appear last, category "hotel")
  const visibleItems = [
    ...items.filter((item) => item.visible),
    ...partnerships.filter((p) => p.visible !== false).map(partnershipToItem),
  ];
  const filtered = activeCategory === "all"
    ? visibleItems
    : visibleItems.filter((item) => item.category === activeCategory);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [activeCategory, emblaApi, isDesktop]);

  const selectedGallery = selectedItem ? buildGallery(selectedItem) : [];

  return (
    <section id="portfolio" className="relative py-14 md:py-20 bg-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className={`text-center mb-8 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="font-sans text-xs font-medium text-terracotta-500 tracking-widest uppercase mb-3">{t(content.portfolioTitle, lang)}</p>
          <h2 className="font-script text-6xl md:text-7xl text-brown-900">{lang === "fr" ? "Mon travail" : "My work"}</h2>
          <div className={`w-16 h-px bg-terracotta-400 mx-auto mt-4 transition-all duration-700 delay-300 ${isInView ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
        </div>

        <div className={`flex flex-wrap justify-center gap-2 mb-6 transition-all duration-500 delay-200 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-sans font-medium transition-all duration-300 ${activeCategory === cat ? "gradient-sunset text-white shadow-md shadow-terracotta-400/30" : "bg-white text-brown-500 hover:bg-blush-100 border border-blush-200"}`}>
              {cat === "all" ? t(filterLabels.all, lang) : t(filterLabels[cat], lang)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        isDesktop ? (
          /* ─── Desktop: grille uniforme 3 colonnes ─── */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  format="landscape"
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ─── Mobile: Embla auto-scroll + drag ─── */
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {filtered.map((item) => {
                const format = getCardFormat(item);
                return (
                  <div key={item.id} className={`flex-none px-1.5 ${format === "short" ? "w-[55%]" : "w-[84%]"}`}>
                    <MediaCard item={item} lang={lang} format={format} onClick={() => setSelectedItem(item)} />
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <p className="text-center font-sans text-brown-300 py-16 text-sm">
          {lang === "fr" ? "Aucun contenu dans cette catégorie" : "No content in this category"}
        </p>
      )}

      {/* Teaser */}
      <div className="relative z-10 flex justify-center pt-10 pb-6">
        <ScrollTeaser textFr="Ils m'ont fait confiance ↓" textEn="They trusted me ↓" target="#partnerships" light />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ItemModal
            gallery={selectedGallery}
            title={t(selectedItem.title, lang)}
            description={selectedItem.description ? t(selectedItem.description, lang) : undefined}
            location={selectedItem.location}
            categoryLabel={t(CATEGORY_LABELS[selectedItem.category], lang)}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
