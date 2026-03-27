"use client";

import { useState, useEffect } from "react";
import { Instagram, Youtube, ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { SiteContent, SocialLinks } from "@/types";

interface HeroProps {
  content: SiteContent;
  socials: SocialLinks;
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34v-6.9a8.17 8.17 0 004.77 1.52V6.47a4.85 4.85 0 01-1-.22z" />
    </svg>
  );
}

export default function Hero({ content, socials }: HeroProps) {
  const { lang } = useLanguage();
  const [ready, setReady] = useState(false);

  const videoUrl = content.heroVideoUrl || null;

  useEffect(() => {
    // 3s fallback — show content on dark bg if video too slow
    const fallback = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(fallback);
  }, []);

  const scrollToPortfolio = () => {
    document.querySelector("#portfolio")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-[#1A1210]">
      {/* ── Background ── */}
      <div className="absolute inset-0">
        {videoUrl && (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[800ms] ease-out ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Overlays */}
        <div className={`absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/60 transition-opacity duration-[800ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-0 bg-black/10 transition-opacity duration-[800ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* ── Content ── */}
      <div className={`relative z-10 text-center px-6 max-w-5xl mx-auto transition-all duration-700 ease-out ${
        ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}>
        <p className="font-sans text-xs text-white/50 uppercase tracking-[0.5em] mb-6 font-light">
          {lang === "fr" ? "Créatrice de contenu voyage" : "Travel content creator"}
        </p>

        <h1
          className="font-serif italic font-normal text-[5rem] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] text-white leading-none mb-1"
          style={{ textShadow: "0 4px 40px rgba(0,0,0,0.35), 0 1px 8px rgba(0,0,0,0.25)" }}
        >
          Annabelle
        </h1>
        <p
          className="font-sans font-light text-sm sm:text-base md:text-xl text-white/80 tracking-[0.55em] uppercase mb-10"
        >
          Voyage
        </p>

        <p className="font-sans text-base sm:text-lg text-white/75 font-light tracking-widest mb-10">
          {t(content.heroTagline, lang)}
        </p>

        <button
          onClick={scrollToPortfolio}
          className="inline-block bg-white/10 backdrop-blur-md border border-white/30 text-white font-sans font-medium px-9 py-4 rounded-full hover:bg-white/20 hover:border-white/50 active:bg-white/25 transition-all duration-300 tracking-wide text-sm"
        >
          {t(content.heroCta, lang)}
        </button>

        <div className="flex items-center justify-center gap-6 mt-10">
          {socials.instagram && (
            <a
              href={socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white active:text-white/90 transition-colors p-1"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
          )}
          {socials.youtube && (
            <a
              href={socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white active:text-white/90 transition-colors p-1"
              aria-label="YouTube"
            >
              <Youtube size={20} />
            </a>
          )}
          {socials.tiktok && (
            <a
              href={socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white active:text-white/90 transition-colors p-1"
              aria-label="TikTok"
            >
              <TikTokIcon size={18} />
            </a>
          )}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <button
        onClick={scrollToPortfolio}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-all duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-sans text-xs tracking-widest uppercase">
          {lang === "fr" ? "Défiler" : "Scroll"}
        </span>
        <ChevronDown size={18} className="animate-bounce" />
      </button>
    </section>
  );
}
