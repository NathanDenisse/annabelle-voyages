"use client";

import { useRef, useEffect, ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { MediaItem } from "@/types";
import { detectVideoSource } from "@/lib/storage";

// ─── Shared utilities ────────────────────────────────────────────────────────

export type CardFormat = "vertical" | "horizontal";

/** Derive card format from gallery[0] */
export function getMediaFormat(gallery: MediaItem[]): CardFormat {
  const first = gallery[0];
  if (!first) return "horizontal";
  if (first.format) return first.format;
  if (first.platform === "mp4") return "vertical";
  if (first.platform === "youtube") {
    return detectVideoSource(first.url) === "youtube-short" ? "vertical" : "horizontal";
  }
  return "horizontal";
}

// ─── Carousel component ──────────────────────────────────────────────────────

interface MediaCarouselProps<T> {
  items: T[];
  /** Render a single card. Called for every item. */
  renderCard: (item: T, format: CardFormat) => ReactNode;
  /** Extract gallery from item for format detection */
  getGallery: (item: T) => MediaItem[];
  /** Extract unique key from item */
  getKey: (item: T) => string;
  /** Extra deps that should trigger embla reInit (e.g. active filter) */
  reInitDeps?: unknown[];
}

/**
 * Shared carousel logic: desktop 3-col grid, mobile Embla auto-scroll.
 * Cards are rendered via renderCard prop so each section keeps its own card style.
 */
export default function MediaCarousel<T>({
  items,
  renderCard,
  getGallery,
  getKey,
  reInitDeps = [],
}: MediaCarouselProps<T>) {
  const isDesktop = useBreakpoint();

  const autoScrollPlugin = useRef(AutoScroll({
    speed: 0.8,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
    startDelay: 0,
  })).current;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true, active: !isDesktop },
    [autoScrollPlugin]
  );

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, isDesktop, ...reInitDeps]);

  if (items.length === 0) return null;

  if (isDesktop) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => renderCard(item, "horizontal"))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {items.map((item) => {
          const format = getMediaFormat(getGallery(item));
          return (
            <div key={getKey(item)} className={`flex-none px-1.5 ${format === "vertical" ? "w-[55%]" : "w-[80%]"}`}>
              {renderCard(item, format)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
