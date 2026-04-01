"use client";

export const dynamic = "force-dynamic";

import { lazy, Suspense } from "react";
import { useSiteContent, useSocialLinks, usePortfolio, usePartnerships, useTestimonials, useNextTrip } from "@/hooks/useFirestore";
import { useLanguageState, LanguageContext } from "@/hooks/useLanguage";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";

// Below-fold sections — dynamically imported to reduce initial bundle
const Portfolio = lazy(() => import("@/components/site/Portfolio"));
const Partnerships = lazy(() => import("@/components/site/Partnerships"));
const Testimonials = lazy(() => import("@/components/site/Testimonials"));
const NextTrip = lazy(() => import("@/components/site/NextTrip"));
const Contact = lazy(() => import("@/components/site/Contact"));
const Footer = lazy(() => import("@/components/site/Footer"));

export default function Home() {
  const { lang, setLang } = useLanguageState();
  const { content } = useSiteContent();
  const { socials } = useSocialLinks();
  const { items: portfolioItems } = usePortfolio();
  const { items: partnerships } = usePartnerships();
  const { items: testimonials } = useTestimonials();
  const { data: nextTrip } = useNextTrip();

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <main className="animate-fade-in">
        <Navbar />
        <Hero content={content} socials={socials} />
        <About content={content} aboutImageUrl={content.aboutImageUrl} socials={socials} />
        <Suspense>
          <Portfolio items={portfolioItems} content={content} />
          <Partnerships items={partnerships} content={content} />
          <Testimonials items={testimonials} />
          <NextTrip data={nextTrip} />
          <Contact content={content} />
          <Footer content={content} socials={socials} />
        </Suspense>
      </main>
    </LanguageContext.Provider>
  );
}
