"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { NextTrip as NextTripType } from "@/types";

interface NextTripProps {
  data: NextTripType;
}

export default function NextTrip({ data }: NextTripProps) {
  const { lang } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true, margin: "-60px" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !data.backgroundVideoUrl) return;
    const tryPlay = () => { video.muted = true; video.play().catch(() => {}); };
    tryPlay();
    const t1 = setTimeout(tryPlay, 500);
    const onVisibility = () => { if (document.visibilityState === "visible") tryPlay(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearTimeout(t1); document.removeEventListener("visibilitychange", onVisibility); };
  }, [data.backgroundVideoUrl]);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    const onTouch = () => { video.muted = true; video.play().catch(() => {}); };
    section.addEventListener("touchstart", onTouch, { passive: true });
    return () => section.removeEventListener("touchstart", onTouch);
  }, []);

  if (!data.visible) return null;

  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const bgColor = "#0E7C7B";

  return (
    <section
      ref={sectionRef}
      id="next-trip"
      className="relative w-full py-20 md:py-28 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background video — always in DOM so the ref is available on mount */}
      <video
        ref={videoRef}
        src={data.backgroundVideoUrl || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        {...{ "webkit-playsinline": "true" }}
        onCanPlay={() => setVideoReady(true)}
        onPlaying={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[800ms] ease-out ${
          videoReady && data.backgroundVideoUrl ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      {/* Content */}
      <div
        ref={contentRef}
        className={`relative z-10 text-center px-6 max-w-3xl mx-auto transition-all duration-700 ease-out ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Label */}
        <p className="font-sans text-xs font-light text-white/50 tracking-[0.5em] uppercase mb-5">
          {lang === "fr" ? "Prochaine destination" : "Next destination"}
        </p>

        {/* Destination */}
        <h2 className="font-serif italic font-normal text-5xl md:text-7xl text-white leading-none mb-3"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          {t(data.destination, lang)}
        </h2>

        {/* Period */}
        <p className="font-sans font-light text-base text-white/70 tracking-widest uppercase mb-8">
          {t(data.period, lang)}
        </p>

        {/* Places pills */}
        {data.places.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {data.places.map((place) => (
              <span
                key={place}
                className="font-sans text-xs text-white/80 border border-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
              >
                {place}
              </span>
            ))}
          </div>
        )}

        {/* Pitch */}
        <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed max-w-lg mx-auto mb-10">
          {t(data.pitch, lang)}
        </p>

        {/* CTA */}
        <button
          onClick={scrollToContact}
          className="inline-block bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white font-sans font-medium px-8 py-3.5 rounded-full transition-colors duration-300 text-sm tracking-wide"
        >
          {lang === "fr" ? "Me contacter" : "Get in touch"}
        </button>
      </div>
    </section>
  );
}
