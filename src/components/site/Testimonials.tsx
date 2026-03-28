"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Testimonial } from "@/types";
import ScrollTeaser from "./ScrollTeaser";

interface TestimonialsProps {
  items: Testimonial[];
}

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < rating ? "#D4A574" : "none"}
            stroke="#D4A574"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function QuoteWatermark() {
  return (
    <svg width="80" height="58" viewBox="0 0 28 20" fill="currentColor" aria-hidden="true">
      <path d="M0 20V12.4C0 8.93333 0.8 6.06667 2.4 3.8C4.06667 1.53333 6.46667 0.133333 9.6 0L10.8 2.6C8.6 3 6.93333 3.93333 5.8 5.4C4.73333 6.8 4.2 8.46667 4.2 10.4H8V20H0ZM16 20V12.4C16 8.93333 16.8 6.06667 18.4 3.8C20.0667 1.53333 22.4667 0.133333 25.6 0L26.8 2.6C24.6 3 22.9333 3.93333 21.8 5.4C20.7333 6.8 20.2 8.46667 20.2 10.4H24V20H16Z" />
    </svg>
  );
}

function TestimonialCard({ item, lang }: { item: Testimonial; lang: "fr" | "en" }) {
  return (
    <div className="relative bg-white/80 backdrop-blur-sm border border-[#E8D8D0]/50 rounded-2xl p-8 flex flex-col gap-5 h-full shadow-lg shadow-[#C4917B]/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#C4917B]/15 transition-all duration-300 overflow-hidden">
      {/* Watermark guillemet */}
      <div className="absolute top-4 right-5 text-terracotta-400 opacity-[0.10] pointer-events-none select-none">
        <QuoteWatermark />
      </div>

      {/* Étoiles */}
      <StarRating rating={item.rating ?? 5} />

      {/* Citation */}
      <p className="font-serif italic text-base sm:text-lg text-brown-800 leading-relaxed flex-1">
        «&nbsp;{t(item.text, lang)}&nbsp;»
      </p>

      {/* Séparateur */}
      <hr className="border-[#E8D8D0]/70" />

      {/* Rôle */}
      <p className="font-sans text-xs text-terracotta-500 font-medium tracking-[0.2em] uppercase">
        {t(item.role, lang)}
      </p>
    </div>
  );
}

function DesktopGrid({ items, lang }: { items: Testimonial[]; lang: "fr" | "en" }) {
  const gridRef = useRef(null);
  const isInView = useInView(gridRef, { once: true, margin: "-80px" });

  return (
    <div ref={gridRef} className="grid grid-cols-3 gap-6 items-stretch">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`transition-all duration-700 ease-out`}
          style={{
            transitionDelay: `${i * 100}ms`,
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <TestimonialCard item={item} lang={lang} />
        </div>
      ))}
    </div>
  );
}

function MobileCarousel({ items, lang }: { items: Testimonial[]; lang: "fr" | "en" }) {
  const autoScrollPlugin = useRef(AutoScroll({
    speed: 0.6,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
    startDelay: 0,
  })).current;

  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true, active: true },
    [autoScrollPlugin]
  );

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex items-stretch">
        {items.map((item) => (
          <div key={item.id} className="flex-none w-[88%] sm:w-[50%] px-2.5">
            <TestimonialCard item={item} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Testimonials({ items }: TestimonialsProps) {
  const { lang } = useLanguage();
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });

  const visible = items.filter((item) => item.visible);
  if (visible.length === 0) return null;

  return (
    <section id="testimonials" className="relative py-12 md:py-16 bg-[#F8F0EB]">
      {/* Header */}
      <div
        ref={headerRef}
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6 transition-all duration-700 ease-out ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="font-sans text-xs font-light text-terracotta-400 tracking-[0.5em] uppercase mb-5">
          {lang === "fr" ? "Témoignages" : "Testimonials"}
        </p>
        <h2 className="font-serif italic font-normal text-4xl md:text-6xl text-brown-900 mb-5">
          {lang === "fr" ? "Ce qu'ils en disent" : "What they say"}
        </h2>
        <p className="font-sans text-brown-400 max-w-xl mx-auto text-sm leading-relaxed">
          {lang === "fr"
            ? "Retours de partenaires et collaborateurs qui ont travaillé avec moi."
            : "Feedback from partners and collaborators who worked with me."}
        </p>
        <div className={`w-16 h-px bg-terracotta-400 mx-auto mt-5 transition-all duration-700 delay-300 ${isInView ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
      </div>

      {/* Desktop: grille 3 colonnes */}
      <div className="hidden lg:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <DesktopGrid items={visible} lang={lang} />
      </div>

      {/* Mobile/tablette: carousel */}
      <div className="lg:hidden overflow-hidden">
        <MobileCarousel items={visible} lang={lang} />
      </div>

      {/* Gradient transition → NextTrip */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-b from-transparent to-[#0E7C7B] pointer-events-none" />

      {/* Teaser */}
      <div className="relative z-10 flex justify-center pt-10 pb-6">
        <ScrollTeaser textFr="Prochaine aventure ↓" textEn="Next adventure ↓" target="#next-trip" light />
      </div>
    </section>
  );
}
