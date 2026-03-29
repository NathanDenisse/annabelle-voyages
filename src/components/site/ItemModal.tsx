"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GalleryHorizontal, LayoutGrid, X } from "lucide-react";
import { animate, motion, useMotionValue } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { MediaItem } from "@/types";
import { detectVideoSource, getYouTubeId } from "@/lib/storage";
import { useLanguage } from "@/hooks/useLanguage";

interface ItemModalProps {
  title: string;
  description?: string;
  location?: string;
  categoryLabel?: string;
  gallery: MediaItem[];
  onClose: () => void;
}

type ViewMode = "scroll" | "grid";

export default function ItemModal({
  title,
  description,
  location,
  categoryLabel,
  gallery,
  onClose,
}: ItemModalProps) {
  const { lang } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [scrollIndex, setScrollIndex] = useState(0);
  const dragY = useMotionValue(0);
  const closing = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Swipe-down-to-close (mobile) — only when scrolled to top
  useEffect(() => {
    let startY = 0, startX = 0, determined = false, isVertical = false;

    const onStart = (e: TouchEvent) => {
      if (closing.current) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      determined = false;
      isVertical = false;
    };

    const onMove = (e: TouchEvent) => {
      if (closing.current) return;
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (!determined && (Math.abs(dy) > 8 || Math.abs(dx) > 8)) {
        determined = true;
        isVertical = scrollTop === 0 && dy > 0 && Math.abs(dy) > Math.abs(dx);
      }
      if (isVertical) dragY.set(Math.max(0, dy));
    };

    const onEnd = () => {
      if (closing.current) return;
      if (isVertical && dragY.get() > 150) {
        closing.current = true;
        animate(dragY, window.innerHeight, { duration: 0.25, ease: "easeOut", onComplete: onClose });
      } else {
        animate(dragY, 0, { type: "spring", stiffness: 400, damping: 35 });
      }
      determined = false;
      isVertical = false;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragY, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        style={{ y: dragY }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 bg-[#120E0C] flex flex-col"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-0 md:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#120E0C]/95 backdrop-blur-sm border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 id="item-modal-title" className="font-serif italic text-xl md:text-2xl text-white leading-tight">{title}</h2>
            {description && (
              <p className="font-sans text-xs text-white/50 mt-1 truncate">{description}</p>
            )}
            {(location || categoryLabel) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {location && (
                  <span className="font-sans text-[11px] text-white/40 bg-white/8 border border-white/10 px-2.5 py-0.5 rounded-full">
                    {location}
                  </span>
                )}
                {categoryLabel && (
                  <span className="font-sans text-[11px] text-white/40 bg-white/8 border border-white/10 px-2.5 py-0.5 rounded-full">
                    {categoryLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
            {gallery.length > 0 && (
              <span className="font-sans text-xs text-white/50 bg-white/10 px-2.5 py-1 rounded-full">
                {gallery.length} {lang === "fr" ? (gallery.length > 1 ? "médias" : "média") : "media"}
              </span>
            )}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setViewMode("scroll")}
                  aria-label="Scroll view"
                  className={`p-2 rounded-full transition-colors ${viewMode === "scroll" ? "bg-white/25 text-white" : "bg-white/10 text-white/40 hover:bg-white/15 hover:text-white/70"}`}
                >
                  <GalleryHorizontal size={16} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`p-2 rounded-full transition-colors ${viewMode === "grid" ? "bg-white/25 text-white" : "bg-white/10 text-white/40 hover:bg-white/15 hover:text-white/70"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        {gallery.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <p className="font-serif italic text-white/30 text-lg">
              {lang === "fr" ? "Aucun média disponible" : "No media available"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <GridView
            gallery={gallery}
            scrollRef={scrollRef}
            activeIndex={scrollIndex}
            onSelect={(idx) => { setScrollIndex(idx); setViewMode("scroll"); }}
          />
        ) : (
          <EmblaScrollView
            gallery={gallery}
            startIndex={scrollIndex}
            onIndexChange={setScrollIndex}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Grid View ──────────────────────────────────────────────────────────────────

function GridView({
  gallery,
  scrollRef,
  activeIndex,
  onSelect,
}: {
  gallery: MediaItem[];
  scrollRef: React.RefObject<HTMLDivElement>;
  activeIndex: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
        {gallery.map((item, idx) => (
          <GridThumb key={idx} item={item} isActive={idx === activeIndex} onClick={() => onSelect(idx)} />
        ))}
      </div>
    </div>
  );
}

function GridThumb({ item, isActive, onClick }: { item: MediaItem; isActive: boolean; onClick: () => void }) {
  const thumbnail = (() => {
    if (item.type === "image") return item.url;
    if (item.platform === "mp4") return item.thumbnailUrl ?? null;
    const id = getYouTubeId(item.url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  })();

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-square rounded-xl overflow-hidden bg-white/5 transition-all duration-200 focus:outline-none ${
        isActive
          ? "ring-2 ring-white/60 scale-[1.02]"
          : "hover:ring-2 hover:ring-white/30"
      }`}
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt="Media thumbnail"
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white/60 ml-0.5" />
          </div>
        </div>
      )}
      {/* Play indicator overlay for videos */}
      {item.type === "video" && thumbnail && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white ml-0.5" />
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Embla Scroll View ──────────────────────────────────────────────────────────

function EmblaScrollView({
  gallery,
  startIndex,
  onIndexChange,
}: {
  gallery: MediaItem[];
  startIndex: number;
  onIndexChange: (idx: number) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex, align: "center" });
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Sync index from Embla
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setCurrentIndex(idx);
      onIndexChange(idx);
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") scrollNext();
      if (e.key === "ArrowLeft") scrollPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scrollPrev, scrollNext]);

  // Auto-scroll thumbnail strip to keep active thumb centered
  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const activeThumb = strip.children[currentIndex] as HTMLElement | undefined;
    if (activeThumb) {
      const stripRect = strip.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();
      const scrollLeft = strip.scrollLeft + (thumbRect.left - stripRect.left) - (stripRect.width / 2) + (thumbRect.width / 2);
      strip.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [currentIndex]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Embla carousel */}
      <div className="flex-1 relative min-h-0 flex items-center">
        {/* Prev button */}
        {gallery.length > 1 && (
          <button
            onClick={scrollPrev}
            aria-label="Previous"
            className="absolute left-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors hidden md:flex"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="w-full h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {gallery.map((item, idx) => (
              <div
                key={idx}
                className="flex-none w-full h-full flex items-center justify-center px-4 md:px-16"
              >
                <ScrollItem item={item} isActive={idx === currentIndex} />
              </div>
            ))}
          </div>
        </div>

        {/* Next button */}
        {gallery.length > 1 && (
          <button
            onClick={scrollNext}
            aria-label="Next"
            className="absolute right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors hidden md:flex"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Navigation indicator */}
      {gallery.length > 1 && (
        <div className="flex-shrink-0 py-3">
          {gallery.length <= 8 ? (
            /* Clickable dots for small galleries */
            <div className="flex items-center justify-center gap-2">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? "w-5 h-2 bg-white"
                      : "w-2 h-2 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          ) : (
            /* Thumbnail strip for large galleries */
            <div className="relative">
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#120E0C] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#120E0C] to-transparent z-10 pointer-events-none" />
              <div
                ref={thumbStripRef}
                className="flex gap-1.5 overflow-x-auto px-8 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {gallery.map((item, i) => (
                  <ThumbPill key={i} item={item} isActive={i === currentIndex} onClick={() => emblaApi?.scrollTo(i)} />
                ))}
              </div>
              <div className="text-center mt-2">
                <span className="font-sans text-xs text-white/30">
                  {currentIndex + 1} / {gallery.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Thumbnail pill for the strip ───────────────────────────────────────────────

function ThumbPill({ item, isActive, onClick }: { item: MediaItem; isActive: boolean; onClick: () => void }) {
  const thumbnail = (() => {
    if (item.type === "image") return item.url;
    if (item.platform === "mp4") return item.thumbnailUrl ?? null;
    const id = getYouTubeId(item.url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  })();

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
        isActive
          ? "w-12 h-12 ring-2 ring-white/80 scale-110"
          : "w-10 h-10 opacity-50 hover:opacity-80"
      }`}
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-white/10 flex items-center justify-center">
          <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-white/60 ml-0.5" />
        </div>
      )}
    </button>
  );
}

// ─── Scroll Item (single media) ─────────────────────────────────────────────────

function ScrollItem({ item, isActive }: { item: MediaItem; isActive: boolean }) {
  const [loaded, setLoaded] = useState(false);

  if (item.type === "image") {
    return (
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        {/* Shimmer placeholder */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-64 rounded-xl bg-white/5 animate-pulse" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt="Gallery image"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`max-w-full max-h-full object-contain rounded-xl select-none transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    );
  }

  if (item.platform === "mp4") {
    return (
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        <VideoWithLoader item={item} isActive={isActive} />
      </div>
    );
  }

  // YouTube
  const videoId = getYouTubeId(item.url);
  if (!videoId) return null;
  const isShort = detectVideoSource(item.url) === "youtube-short";
  return (
    <div
      className={`relative rounded-xl overflow-hidden w-full ${
        isShort ? "max-w-xs aspect-[9/16]" : "aspect-video"
      }`}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=${isActive ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-none"
      />
    </div>
  );
}

// ─── Video with loading spinner ─────────────────────────────────────────────────

function VideoWithLoader({ item, isActive }: { item: MediaItem; isActive: boolean }) {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        src={item.url}
        controls
        autoPlay={isActive}
        playsInline
        onCanPlay={() => setReady(true)}
        className={`max-w-full max-h-full rounded-xl transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
