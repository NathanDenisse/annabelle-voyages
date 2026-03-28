"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GalleryHorizontal, LayoutGrid, X } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { MediaItem } from "@/types";
import { detectVideoSource, getYouTubeId } from "@/lib/storage";

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
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [scrollIndex, setScrollIndex] = useState(0);
  const dragY = useMotionValue(0);
  const closing = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(
    () => setScrollIndex((i) => (i + 1) % gallery.length),
    [gallery.length]
  );
  const goPrev = useCallback(
    () => setScrollIndex((i) => (i - 1 + gallery.length) % gallery.length),
    [gallery.length]
  );

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape + arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (viewMode === "scroll") {
        if (e.key === "ArrowRight") goNext();
        if (e.key === "ArrowLeft") goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, viewMode, goNext, goPrev]);

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
            <h2 className="font-serif italic text-xl md:text-2xl text-white leading-tight">{title}</h2>
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
                {gallery.length} média{gallery.length > 1 ? "s" : ""}
              </span>
            )}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setViewMode("scroll")}
                  title="Vue défilement"
                  className={`p-2 rounded-full transition-colors ${viewMode === "scroll" ? "bg-white/25 text-white" : "bg-white/10 text-white/40 hover:bg-white/15 hover:text-white/70"}`}
                >
                  <GalleryHorizontal size={16} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  title="Vue grille"
                  className={`p-2 rounded-full transition-colors ${viewMode === "grid" ? "bg-white/25 text-white" : "bg-white/10 text-white/40 hover:bg-white/15 hover:text-white/70"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        {gallery.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <p className="font-serif italic text-white/30 text-lg">Aucun média disponible</p>
          </div>
        ) : viewMode === "grid" ? (
          <GridView
            gallery={gallery}
            scrollRef={scrollRef}
            onSelect={(idx) => { setScrollIndex(idx); setViewMode("scroll"); }}
          />
        ) : (
          <ScrollView
            gallery={gallery}
            index={scrollIndex}
            onNext={goNext}
            onPrev={goPrev}
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
  onSelect,
}: {
  gallery: MediaItem[];
  scrollRef: React.RefObject<HTMLDivElement>;
  onSelect: (idx: number) => void;
}) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
        {gallery.map((item, idx) => (
          <GridThumb key={idx} item={item} onClick={() => onSelect(idx)} />
        ))}
      </div>
    </div>
  );
}

function GridThumb({ item, onClick }: { item: MediaItem; onClick: () => void }) {
  const thumbnail = (() => {
    if (item.type === "image") return item.url;
    if (item.platform === "mp4") return item.thumbnailUrl ?? null;
    const id = getYouTubeId(item.url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  })();

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-xl overflow-hidden bg-white/5 hover:ring-2 hover:ring-white/30 transition-all focus:outline-none"
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
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
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white ml-0.5" />
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Scroll View ────────────────────────────────────────────────────────────────

function ScrollView({
  gallery,
  index,
  onNext,
  onPrev,
}: {
  gallery: MediaItem[];
  index: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const item = gallery[index];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNext();
      else onPrev();
    }
  };

  if (!item) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Media area */}
      <div
        className="flex-1 flex items-center justify-center min-h-0 relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {gallery.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors hidden md:flex"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full flex items-center justify-center px-4 md:px-16"
          >
            <ScrollItem item={item} />
          </motion.div>
        </AnimatePresence>

        {gallery.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-3 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors hidden md:flex"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Dots (≤8 items) or counter */}
      {gallery.length > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 py-4">
          {gallery.length <= 8 ? (
            gallery.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === index ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/25"
                }`}
              />
            ))
          ) : (
            <span className="font-sans text-sm text-white/40">
              {index + 1} / {gallery.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ScrollItem({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt=""
        className="max-w-full max-h-full object-contain rounded-xl"
        loading="lazy"
      />
    );
  }

  if (item.platform === "mp4") {
    return (
      <video
        src={item.url}
        controls
        autoPlay
        playsInline
        className="max-w-full max-h-full rounded-xl"
      />
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
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-none"
      />
    </div>
  );
}
