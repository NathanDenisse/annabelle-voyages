"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import { MapPin } from "lucide-react";
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

  return (
    <section
      ref={sectionRef}
      id="next-trip"
      className="relative w-full min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0E7C7B" }}
    >
      {/* Background video */}
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

      {/* Overlay flat */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      {/* Overlay gradient — profondeur */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Content */}
      <div
        ref={contentRef}
        className={`relative z-10 text-center px-6 max-w-3xl mx-auto py-16 transition-all duration-700 ease-out ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Label */}
        <p className="font-sans text-xs font-light text-white/50 tracking-[0.5em] uppercase mb-5">
          {lang === "fr" ? "Prochaine destination" : "Next destination"}
        </p>

        {/* Destination */}
        <h2
          className="font-serif italic font-semibold text-6xl md:text-8xl lg:text-9xl text-white leading-none mb-2"
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
        >
          {t(data.destination, lang)}
        </h2>

        {/* Period */}
        <p className="font-sans font-light text-xl md:text-2xl text-white/90 tracking-widest uppercase mb-8">
          {t(data.period, lang)}
        </p>

        {/* Places pills */}
        {data.places.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {data.places.map((place) => (
              <span
                key={place}
                className="flex items-center gap-1.5 font-sans text-sm text-white/90 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 px-5 py-2 rounded-full transition-colors duration-200"
              >
                <MapPin size={11} className="flex-shrink-0 opacity-70" />
                {place}
              </span>
            ))}
          </div>
        )}

        {/* Pitch */}
        <p className="font-sans text-lg font-light text-white/80 leading-relaxed max-w-lg mx-auto mt-8 mb-10">
          {t(data.pitch, lang)}
        </p>

        {/* CTA */}
        <button
          onClick={scrollToContact}
          className="inline-block bg-terracotta-500 hover:bg-terracotta-400 active:bg-terracotta-600 text-white font-sans font-medium px-10 py-4 rounded-full text-base tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {lang === "fr" ? "Me contacter" : "Get in touch"}
        </button>
      </div>
    </section>
  );
}
