"use client";

import { lazy, Suspense, useEffect } from "react";
import { useSiteContent, useSocialLinks, usePortfolio, usePartnerships, useTestimonials, useNextTrip } from "@/hooks/useFirestore";
import { useLanguageState, LanguageContext } from "@/hooks/useLanguage";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";

function SectionSkeleton() {
  return (
    <div className="py-14 md:py-20 flex flex-col items-center gap-4">
      <div className="w-32 h-3 bg-brown-200/40 rounded-full animate-pulse" />
      <div className="w-48 h-8 bg-brown-200/30 rounded-lg animate-pulse" />
      <div className="w-full max-w-5xl mx-auto mt-8 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-[9/16] rounded-2xl bg-brown-200/20 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Below-fold sections — dynamically imported to reduce initial bundle
const Portfolio = lazy(() => import("@/components/site/Portfolio"));
const Partnerships = lazy(() => import("@/components/site/Partnerships"));
const Testimonials = lazy(() => import("@/components/site/Testimonials"));
const NextTrip = lazy(() => import("@/components/site/NextTrip"));
const Contact = lazy(() => import("@/components/site/Contact"));
const Footer = lazy(() => import("@/components/site/Footer"));

export default function Home() {
  const { lang, setLang } = useLanguageState();

  // Sync html lang attribute with user language preference
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const { content } = useSiteContent();
  const { socials } = useSocialLinks();
  const { items: portfolioItems } = usePortfolio();
  const { items: partnerships } = usePartnerships();
  const { items: testimonials } = useTestimonials();
  const { data: nextTrip } = useNextTrip();

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <main className="animate-fade-in">
        <a href="#portfolio" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-terracotta-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
          {lang === "fr" ? "Aller au contenu" : "Skip to content"}
        </a>
        <Navbar />
        <Hero content={content} socials={socials} />
        <About content={content} aboutImageUrl={content.aboutImageUrl} socials={socials} />
        <Suspense fallback={<SectionSkeleton />}>
          <Portfolio items={portfolioItems} content={content} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Partnerships items={partnerships} content={content} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Testimonials items={testimonials} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <NextTrip data={nextTrip} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Contact content={content} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <Footer content={content} socials={socials} />
        </Suspense>
      </main>
    </LanguageContext.Provider>
  );
}
