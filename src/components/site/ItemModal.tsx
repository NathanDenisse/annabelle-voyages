"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { motion, animate, useMotionValue, AnimatePresence } from "framer-motion";
import { MediaItem } from "@/types";
import { getYouTubeId, detectVideoSource } from "@/lib/storage";
import MediaLightbox from "./MediaLightbox";

interface ItemModalProps {
  title: string;
  description?: string;
  location?: string;
  categoryLabel?: string;
  gallery: MediaItem[];
  onClose: () => void;
}

export default function ItemModal({
  title,
  description,
  location,
  categoryLabel,
  gallery,
  onClose,
}: ItemModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const dragY = useMotionValue(0);
  const closing = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<number | null>(null);
  lightboxRef.current = lightboxIndex;

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape key — only close modal if lightbox is not open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxRef.current === null) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Swipe-down-to-close (mobile) — only when scrolled to top
  useEffect(() => {
    let startY = 0, startX = 0, determined = false, isVertical = false;

    const onStart = (e: TouchEvent) => {
      if (closing.current || lightboxRef.current !== null) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      determined = false;
      isVertical = false;
    };

    const onMove = (e: TouchEvent) => {
      if (closing.current || lightboxRef.current !== null) return;
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
      if (closing.current || lightboxRef.current !== null) return;
      if (isVertical && dragY.get() > 150) {
        closing.current = true;
        animate(dragY, window.innerHeight, {
          duration: 0.25,
          ease: "easeOut",
          onComplete: onClose,
        });
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
    <>
      {/* Fullscreen backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95"
        onClick={onClose}
      >
        {/* Modal panel — fullscreen */}
        <motion.div
          style={{ y: dragY }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-[#120E0C] flex flex-col"
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-0 md:hidden flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-[#120E0C]/95 backdrop-blur-sm border-b border-white/10 px-5 py-4 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="font-serif italic text-xl md:text-2xl text-white leading-tight">
                {title}
              </h2>
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
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Scrollable media grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
            {gallery.length > 0 ? (
              <div className="p-4 columns-1 md:columns-2 lg:columns-3 gap-4">
                {gallery.map((item, idx) => (
                  <div key={idx} className="break-inside-avoid mb-4">
                    <MediaGridItem
                      item={item}
                      onClick={item.type === "image" ? () => setLightboxIndex(idx) : undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12">
                <p className="font-serif italic text-white/30 text-lg">Aucun média disponible</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Fullscreen zoom lightbox (images only) */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <MediaLightbox
            items={gallery}
            initialIndex={lightboxIndex}
            title={title}
            description={description}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function MediaGridItem({
  item,
  onClick,
}: {
  item: MediaItem;
  onClick?: () => void;
}) {
  if (item.type === "image") {
    return (
      <div
        onClick={onClick}
        className={`rounded-xl overflow-hidden bg-black/20 ${onClick ? "cursor-zoom-in" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="w-full h-auto block" loading="lazy" />
      </div>
    );
  }

  if (item.platform === "mp4") {
    return (
      <div className="rounded-xl overflow-hidden bg-black/40">
        <video
          src={item.url}
          controls
          playsInline
          className="w-full h-auto block"
        />
      </div>
    );
  }

  // YouTube
  const videoId = getYouTubeId(item.url);
  if (!videoId) return null;
  const isShort = detectVideoSource(item.url) === "youtube-short";
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-black/40 ${
        isShort ? "aspect-[9/16]" : "aspect-video"
      }`}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&playsinline=1`}
        allow="encrypted-media; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-none"
      />
    </div>
  );
}
