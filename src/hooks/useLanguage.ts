"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Language } from "@/types";

export const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
}>({ lang: "en", setLang: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useLanguageState() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("av_lang") as Language | null;
    if (stored === "fr" || stored === "en") {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("av_lang", l);
  };

  return { lang, setLang };
}
