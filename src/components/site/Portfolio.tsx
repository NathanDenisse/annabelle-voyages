"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useInView, AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X, MapPin, ExternalLink, Play, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t, filterLabels } from "@/lib/i18n";
import { PortfolioItem, MediaCategory, SiteContent, CATEGORY_LABELS } from "@/types";
import {
  detectVideoSource,
  getVideoThumbnail,
  getVideoEmbedUrl,
  getYouTubeId,
} from "@/lib/storage";

interface PortfolioProps {
  items: PortfolioItem[];
  content: SiteContent;
}

const categories: (MediaCategory | "all")[] = ["all", "hotel", "paysage", "lifestyle", "drone"];

type CardFormat = "landscape" | "short" | "photo";

function getCardFormat(item: PortfolioItem): CardFormat {
  if (item.mp4VideoUrl) return "landscape";
  if (item.type === "video" && item.videoUrl) {
    const source = detectVideoSource(item.videoUrl);
    return source === "youtube-short" ? "short" : "landscape";
  }
  return "photo";
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

// ─── Viewport-aware video card ───
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
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [inViewport, setInViewport] = useState(false);

  const isMp4 = !!item.mp4VideoUrl;
  const isVideo = item.type === "video" && (item.videoUrl || item.mp4VideoUrl);
  const videoId = (!isMp4 && isVideo && item.videoUrl) ? getYouTubeId(item.videoUrl!) : null;
  const thumbnail = (!isMp4 && isVideo && item.videoUrl)
    ? getVideoThumbnail(item.videoUrl!)
    : item.thumbnailUrl || item.imageUrl || "/images/placeholders/portfolio.svg";
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`
    : null;

  // Intersection Observer: play/pause MP4 at 80% visibility, load YouTube iframe
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInViewport(entry.isIntersecting);
        if (isMp4 && videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMp4]);

  const aspectClass =
    format === "short" ? "aspect-[9/16]"
    : format === "landscape" ? "aspect-[16/9]"
    : "aspect-[4/5]";

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${aspectClass}`}
    >
      <Image
        src={thumbnail}
        alt={t(item.title, lang)}
        fill
        className={`object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-0" : "opacity-100"} ${!isVideo ? "group-hover:scale-105 transition-transform duration-500" : ""}`}
        loading="lazy"
      />

      {/* MP4: play/pause via IntersectionObserver */}
      {isMp4 && (
        <video
          ref={videoRef}
          src={item.mp4VideoUrl}
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* YouTube: load iframe when in viewport — pointer-events:none so clicks reach the card onClick */}
      {embedUrl && !isMp4 && inViewport && (
        <iframe
          src={embedUrl}
          title={t(item.title, lang)}
          allow="autoplay; encrypted-media"
          onLoad={() => setVideoLoaded(true)}
          style={{ pointerEvents: "none" }}
          className={`absolute inset-0 w-full h-full border-none transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

      <div className="absolute top-3 left-3 z-10">
        <span className="bg-white/80 backdrop-blur-sm text-brown-700 text-xs font-sans font-medium px-2.5 py-1 rounded-full">
          {t(CATEGORY_LABELS[item.category], lang)}
        </span>
      </div>

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

// ─── Lightbox & Embeds (unchanged) ───
function VideoEmbed({ item, lang }: { item: PortfolioItem; lang: "fr" | "en" }) {
  const url = item.videoUrl || "";
  const source = detectVideoSource(url);
  const embedUrl = getVideoEmbedUrl(url);
  const isShort = source === "youtube-short";

  if (item.mp4VideoUrl) {
    return (
      <div className="relative aspect-video mx-4 rounded-xl overflow-hidden bg-black">
        <video src={item.mp4VideoUrl} autoPlay loop playsInline controls className="w-full h-full object-contain" />
      </div>
    );
  }
  if ((source === "youtube" || source === "youtube-short") && embedUrl) {
    return (
      <div className={isShort ? "video-wrapper-short mx-auto max-w-sm" : "video-wrapper mx-4"}>
        <iframe src={embedUrl} title={t(item.title, lang)} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      </div>
    );
  }
  if (source === "instagram") {
    return (
      <div className="mx-4 py-8 flex flex-col items-center gap-4">
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-sans font-medium text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
          Voir sur Instagram <ExternalLink size={13} />
        </a>
      </div>
    );
  }
  return (
    <div className="mx-4 py-8 flex flex-col items-center gap-3">
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-terracotta-500 text-white font-sans font-medium text-sm px-5 py-2.5 rounded-full hover:bg-terracotta-600 transition-colors">
        Voir la vidéo <ExternalLink size={13} />
      </a>
    </div>
  );
}

function Lightbox({ item, lang, onClose }: { item: PortfolioItem; lang: "fr" | "en"; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lightbox-overlay bg-brown-900/90 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end p-3 sticky top-0 bg-white z-10">
          <button onClick={onClose} className="p-3 rounded-full hover:bg-blush-100 text-brown-400 hover:text-brown-900 transition-colors"><X size={24} /></button>
        </div>
        {(item.type === "video" && (item.videoUrl || item.mp4VideoUrl)) ? <VideoEmbed item={item} lang={lang} /> : (
          <div className="relative aspect-[16/9] mx-4">
            <Image src={item.imageUrl || item.thumbnailUrl || "/images/placeholders/portfolio.svg"} alt={t(item.title, lang)} fill className="object-cover rounded-2xl" />
          </div>
        )}
        <div className="p-6">
          <span className="inline-block bg-blush-100 text-terracotta-600 text-xs font-sans font-medium px-3 py-1 rounded-full mb-3">{t(CATEGORY_LABELS[item.category], lang)}</span>
          <h3 className="font-serif text-2xl md:text-3xl font-medium text-brown-900">{t(item.title, lang)}</h3>
          <div className="flex items-center gap-1 mt-1"><MapPin size={13} className="text-brown-400" /><p className="font-sans text-sm text-brown-400">{item.location}</p></div>
          {item.description && <p className="font-sans text-brown-500 mt-4 text-sm leading-relaxed">{t(item.description, lang)}</p>}
        </div>
      </div>
    </motion.div>
  );
}

function CarouselDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i === active ? "w-6 h-2 bg-terracotta-500" : "w-2 h-2 bg-brown-200"}`} />
      ))}
    </div>
  );
}

