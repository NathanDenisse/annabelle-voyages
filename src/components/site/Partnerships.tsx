"use client";

import { useRef, useState, useEffect } from "react";
import { useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Partnership, SiteContent, MediaItem } from "@/types";
import { getYouTubeId, detectVideoSource } from "@/lib/storage";
import MediaLightbox from "./MediaLightbox";

interface PartnershipsProps {
  items: Partnership[];
  content: SiteContent;
}

type VideoFormat = "landscape" | "short" | "none";

function getVideoFormat(url?: string): VideoFormat {
  if (!url) return "none";
  const source = detectVideoSource(url);
  if (source === "youtube-short") return "short";
  if (source === "youtube") return "landscape";
  return "none";
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
function PartnershipCard({ item, onClick }: { item: Partnership; onClick: () => void }) {
  const { lang } = useLanguage();
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Determine cover from gallery or legacy fields
  const hasGallery = item.gallery && item.gallery.length > 0;
  const firstMedia = hasGallery ? item.gallery![0] : null;
  const isMp4Cover = firstMedia?.platform === "mp4" || (!hasGallery && !!item.mp4VideoUrl);
  const mp4Src = firstMedia?.platform === "mp4" ? firstMedia.url : (!hasGallery ? item.mp4VideoUrl : undefined);

  const youtubeUrl = firstMedia?.type === "video" && firstMedia.platform === "youtube"
    ? firstMedia.url
    : (!hasGallery ? item.videoUrl : undefined);
  const videoId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;
  const format: VideoFormat = isMp4Cover ? "landscape" : (youtubeUrl ? getVideoFormat(youtubeUrl) : "none");

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`
    : null;

  // Cover image: first image from gallery, or yt thumbnail, or legacy images
  const coverImage = (() => {
    if (hasGallery) {
      const firstImg = item.gallery!.find((m) => m.type === "image");
      if (firstImg) return firstImg.url;
      if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      return item.logoUrl || null;
    }
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    if (item.images && item.images.length > 0) return item.images[0];
    return item.logoUrl || null;
  })();

  const aspectClass = format === "short" ? "aspect-[9/16]" : "aspect-[16/9]";
  const mediaCount = item.gallery?.length ?? ((item.images?.length ?? 0) + (item.videoUrl || item.mp4VideoUrl ? 1 : 0));

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-terracotta-500/40 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {coverImage ? (
        <Image src={coverImage} alt={item.name} fill
          className={`object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A3230] to-[#2A1815]" />
      )}

      {/* MP4: autoPlay always — no IntersectionObserver */}
      {isMp4Cover && mp4Src && (
        <video src={mp4Src} autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* YouTube: always rendered — no inViewport gate */}
      {embedUrl && !isMp4Cover && (
        <iframe src={embedUrl} title={`${item.name} video`} allow="autoplay; encrypted-media"
          onLoad={() => setVideoLoaded(true)}
          style={{ pointerEvents: "none" }}
          className={`absolute inset-0 w-full h-full border-none transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />
      )}

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

  const autoScrollPlugin = AutoScroll({
    speed: 1.2,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true, active: !isDesktop },
    [autoScrollPlugin]
  );

  const visible = items.filter((item) => item.visible !== false);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, isDesktop]);

  useEffect(() => {
    if (!emblaApi) return;
    let resumeTimer: ReturnType<typeof setTimeout>;
    const handlePointerUp = () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => autoScrollPlugin.play(), 3000);
    };
    emblaApi.on("pointerUp", handlePointerUp);
    return () => {
      emblaApi.off("pointerUp", handlePointerUp);
      clearTimeout(resumeTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi]);

  if (visible.length === 0) return null;

  const selectedGallery = selectedPartnership ? buildPartnershipGallery(selectedPartnership) : [];

  return (
    <>
      <section id="partnerships" className="relative py-24 md:py-36 overflow-hidden bg-gradient-to-br from-brown-900 via-[#3D2420] to-brown-900">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={ref} className={`text-center mb-16 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
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
          /* ─── Desktop: masonry grid ─── */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="columns-2 lg:columns-3 gap-5">
              {visible.map((item) => (
                <div key={item.id} className="break-inside-avoid mb-5">
                  <PartnershipCard item={item} onClick={() => setSelectedPartnership(item)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Mobile: Embla auto-scroll ─── */
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {visible.map((item) => {
                const format = item.mp4VideoUrl ? "landscape" : getVideoFormat(item.videoUrl);
                return (
                  <div key={item.id} className={`flex-none px-1.5 ${format === "short" ? "w-[62%]" : "w-[84%]"}`}>
                    <PartnershipCard item={item} onClick={() => setSelectedPartnership(item)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedPartnership && selectedGallery.length > 0 && (
          <MediaLightbox
            items={selectedGallery}
            title={selectedPartnership.name}
            description={t(selectedPartnership.description, lang)}
            onClose={() => setSelectedPartnership(null)}
          />
        )}
        {selectedPartnership && selectedGallery.length === 0 && (
          // No content yet — show name only (reuse lightbox shell via empty state)
          <MediaLightbox
            items={[]}
            title={selectedPartnership.name}
            description={t(selectedPartnership.description, lang)}
            onClose={() => setSelectedPartnership(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
