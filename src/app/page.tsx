"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSiteContent, useSocialLinks, usePortfolio, usePartnerships, useTestimonials, useNextTrip } from "@/hooks/useFirestore";
import { useLanguageState, LanguageContext } from "@/hooks/useLanguage";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import Portfolio from "@/components/site/Portfolio";
import Partnerships from "@/components/site/Partnerships";

// Below-fold sections — dynamically imported to reduce initial bundle
const Testimonials = dynamic(() => import("@/components/site/Testimonials"));
const NextTrip = dynamic(() => import("@/components/site/NextTrip"));
const Contact = dynamic(() => import("@/components/site/Contact"));
const Footer = dynamic(() => import("@/components/site/Footer"));

export default function Home() {
  const { lang, setLang } = useLanguageState();
  const { content } = useSiteContent();
  const { socials } = useSocialLinks();
  const { items: portfolioItems } = usePortfolio();
  const { items: partnerships } = usePartnerships();
  const { items: testimonials } = useTestimonials();
  const { data: nextTrip } = useNextTrip();

  // Page visible après 500ms — indépendant de la vidéo et de Firestore
  const [pageReady, setPageReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <main className={`transition-opacity duration-[600ms] ease-out ${pageReady ? "opacity-100" : "opacity-0"}`}>
        <Navbar />
        <Hero content={content} socials={socials} />
        <About content={content} aboutImageUrl={content.aboutImageUrl} socials={socials} />
        <Portfolio items={portfolioItems} content={content} />
        <Partnerships items={partnerships} content={content} />
        <Testimonials items={testimonials} />
        <NextTrip data={nextTrip} />
        <Contact content={content} />
        <Footer content={content} socials={socials} />
      </main>
    </LanguageContext.Provider>
  );
}
