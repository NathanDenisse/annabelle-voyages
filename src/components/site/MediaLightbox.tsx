"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, animate, useMotionValue } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { MediaItem } from "@/types";
import { getYouTubeId, detectVideoSource } from "@/lib/storage";

interface MediaLightboxProps {
  items: MediaItem[];
  initialIndex?: number;
  title: string;
  description?: string;
  onClose: () => void;
}

// Using <img> (not Next.js Image) so the element naturally matches the image's
// intrinsic dimensions — allowing clicks on the surrounding black space to bubble
// up to the backdrop and close the lightbox.
function MediaSlide({ item }: { item: MediaItem }) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (item.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt=""
        draggable={false}
        onClick={stop}
        className="max-w-full max-h-full object-contain rounded-sm select-none"
      />
    );
  }

  if (item.platform === "mp4") {
    return (
      <div onClick={stop} className="max-w-full max-h-full">
        <video
          src={item.url}
          autoPlay loop playsInline controls
          className="max-w-full max-h-full rounded-xl"
        />
      </div>
    );
  }

  const videoId = getYouTubeId(item.url);
  const isShort = detectVideoSource(item.url) === "youtube-short";
  if (!videoId) return null;
  return (
    <div
      onClick={stop}
      className={`relative mx-auto ${isShort ? "w-full max-w-xs aspect-[9/16]" : "w-full max-w-5xl aspect-video"}`}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-xl border-none"
      />
    </div>
  );
}

function LightboxCarousel({ items, initialIndex, title, description, onClose }: Required<MediaLightboxProps>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialIndex });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const dragY = useMotionValue(0);
  const closing = useRef(false);

  // ── Swipe-down-to-close ──────────────────────────────────────────────────
  // Uses window-level capture listeners — fires before Embla and framer-motion,
  // regardless of which DOM element Embla has claimed.
  useEffect(() => {
    let startY = 0, startX = 0, isVertical = false, determined = false;

    const onStart = (e: TouchEvent) => {
      if (closing.current) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      isVertical = false;
      determined = false;
    };

    const onMove = (e: TouchEvent) => {
      if (closing.current) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (!determined && (Math.abs(dy) > 8 || Math.abs(dx) > 8)) {
        determined = true;
        isVertical = dy > 0 && Math.abs(dy) > Math.abs(dx);
      }
      if (isVertical) dragY.set(Math.max(0, dy));
    };

    const onEnd = () => {
      if (closing.current) return;
      if (isVertical && dragY.get() > 80) {
        closing.current = true;
        // Slide down then unmount
        animate(dragY, window.innerHeight, {
          duration: 0.22,
          ease: "easeOut",
          onComplete: onClose,
        });
      } else {
        animate(dragY, 0, { type: "spring", stiffness: 400, damping: 35 });
      }
      isVertical = false;
      determined = false;
    };

    window.addEventListener("touchstart", onStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onMove, { passive: true, capture: true });
    window.addEventListener("touchend", onEnd, { capture: true });
    return () => {
      window.removeEventListener("touchstart", onStart, { capture: true });
      window.removeEventListener("touchmove", onMove, { capture: true });
      window.removeEventListener("touchend", onEnd, { capture: true });
    };
  }, [dragY, onClose]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, scrollPrev, scrollNext]);

  return (
    // onClick={onClose} on the backdrop — clicks on the black space (outside
    // the media element itself) bubble up here and close the lightbox.
    // MediaSlide wraps each media with e.stopPropagation() so clicks on the
    // actual image/video do NOT close.
    <motion.div
      style={{ y: dragY }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col cursor-pointer"
      onClick={onClose}
    >
      {/* Top bar — stopPropagation so clicking counter/X doesn't double-fire */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-sans text-xs text-white/50 select-none">
          {items.length > 1 ? `${currentIndex + 1} / ${items.length}` : ""}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={22} />
        </button>
      </div>

      {/* Carousel — no stopPropagation: clicks in slide padding reach the backdrop */}
      <div className="flex-1 overflow-hidden relative cursor-default">
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex-none w-full h-full flex items-center justify-center px-4 py-2"
              >
                <MediaSlide item={item} />
              </div>
            ))}
          </div>
        </div>

        {items.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); scrollNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Bottom info — stopPropagation so clicking text doesn't close */}
      <div
        className="px-6 py-4 flex-shrink-0 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif italic text-xl text-white">{title}</h3>
        {description && (
          <p className="font-sans text-sm text-white/50 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function MediaLightbox({ items, initialIndex = 0, title, description, onClose }: MediaLightboxProps) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={22} />
        </button>
        <p className="font-serif italic text-xl text-white/60">{title}</p>
        {description && (
          <p className="font-sans text-sm text-white/30 mt-2 max-w-sm text-center">{description}</p>
        )}
      </motion.div>
    );
  }

  return (
    <LightboxCarousel
      items={items}
      initialIndex={initialIndex}
      title={title}
      description={description ?? ""}
      onClose={onClose}
    />
  );
}
