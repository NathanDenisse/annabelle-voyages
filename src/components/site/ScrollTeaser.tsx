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
          ? "text-brown-700 opacity-60 hover:opacity-90"
          : "text-white/70 hover:text-white/90"
      }`}
    >
      <span className="font-sans text-xs uppercase tracking-widest font-light">{text}</span>
      <ChevronDown size={13} className="animate-bounce-subtle" />
    </button>
  );
}
