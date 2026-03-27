"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Testimonial } from "@/types";

interface TestimonialsProps {
  items: Testimonial[];
}

function QuoteIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-terracotta-300">
      <path d="M0 20V12.4C0 8.93333 0.8 6.06667 2.4 3.8C4.06667 1.53333 6.46667 0.133333 9.6 0L10.8 2.6C8.6 3 6.93333 3.93333 5.8 5.4C4.73333 6.8 4.2 8.46667 4.2 10.4H8V20H0ZM16 20V12.4C16 8.93333 16.8 6.06667 18.4 3.8C20.0667 1.53333 22.4667 0.133333 25.6 0L26.8 2.6C24.6 3 22.9333 3.93333 21.8 5.4C20.7333 6.8 20.2 8.46667 20.2 10.4H24V20H16Z" fill="currentColor"/>
    </svg>
  );
}

function TestimonialCard({ item, lang }: { item: Testimonial; lang: "fr" | "en" }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm border border-[#E8D8D0]/60 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 h-full">
      <QuoteIcon />
      <p className="font-serif italic text-base sm:text-lg text-brown-800 leading-relaxed flex-1">
        &ldquo;{t(item.text, lang)}&rdquo;
      </p>
      <p className="font-sans text-xs text-terracotta-500 font-medium tracking-wide uppercase">
        {t(item.role, lang)}
      </p>
    </div>
  );
}

export default function Testimonials({ items }: TestimonialsProps) {
  const { lang } = useLanguage();
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-80px" });

  const autoScrollPlugin = useRef(AutoScroll({
    speed: 0.9,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
    startDelay: 0,
  })).current;

  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    [autoScrollPlugin]
  );

  const visible = items.filter((item) => item.visible);
  if (visible.length === 0) return null;

  return (
    <section id="testimonials" className="py-24 md:py-32 overflow-hidden bg-[#F8F0EB]">
      {/* Header */}
      <div
        ref={headerRef}
        className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14 transition-all duration-700 ease-out ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="font-sans text-xs font-medium text-terracotta-500 tracking-[0.4em] uppercase mb-3">
          {lang === "fr" ? "Témoignages" : "Testimonials"}
        </p>
        <h2 className="font-script text-5xl md:text-6xl text-brown-900 mb-3">
          {lang === "fr" ? "Ce qu'ils en disent" : "What they say"}
        </h2>
        <p className="font-sans text-sm text-brown-400 font-light">
          {lang === "fr"
            ? "Retours de partenaires et collaborateurs"
            : "Feedback from partners and collaborators"}
        </p>
        <div className={`w-16 h-px bg-terracotta-400 mx-auto mt-4 transition-all duration-700 delay-300 ${isInView ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex items-stretch">
          {visible.map((item) => (
            <div key={item.id} className="flex-none w-[85%] sm:w-[46%] lg:w-[32%] px-2.5">
              <TestimonialCard item={item} lang={lang} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
