"use client";

import { useRef, useState, useEffect, memo } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { t } from "@/lib/i18n";
import { Partnership, SiteContent } from "@/types";
import ScrollTeaser from "./ScrollTeaser";
import { detectVideoSource, getYouTubeId } from "@/lib/storage";
import dynamic from "next/dynamic";
const ItemModal = dynamic(() => import("./ItemModal"), { ssr: false });

interface PartnershipsProps {
  items: Partnership[];
  content: SiteContent;
}


type CardFormat = "vertical" | "horizontal";

function getPartnershipFormat(item: Partnership): CardFormat {
  const first = item.gallery[0];
  if (!first) return "horizontal";
  if (first.format) return first.format;
  if (first.platform === "mp4") return "vertical";
  if (first.platform === "youtube") {
    return detectVideoSource(first.url) === "youtube-short" ? "vertical" : "horizontal";
  }
  return "horizontal";
}


// ─── Card ───
const PartnershipCard = memo(function PartnershipCard({ item, onClick, format = "horizontal" }: { item: Partnership; onClick: () => void; format?: CardFormat }) {
  const { lang } = useLanguage();
  const [mp4Ready, setMp4Ready] = useState(false);
  const [isOnScreen, setIsOnScreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const firstMedia = item.gallery[0] ?? null;
  const isMp4Cover = firstMedia?.platform === "mp4";
  const mp4Src = firstMedia?.platform === "mp4" ? firstMedia.url : undefined;

  const coverImage = (() => {
    if (!firstMedia) return item.logoUrl || null;
    if (firstMedia.type === "image") return firstMedia.url;
    if (firstMedia.platform === "mp4") return firstMedia.thumbnailUrl || item.logoUrl || null;
    const videoId = getYouTubeId(firstMedia.url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : item.logoUrl || null;
  })();

  // Detect when card enters/leaves viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !isMp4Cover) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsOnScreen(entry.isIntersecting),
      { rootMargin: "50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMp4Cover]);

  // Load & play when on screen, pause when off
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isOnScreen) {
      video.load();
    } else {
      video.pause();
      setMp4Ready(false);
    }
  }, [isOnScreen]);

  const aspectClass = format === "vertical" ? "aspect-[9/16]" : "aspect-[16/10]";
  const mediaCount = item.gallery.length;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-terracotta-500/40 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {/* Static cover — visible until video is ready */}
      {coverImage ? (
        <Image src={coverImage} alt={item.name} fill
          className={`object-cover transition-opacity duration-500 ${mp4Ready ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A3230] to-[#2A1815]" />
      )}

      {/* MP4 video — always mounted, loaded on demand when visible */}
      {isMp4Cover && mp4Src && (
        <video
          ref={videoRef}
          src={mp4Src}
          muted loop playsInline preload="none"
          onCanPlay={() => { setMp4Ready(true); videoRef.current?.play().catch(() => {}); }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${mp4Ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

      {mediaCount > 1 && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-sans px-2.5 py-1 rounded-full">
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
  const isDesktop = useBreakpoint();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);

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

  const visible = items.filter((item) => item.visible !== false);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, isDesktop]);

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

        {isDesktop ? (
          /* ─── Desktop: grille uniforme 3 colonnes ─── */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-4">
              {visible.map((item) => (
                <PartnershipCard
                  key={item.id}
                  item={item}
                  format="horizontal"
                  onClick={() => setSelectedPartnership(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ─── Mobile: Embla auto-scroll + drag ─── */
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {visible.map((item) => {
                const format = getPartnershipFormat(item);
                return (
                  <div key={item.id} className={`flex-none px-1.5 ${format === "vertical" ? "w-[55%]" : "w-[80%]"}`}>
                    <PartnershipCard item={item} format={format} onClick={() => setSelectedPartnership(item)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teaser */}
        <div className="relative z-10 flex justify-center pt-10 pb-6">
          <ScrollTeaser textFr="Ce qu'ils en disent ↓" textEn="What they say ↓" target="#testimonials" light={false} />
        </div>
      </section>

      {selectedPartnership && (
        <ItemModal
          gallery={selectedGallery}
          title={selectedPartnership.name}
          description={t(selectedPartnership.description, lang)}
          onClose={() => setSelectedPartnership(null)}
        />
      )}
    </>
  );
}
