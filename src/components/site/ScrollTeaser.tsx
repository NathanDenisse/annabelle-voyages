"use client";

import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ScrollTeaserProps {
  textFr: string;
  textEn: string;
  target: string;
  light?: boolean;
}

export default function ScrollTeaser({ textFr, textEn, target, light = true }: ScrollTeaserProps) {
  const { lang } = useLanguage();
  const text = lang === "fr" ? textFr : textEn;

  const handleClick = () => {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      onClick={handleClick}
      aria-label={text}
      className={`flex flex-col items-center gap-1 transition-opacity duration-300 ${
        light
          ? "text-brown-400 opacity-30 hover:opacity-60"
          : "text-white/30 hover:text-white/60"
      }`}
    >
      <span className="font-sans text-[10px] uppercase tracking-[0.3em] font-light">{text}</span>
      <ChevronDown size={12} className="animate-bounce-subtle" />
    </button>
  );
}
