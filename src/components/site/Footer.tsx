"use client";

import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { SiteContent, SocialLinks } from "@/types";
import TikTokIcon from "@/components/icons/TikTokIcon";

interface FooterProps {
  content: SiteContent;
  socials: SocialLinks;
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

          {/* Admin link — hidden, accessible via /admin URL directly */}
        </div>
      </div>
    </footer>
  );
}
