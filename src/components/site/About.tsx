"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import { Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { SiteContent, SocialLinks } from "@/types";
import ScrollTeaser from "./ScrollTeaser";

interface AboutProps {
  content: SiteContent;
  aboutImageUrl?: string;
  socials?: SocialLinks;
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34v-6.9a8.17 8.17 0 004.77 1.52V6.47a4.85 4.85 0 01-1-.22z" />
    </svg>
  );
}

export default function About({ content, aboutImageUrl, socials }: AboutProps) {
  const { lang } = useLanguage();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const stats = [
    { value: content.stats.countries, label: t(content.statsLabels.countries, lang), suffix: "" },
    { value: content.stats.followers, label: t(content.statsLabels.followers, lang), suffix: "+" },
    { value: content.stats.collaborations, label: t(content.statsLabels.collaborations, lang), suffix: "" },
  ];

  const imageSrc = aboutImageUrl || "/images/placeholders/about.svg";

  return (
    <section id="about" className="py-14 md:py-20 overflow-hidden relative bg-gradient-to-br from-cream-100 via-blush-100 to-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={sectionRef}
          className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-start"
        >
          {/* Image */}
          <div className={`md:col-span-2 relative transition-all duration-700 ease-out ${
            isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          }`}>
            <div className="relative aspect-[4/5] max-h-[400px] md:max-h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={imageSrc}
                alt="Annabelle Cathala"
                fill
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Floating badge */}
            <div className={`absolute -bottom-5 -right-4 md:-right-8 bg-white rounded-2xl px-5 py-3 shadow-xl border border-blush-100 -rotate-6 transition-all duration-500 delay-300 ${
              isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}>
              <p className="font-script text-2xl text-terracotta-500">Dublin, Ireland</p>
            </div>
          </div>

          {/* Text content */}
          <div className={`md:col-span-3 transition-all duration-700 delay-200 ease-out ${
            isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
          }`}>
            <p className="font-sans text-xs font-medium text-terracotta-500 tracking-[0.4em] uppercase mb-4">
              {t(content.aboutTitle, lang)}
            </p>

            <h2 className="font-serif italic font-normal text-5xl md:text-6xl text-brown-900 leading-none mb-6">
              Annabelle
            </h2>

            <p className="font-sans text-brown-600 leading-relaxed text-base mb-6">
              {t(content.aboutBio, lang)}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-blush-200 mb-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`text-center transition-all duration-500 ease-out ${
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${400 + i * 100}ms` }}
                >
                  <p className="font-serif text-3xl md:text-4xl font-medium text-terracotta-500">
                    {stat.value.toLocaleString()}{stat.suffix}
                  </p>
                  <p className="font-sans text-xs text-brown-400 mt-1 leading-snug">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Follow CTA */}
            {socials && (socials.instagram || socials.youtube || socials.tiktok) && (
              <div className="flex items-center gap-3">
                {socials.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-brown-900 hover:bg-terracotta-500 active:bg-terracotta-600 text-white font-sans text-sm font-medium px-5 py-2.5 rounded-full transition-colors duration-300"
                  >
                    <Instagram size={15} />
                    {lang === "fr" ? "Me suivre" : "Follow me"}
                  </a>
                )}
                {socials.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full border border-blush-200 text-brown-500 hover:text-terracotta-500 hover:border-terracotta-300 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube size={16} />
                  </a>
                )}
                {socials.tiktok && (
                  <a
                    href={socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full border border-blush-200 text-brown-500 hover:text-terracotta-500 hover:border-terracotta-300 transition-colors"
                    aria-label="TikTok"
                  >
                    <TikTokIcon size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teaser */}
      <div className="relative z-10 flex justify-center pt-10 pb-6">
        <ScrollTeaser textFr="Découvrir mon travail ↓" textEn="Discover my work ↓" target="#portfolio" light />
      </div>
    </section>
  );
}
