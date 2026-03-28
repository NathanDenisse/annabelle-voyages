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
      className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${
        light
          ? "text-brown-400 opacity-50 hover:opacity-90"
          : "text-white/40 hover:text-white/70"
      }`}
    >
      <span className="font-sans text-[10px] uppercase tracking-[0.3em]">{text}</span>
      <ChevronDown size={14} className="animate-bounce" />
    </button>
  );
}
