"use client";

import { useRef, useState, memo, useCallback } from "react";
import { useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Partnership, SiteContent } from "@/types";
import ScrollTeaser from "./ScrollTeaser";
import { getYouTubeId } from "@/lib/storage";
import ItemModal from "./ItemModal";
import MediaCarousel, { CardFormat } from "./MediaCarousel";

interface PartnershipsProps {
  items: Partnership[];
  content: SiteContent;
}

// ─── Card ───
const PartnershipCard = memo(function PartnershipCard({
  item,
  lang,
  format,
  onClick,
}: {
  item: Partnership;
  lang: "fr" | "en";
  format: CardFormat;
  onClick: () => void;
}) {
  const firstMedia = item.gallery[0] ?? null;
  const isVideo = firstMedia?.type === "video";

  const coverImage = (() => {
    if (!firstMedia) return item.logoUrl || null;
    if (firstMedia.type === "image") return firstMedia.url;
    if (firstMedia.platform === "mp4") return firstMedia.thumbnailUrl || item.logoUrl || null;
    const videoId = getYouTubeId(firstMedia.url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : item.logoUrl || null;
  })();

  const aspectClass = format === "vertical" ? "aspect-[9/16]" : "aspect-[16/10]";
  const mediaCount = item.gallery.length;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-terracotta-500/40 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {coverImage ? (
        <Image src={coverImage} alt={item.name} fill className="object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A3230] to-[#2A1815]" />
      )}

      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[13px] border-l-white ml-1" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

      {mediaCount > 1 && (
        <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-sm text-white text-xs font-sans px-2.5 py-1 rounded-full">
          {mediaCount} {lang === "fr" ? "médias" : "media"}
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 z-10 pointer-events-none">
        <h3 className="font-serif italic text-lg sm:text-xl text-white group-hover:text-terracotta-400 transition-colors mb-1 sm:mb-2 line-clamp-2">
          {item.name}
        </h3>
        <p className="font-sans text-xs sm:text-sm text-white/60 leading-relaxed line-clamp-2">
          {t(item.description, lang)}
        </p>
      </div>
    </div>
  );
});

// ─── Main component ───
export default function Partnerships({ items, content }: PartnershipsProps) {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);

  const visible = items.filter((item) => item.visible !== false);

  const getGallery = useCallback((item: Partnership) => item.gallery, []);
  const getKey = useCallback((item: Partnership) => item.id, []);

  const renderCard = useCallback(
    (item: Partnership, format: CardFormat) => (
      <PartnershipCard
        key={item.id}
        item={item}
        lang={lang}
        format={format}
        onClick={() => setSelectedPartnership(item)}
      />
    ),
    [lang]
  );

  if (visible.length === 0) return null;

  const selectedGallery = selectedPartnership?.gallery ?? [];

  return (
    <>
      <section id="partnerships" className="relative py-14 md:py-20 overflow-hidden bg-gradient-to-br from-brown-900 via-[#3D2420] to-brown-900">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={ref} className={`text-center mb-8 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="font-sans text-xs font-light text-white/40 tracking-[0.5em] uppercase mb-5">{t(content.partnershipsTitle, lang)}</p>
            <h2 className="font-serif italic font-normal text-4xl md:text-6xl text-white mb-5">
              {lang === "fr" ? "Ils m'ont fait confiance" : "They trusted me"}
            </h2>
            <p className="font-sans text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
              {lang === "fr"
                ? "Des collaborations authentiques avec des marques et hôtels qui partagent ma vision du voyage."
                : "Authentic collaborations with brands and hotels that share my vision of travel."}
            </p>
          </div>
        </div>

        <MediaCarousel
          items={visible}
          renderCard={renderCard}
          getGallery={getGallery}
          getKey={getKey}
        />

        <div className="relative z-10 flex justify-center pt-10 pb-6">
          <ScrollTeaser textFr="Ce qu'ils en disent ↓" textEn="What they say ↓" target="#testimonials" light={false} />
        </div>
      </section>

      <AnimatePresence>
        {selectedPartnership && (
          <ItemModal
            gallery={selectedGallery}
            title={selectedPartnership.name}
            description={t(selectedPartnership.description, lang)}
            onClose={() => setSelectedPartnership(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
