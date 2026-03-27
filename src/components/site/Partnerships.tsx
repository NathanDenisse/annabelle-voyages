"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useInView, AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Partnership, SiteContent } from "@/types";
import { getYouTubeId, detectVideoSource } from "@/lib/storage";

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

// ─── Viewport-aware card ───
function PartnershipCard({
  item,
  onClick,
}: {
  item: Partnership;
  onClick: () => void;
}) {
  const { lang } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [inViewport, setInViewport] = useState(false);

  const isMp4 = !!item.mp4VideoUrl;
  const format = isMp4 ? "landscape" : getVideoFormat(item.videoUrl);
  const videoId = (!isMp4 && item.videoUrl) ? getYouTubeId(item.videoUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`
    : null;
  const hasImages = item.images && item.images.length > 0;
  const coverImage = thumbnailUrl || (hasImages ? item.images![0] : item.logoUrl);

  // IntersectionObserver: play/pause MP4, load YouTube iframe at 80%
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInViewport(entry.isIntersecting);
        if (isMp4 && videoRef.current) {
          if (entry.isIntersecting) videoRef.current.play().catch(() => {});
          else videoRef.current.pause();
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMp4]);

  const aspectClass = format === "short" ? "aspect-[9/16]" : "aspect-[16/9]";

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-terracotta-500/40 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      {coverImage ? (
        <Image src={coverImage} alt={item.name} fill className={`object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-0" : "opacity-100"}`} loading="lazy" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4A3230] to-[#2A1815]" />
      )}

      {/* MP4: controlled by IntersectionObserver */}
      {isMp4 && (
        <video ref={videoRef} src={item.mp4VideoUrl} muted loop playsInline preload="auto"
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* YouTube: iframe loads when in viewport — pointer-events:none so clicks reach the card onClick */}
      {embedUrl && !isMp4 && inViewport && (
        <iframe src={embedUrl} title={`${item.name} video`} allow="autoplay; encrypted-media"
          onLoad={() => setVideoLoaded(true)}
          style={{ pointerEvents: "none" }}
          className={`absolute inset-0 w-full h-full border-none transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

      {!videoId && !isMp4 && hasImages && item.images!.length > 1 && (
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm text-white text-xs font-sans px-2.5 py-1 rounded-full">
          {item.images!.length} photos
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

function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i === active ? "w-6 h-2 bg-terracotta-400" : "w-2 h-2 bg-white/20"}`} />
      ))}
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    duration: prefersReduced ? 0 : 20,
    active: !isDesktop,
  });

  const visible = items.filter((item) => item.visible !== false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, isDesktop]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (visible.length === 0) return null;

  const openGallery = (item: Partnership) => { setSelectedPartnership(item); setCurrentImageIndex(0); };
  const closeGallery = () => { setSelectedPartnership(null); setCurrentImageIndex(0); };
  const nextImage = () => { if (selectedPartnership?.images) setCurrentImageIndex((p) => p < selectedPartnership.images!.length - 1 ? p + 1 : 0); };
  const prevImage = () => { if (selectedPartnership?.images) setCurrentImageIndex((p) => p > 0 ? p - 1 : selectedPartnership.images!.length - 1); };
  const getModalVideoId = () => selectedPartnership?.videoUrl ? getYouTubeId(selectedPartnership.videoUrl) : null;
  const getModalVideoFormat = () => selectedPartnership?.videoUrl ? getVideoFormat(selectedPartnership.videoUrl) : "none";

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
              {lang === "fr" ? "Des collaborations authentiques avec des marques et hôtels qui partagent ma vision du voyage." : "Authentic collaborations with brands and hotels that share my vision of travel."}
            </p>
          </div>
        </div>

        {isDesktop ? (
          /* ─── Desktop: masonry grid ─── */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="columns-2 lg:columns-3 gap-5">
              {visible.map((item) => (
                <div key={item.id} className="break-inside-avoid mb-5">
                  <PartnershipCard item={item} onClick={() => openGallery(item)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Mobile: Embla carousel ─── */
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {visible.map((item, i) => {
                  const format = item.mp4VideoUrl ? "landscape" : getVideoFormat(item.videoUrl);
                  return (
                    <div key={item.id} className={`flex-none px-3 ${format === "short" ? "w-[65%]" : "w-[88%]"}`}>
                      <div style={{ transform: i === activeIndex ? "scale(1)" : "scale(0.95)", opacity: i === activeIndex ? 1 : 0.6, transition: "transform 0.3s ease-out, opacity 0.3s ease-out" }}>
                        <PartnershipCard item={item} onClick={() => openGallery(item)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation arrows */}
            {visible.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all"
                  aria-label="Précédent"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all"
                  aria-label="Suivant"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <CarouselDots count={visible.length} active={activeIndex} />
          </div>
        )}
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedPartnership && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={closeGallery}>
            <button onClick={closeGallery} className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={24} /></button>
            <div className="absolute top-4 left-4 z-10">
              <h3 className="font-serif italic text-xl text-white">{selectedPartnership.name}</h3>
              {!getModalVideoId() && !selectedPartnership.mp4VideoUrl && selectedPartnership.images && selectedPartnership.images.length > 0 && (
                <p className="font-sans text-sm text-white/50 mt-1">{currentImageIndex + 1} / {selectedPartnership.images.length}</p>
              )}
            </div>

            {selectedPartnership.mp4VideoUrl ? (
              <div className="relative w-full max-w-5xl aspect-video mx-4" onClick={(e) => e.stopPropagation()}>
                <video src={selectedPartnership.mp4VideoUrl} autoPlay loop playsInline controls className="w-full h-full object-contain rounded-xl" />
              </div>
            ) : getModalVideoId() ? (
              <div className={`relative mx-4 ${getModalVideoFormat() === "short" ? "w-full max-w-sm aspect-[9/16]" : "w-full max-w-5xl aspect-video"}`} onClick={(e) => e.stopPropagation()}>
                <iframe src={`https://www.youtube.com/embed/${getModalVideoId()}?autoplay=1&mute=0&loop=1&playlist=${getModalVideoId()}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                  title={selectedPartnership.name} allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="absolute inset-0 w-full h-full rounded-xl border-none" />
              </div>
            ) : selectedPartnership.images && selectedPartnership.images.length > 0 ? (
              <>
                <div className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4 my-16" onClick={(e) => e.stopPropagation()}>
                  <Image src={selectedPartnership.images[currentImageIndex]} alt={`${selectedPartnership.name} - ${currentImageIndex + 1}`} fill className="object-contain" />
                </div>
                {selectedPartnership.images.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><ChevronLeft size={24} /></button>
                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><ChevronRight size={24} /></button>
                  </>
                )}
              </>
            ) : (
              <div className="text-center" onClick={(e) => e.stopPropagation()}>
                <p className="font-sans text-white/40 text-lg mb-2">{lang === "fr" ? "Pas encore de contenu" : "No content yet"}</p>
                <p className="font-sans text-white/25 text-sm">{t(selectedPartnership.description, lang)}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
