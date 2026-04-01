"use client";

import { useState, useRef, memo, useCallback } from "react";
import { useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t, filterLabels } from "@/lib/i18n";
import { PortfolioItem, MediaCategory, SiteContent, CATEGORY_LABELS } from "@/types";
import ScrollTeaser from "./ScrollTeaser";
import { getYouTubeId } from "@/lib/storage";
import ItemModal from "./ItemModal";
import MediaCarousel, { CardFormat } from "./MediaCarousel";

interface PortfolioProps {
  items: PortfolioItem[];
  content: SiteContent;
}

const categories: (MediaCategory | "all")[] = ["all", "hotel", "paysage", "lifestyle", "drone", "activity"];

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
const PortfolioCard = memo(function PortfolioCard({
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
  const thumbnail = getCardThumbnail(item);
  const isVideo = item.gallery[0]?.type === "video";
  const aspectClass = format === "vertical" ? "aspect-[9/16]" : "aspect-[16/10]";
  const mediaCount = item.gallery.length;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {thumbnail && (
        <Image src={thumbnail} alt={t(item.title, lang)} fill className="object-cover" loading="lazy" />
      )}

      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[13px] border-l-white ml-1" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

      <div className="absolute top-3 left-3 z-10">
        <span className="bg-white/80 backdrop-blur-sm text-brown-700 text-xs font-sans font-medium px-2.5 py-1 rounded-full">
          {t(CATEGORY_LABELS[item.category], lang)}
        </span>
      </div>

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
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "all">("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });

  const visibleItems = items.filter((item) => item.visible);
  const filtered = activeCategory === "all"
    ? visibleItems
    : visibleItems.filter((item) => item.category === activeCategory);

  const getGallery = useCallback((item: PortfolioItem) => item.gallery, []);
  const getKey = useCallback((item: PortfolioItem) => item.id, []);

  const renderCard = useCallback(
    (item: PortfolioItem, format: CardFormat) => (
      <PortfolioCard
        key={item.id}
        item={item}
        lang={lang}
        format={format}
        onClick={() => setSelectedItem(item)}
      />
    ),
    [lang]
  );

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
        <MediaCarousel
          items={filtered}
          renderCard={renderCard}
          getGallery={getGallery}
          getKey={getKey}
          reInitDeps={[activeCategory]}
        />
      ) : (
        <p className="text-center font-sans text-brown-300 py-16 text-sm">
          {lang === "fr" ? "Aucun contenu dans cette catégorie" : "No content in this category"}
        </p>
      )}

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
