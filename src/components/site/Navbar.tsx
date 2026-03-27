"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { navLabels } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";

const navItems = [
  { key: "about", href: "#about" },
  { key: "portfolio", href: "#portfolio" },
  { key: "partnerships", href: "#partnerships" },
  { key: "contact", href: "#contact" },
] as const;

export default function Navbar() {
  const { lang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brown-900/60 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Brand */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-white hover:text-white/80 transition-colors leading-none text-left"
            >
              <span className="block font-serif italic font-normal text-xl md:text-2xl leading-none">Annabelle</span>
              <span className="block font-sans font-light text-[9px] tracking-[0.4em] uppercase mt-0.5 text-white/50">
                Voyage
              </span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-sans font-medium text-white/80 hover:text-white transition-colors tracking-wide"
                >
                  {navLabels[item.key][lang]}
                </button>
              ))}
              <LanguageToggle />
            </div>

            {/* Mobile: Language + Burger */}
            <div className="flex md:hidden items-center gap-3">
              <LanguageToggle />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-white hover:text-white/80 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-brown-900/95 backdrop-blur-md border-b border-white/10 md:hidden">
          <div className="flex flex-col py-4 px-6 gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.href)}
                className="text-left py-3 text-base font-sans font-medium text-white/80 hover:text-white transition-colors border-b border-white/10 last:border-0"
              >
                {navLabels[item.key][lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
