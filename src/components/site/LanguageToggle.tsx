"use client";

import { useLanguage } from "@/hooks/useLanguage";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-blush-100 rounded-full px-1 py-1">
      <button
        onClick={() => setLang("fr")}
        className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all duration-200 ${
          lang === "fr"
            ? "bg-white text-brown-900 shadow-sm"
            : "text-brown-500 hover:text-brown-700"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all duration-200 ${
          lang === "en"
            ? "bg-white text-brown-900 shadow-sm"
            : "text-brown-500 hover:text-brown-700"
        }`}
      >
        EN
      </button>
    </div>
  );
}
