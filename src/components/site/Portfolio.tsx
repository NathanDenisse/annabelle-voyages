"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import { MapPin } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { t, filterLabels } from "@/lib/i18n";
import { PortfolioItem, MediaCategory, SiteContent, CATEGORY_LABELS } from "@/types";
import ScrollTeaser from "./ScrollTeaser";
import {
  detectVideoSource,
  getYouTubeId,
} from "@/lib/storage";
import dynamic from "next/dynamic";
const ItemModal = dynamic(() => import("./ItemModal"), { ssr: false });

interface PortfolioProps {
  items: PortfolioItem[];
  content: SiteContent;
}

const categories: (MediaCategory | "all")[] = ["all", "hotel", "paysage", "lifestyle", "drone", "activity"];

type CardFormat = "vertical" | "horizontal";

function getCardFormat(item: PortfolioItem): CardFormat {
  const first = item.gallery[0];
  if (!first) return "horizontal";
  // Use stored format if set (upload or migration)
  if (first.format) return first.format;
  // Fallback detection from platform / URL
  if (first.platform === "mp4") return "vertical";
  if (first.platform === "youtube") {
    return detectVideoSource(first.url) === "youtube-short" ? "vertical" : "horizontal";
  }
  return "horizontal";
}

/** Card cover thumbnail — gallery[0] is the only source */
function getCardThumbnail(item: PortfolioItem): string {
  const first = item.gallery[0];
  if (!first) return "/images/placeholders/portfolio.svg";
  if (first.type === "image") return first.url;
  if (first.platform === "mp4") return first.thumbnailUrl || "";
  const id = getYouTubeId(first.url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
}

// ─── Card ───
const MediaCard = memo(function MediaCard({
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
  const [isOnScreen, setIsOnScreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const firstMedia = item.gallery[0] ?? null;
  const mp4CoverSrc = firstMedia?.platform === "mp4" ? firstMedia.url : null;
  const isMp4 = !!mp4CoverSrc;
  const thumbnail = getCardThumbnail(item);

  // Only play/load video when card is on screen — fully unload when off screen
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isMp4) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOnScreen(entry.isIntersecting);
        if (!entry.isIntersecting) {
          setMp4Ready(false);
        }
      },
      { rootMargin: "50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMp4]);

  const aspectClass = format === "vertical" ? "aspect-[9/16]" : "aspect-[16/10]";
  const mediaCount = item.gallery.length;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {/* Static thumbnail — visible until video is ready */}
      {thumbnail && (
        <Image
          src={thumbnail}
          alt={t(item.title, lang)}
          fill
          className={`object-cover transition-opacity duration-500 ${mp4Ready ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
        />
      )}

      {/* MP4 video — mounted only when on screen, unmounted when off */}
      {isMp4 && mp4CoverSrc && isOnScreen && (
        <video
          src={mp4CoverSrc}
          autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setMp4Ready(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${mp4Ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

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
});

// ─── Main component ───
export default function Portfolio({ items, content }: PortfolioProps) {
  const { lang } = useLanguage();
  const isDesktop = useBreakpoint();
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "all">("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });

  const autoScrollPlugin = useRef(AutoScroll({
    speed: 0.8,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
    startDelay: 0,
  })).current;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true, active: !isDesktop },
    [autoScrollPlugin]
  );

  const visibleItems = items.filter((item) => item.visible);
  const filtered = activeCategory === "all"
    ? visibleItems
    : visibleItems.filter((item) => item.category === activeCategory);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [activeCategory, emblaApi, isDesktop]);

  const selectedGallery = selectedItem?.gallery ?? [];

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
                  format="horizontal"
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
                  <div key={item.id} className={`flex-none px-1.5 ${format === "vertical" ? "w-[55%]" : "w-[80%]"}`}>
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
    </section>
  );
}