// ─── Main component ───
export default function Portfolio({ items, content }: PortfolioProps) {
  const { lang } = useLanguage();
  const isDesktop = useBreakpoint();
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "all">("all");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });

  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    duration: prefersReduced ? 0 : 20,
    active: !isDesktop,
  });

  const visibleItems = items.filter((item) => item.visible);
  const filtered = activeCategory === "all" ? visibleItems : visibleItems.filter((item) => item.category === activeCategory);

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
    if (emblaApi) { emblaApi.reInit(); setActiveIndex(0); }
  }, [activeCategory, emblaApi, isDesktop]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section id="portfolio" className="py-20 md:py-28 bg-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className={`text-center mb-14 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="font-sans text-xs font-medium text-terracotta-500 tracking-widest uppercase mb-3">{t(content.portfolioTitle, lang)}</p>
          <h2 className="font-script text-6xl md:text-7xl text-brown-900">{lang === "fr" ? "Mon travail" : "My work"}</h2>
          <div className={`w-16 h-px bg-terracotta-400 mx-auto mt-4 transition-all duration-700 delay-300 ${isInView ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
        </div>

        <div className={`flex flex-wrap justify-center gap-2 mb-10 transition-all duration-500 delay-200 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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
          /* ─── Desktop: masonry grid ─── */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="columns-2 lg:columns-3 gap-5">
              {filtered.map((item) => (
                <div key={item.id} className="break-inside-avoid mb-5">
                  <MediaCard item={item} lang={lang} format={getCardFormat(item)} onClick={() => setSelectedItem(item)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Mobile: Embla carousel ─── */
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {filtered.map((item, index) => {
                  const format = getCardFormat(item);
                  return (
                    <div key={item.id} className={`flex-none px-3 ${format === "short" ? "w-[65%]" : "w-[88%]"}`}>
                      <div style={{ transform: index === activeIndex ? "scale(1)" : "scale(0.95)", opacity: index === activeIndex ? 1 : 0.6, transition: "transform 0.3s ease-out, opacity 0.3s ease-out" }}>
                        <MediaCard item={item} lang={lang} format={format} onClick={() => setSelectedItem(item)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation arrows */}
            {filtered.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-brown-700 hover:bg-white active:scale-95 transition-all"
                  aria-label="Précédent"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-brown-700 hover:bg-white active:scale-95 transition-all"
                  aria-label="Suivant"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <CarouselDots count={filtered.length} active={activeIndex} />
          </div>
        )
      ) : (
        <p className="text-center font-sans text-brown-300 py-16 text-sm">{lang === "fr" ? "Aucun contenu dans cette catégorie" : "No content in this category"}</p>
      )}

      <AnimatePresence>
        {selectedItem && <Lightbox item={selectedItem} lang={lang} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>
    </section>
  );
}
