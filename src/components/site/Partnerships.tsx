"use client";

import { useRef, useState, useEffect } from "react";
import { useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Partnership, SiteContent, MediaItem } from "@/types";
import ScrollTeaser from "./ScrollTeaser";
import { getYouTubeId } from "@/lib/storage";
import ItemModal from "./ItemModal";

interface PartnershipsProps {
  items: Partnership[];
  content: SiteContent;
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

/** Build lightbox gallery — gallery[] first, then legacy fallback */
function buildPartnershipGallery(item: Partnership): MediaItem[] {
  if (item.gallery && item.gallery.length > 0) return item.gallery;
  const result: MediaItem[] = [];
  if (item.mp4VideoUrl) result.push({ type: "video", url: item.mp4VideoUrl, platform: "mp4" });
  if (item.videoUrl) result.push({ type: "video", url: item.videoUrl, platform: "youtube" });
  if (item.images) item.images.forEach((url) => result.push({ type: "image", url }));
  return result;
}

// ─── Card ───
function PartnershipCard({ item, onClick, forcedAspect }: { item: Partnership; onClick: () => void; forcedAspect?: string }) {
  const { lang } = useLanguage();
  const [mp4Ready, setMp4Ready] = useState(false);

  // Determine cover from gallery or legacy fields
  const hasGallery = item.gallery && item.gallery.length > 0;
  const firstMedia = hasGallery ? item.gallery![0] : null;
  const isMp4Cover = firstMedia?.platform === "mp4" || (!hasGallery && !!item.mp4VideoUrl);
  const mp4Src = firstMedia?.platform === "mp4" ? firstMedia.url : (!hasGallery ? item.mp4VideoUrl : undefined);

  // YouTube video ID — used only for thumbnail (no autoplay in card)
  const youtubeUrl = firstMedia?.type === "video" && firstMedia.platform === "youtube"
    ? firstMedia.url
    : (!hasGallery ? item.videoUrl : undefined);
  const videoId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  // Cover image: gallery[0] if image, else YT thumb, else logo
  const coverImage = (() => {
    if (hasGallery) {
      if (firstMedia!.type === "image") return firstMedia!.url;
      const anyImg = item.gallery!.find((m) => m.type === "image");
      if (anyImg) return anyImg.url;
      if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      return item.logoUrl || null;
    }
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    if (item.images && item.images.length > 0) return item.images[0];
    return item.logoUrl || null;
  })();

  const aspectClass = forcedAspect ?? "aspect-[16/10]";
  const mediaCount = item.gallery?.length ?? ((item.images?.length ?? 0) + (item.videoUrl || item.mp4VideoUrl ? 1 : 0));

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-terracotta-500/40 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {/* Static cover — thumbnail or image; fades out only when MP4 is ready */}
      {coverImage ? (
        <Image src={coverImage} alt={item.name} fill
          className={`object-cover transition-opacity duration-700 ${mp4Ready ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A3230] to-[#2A1815]" />
      )}

      {/* MP4 autoplay — preload="none" avoids loading every video in the carousel */}
      {isMp4Cover && mp4Src && (
        <video src={mp4Src} autoPlay muted loop playsInline preload="none"
          onCanPlay={() => setMp4Ready(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${mp4Ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* YouTube: static thumbnail only in card — iframe loads in popup on click */}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

      {mediaCount > 1 && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-sans px-2.5 py-1 rounded-full">
          {mediaCount} médias
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
}

// ─── Main component ───
export default function Partnerships({ items, content }: PartnershipsProps) {
  const { lang } = useLanguage();
  const isDesktop = useBreakpoint();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);

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

  const visible = items.filter((item) => item.visible !== false);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, isDesktop]);

  if (visible.length === 0) return null;

  const selectedGallery = selectedPartnership ? buildPartnershipGallery(selectedPartnership) : [];

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
                  forcedAspect="aspect-[16/10]"
                  onClick={() => setSelectedPartnership(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ─── Mobile: Embla auto-scroll + drag ─── */
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {visible.map((item) => (
                <div key={item.id} className="flex-none px-1.5 w-[84%]">
                  <PartnershipCard item={item} onClick={() => setSelectedPartnership(item)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teaser */}
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
