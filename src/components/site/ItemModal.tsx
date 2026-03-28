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
  const modalRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<number | null>(null);
  lightboxRef.current = lightboxIndex;

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
      const scrollTop = modalRef.current?.scrollTop ?? 0;
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
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-[5%]"
        onClick={onClose}
      >
        {/* Modal card */}
        <motion.div
          style={{ y: dragY }}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2 }}
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full bg-[#1A1210] rounded-2xl overflow-y-auto flex flex-col"
        >
          {/* Drag handle (mobile hint) */}
          <div className="flex justify-center pt-3 pb-0 md:hidden flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-[#1A1210]/95 backdrop-blur-sm border-b border-white/10 px-5 py-4 flex items-center justify-between gap-4 flex-shrink-0">
            <h2 className="font-serif italic text-2xl text-white leading-tight line-clamp-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Meta: description + location + category pills */}
          {(description || location || categoryLabel) && (
            <div className="px-5 pt-4 pb-2 space-y-3 flex-shrink-0">
              {description && (
                <p className="font-sans text-sm text-white/60 leading-relaxed">{description}</p>
              )}
              {(location || categoryLabel) && (
                <div className="flex flex-wrap gap-2">
                  {location && (
                    <span className="font-sans text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">
                      {location}
                    </span>
                  )}
                  {categoryLabel && (
                    <span className="font-sans text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">
                      {categoryLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Media grid */}
          {gallery.length > 0 ? (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {gallery.map((item, idx) => (
                <MediaGridItem
                  key={idx}
                  item={item}
                  onClick={item.type === "image" ? () => setLightboxIndex(idx) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <p className="font-serif italic text-white/30 text-lg">Aucun média disponible</p>
            </div>
          )}
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
        <img src={item.url} alt="" className="w-full h-auto block" />
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
