"use client";

import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { SiteContent, SocialLinks } from "@/types";

interface FooterProps {
  content: SiteContent;
  socials: SocialLinks;
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34v-6.9a8.17 8.17 0 004.77 1.52V6.47a4.85 4.85 0 01-1-.22z" />
    </svg>
  );
}

export default function Footer({ content, socials }: FooterProps) {
  const { lang } = useLanguage();

  return (
    <footer className="bg-[#1A1210] text-white/60 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Brand */}
          <div className="text-center">
            <h3 className="font-serif italic font-normal text-3xl text-white/90 leading-none">
              Annabelle
            </h3>
            <p className="font-sans font-light text-xs text-white/40 tracking-[0.5em] uppercase mt-1">
              Voyage
            </p>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-5">
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors hover:scale-110 transform duration-200"
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
                className="hover:text-white transition-colors hover:scale-110 transform duration-200"
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
                className="hover:text-white transition-colors hover:scale-110 transform duration-200"
                aria-label="TikTok"
              >
                <TikTokIcon size={18} />
              </a>
            )}
          </div>

          {/* Copyright */}
          <p className="font-sans text-sm text-white/40">
            {t(content.footerText, lang)}
          </p>

          {/* Admin link (discreet) */}
          <Link
            href="/admin"
            className="font-sans text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
