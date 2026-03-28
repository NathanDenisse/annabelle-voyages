"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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

function MediaSlide({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return (
      <div className="relative w-full h-full">
        <Image src={item.url} alt="" fill className="object-contain" sizes="100vw" />
      </div>
    );
  }
  if (item.platform === "mp4") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <video src={item.url} autoPlay loop playsInline controls className="max-w-full max-h-full rounded-xl" />
      </div>
    );
  }
  const videoId = getYouTubeId(item.url);
  const isShort = detectVideoSource(item.url) === "youtube-short";
  if (!videoId) return null;
  return (
    <div className={`relative mx-auto ${isShort ? "w-full max-w-xs aspect-[9/16]" : "w-full max-w-5xl aspect-video"}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-xl border-none"
      />
    </div>
  );
}

// Inner component — only rendered when items.length > 0
function LightboxCarousel({ items, initialIndex, title, description, onClose }: Required<MediaLightboxProps>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialIndex });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe-down-to-close — native capture listeners to fire before Embla
  const dragY = useMotionValue(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0, startX = 0, isVertical = false, determined = false;

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      isVertical = false;
      determined = false;
      dragY.set(0);
    };
    const onMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (!determined && (Math.abs(dy) > 8 || Math.abs(dx) > 8)) {
        determined = true;
        isVertical = dy > 0 && Math.abs(dy) > Math.abs(dx);
      }
      if (isVertical) dragY.set(Math.max(0, dy));
    };
    const onEnd = () => {
      if (isVertical && dragY.get() > 100) {
        onClose();
      } else {
        animate(dragY, 0, { type: "spring", stiffness: 400, damping: 35 });
      }
      isVertical = false;
      determined = false;
    };

    el.addEventListener("touchstart", onStart, { passive: true, capture: true });
    el.addEventListener("touchmove", onMove, { passive: true, capture: true });
    el.addEventListener("touchend", onEnd, { capture: true });
    return () => {
      el.removeEventListener("touchstart", onStart, { capture: true });
      el.removeEventListener("touchmove", onMove, { capture: true });
      el.removeEventListener("touchend", onEnd, { capture: true });
    };
  }, [dragY, onClose]);

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
    <motion.div
      ref={containerRef}
      style={{ y: dragY }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="font-sans text-xs text-white/50">
          {items.length > 1 ? `${currentIndex + 1} / ${items.length}` : ""}
        </span>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <X size={22} />
        </button>
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {items.map((item, idx) => (
              <div key={idx} className="flex-none w-full h-full flex items-center justify-center px-4 py-2">
                <MediaSlide item={item} />
              </div>
            ))}
          </div>
        </div>

        {items.length > 1 && (
          <>
            <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ChevronLeft size={24} />
            </button>
            <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-6 py-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif italic text-xl text-white">{title}</h3>
        {description && <p className="font-sans text-sm text-white/50 mt-1 line-clamp-2">{description}</p>}
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
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <X size={22} />
        </button>
        <p className="font-serif italic text-xl text-white/60">{title}</p>
        {description && <p className="font-sans text-sm text-white/30 mt-2 max-w-sm text-center">{description}</p>}
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
