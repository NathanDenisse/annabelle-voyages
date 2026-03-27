"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSiteContent, useSocialLinks, usePortfolio, usePartnerships, useTestimonials } from "@/hooks/useFirestore";
import { useLanguageState, LanguageContext } from "@/hooks/useLanguage";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import Portfolio from "@/components/site/Portfolio";
import Partnerships from "@/components/site/Partnerships";
import Testimonials from "@/components/site/Testimonials";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";

export default function Home() {
  const { lang, setLang } = useLanguageState();
  const { content } = useSiteContent();
  const { socials } = useSocialLinks();
  const { items: portfolioItems } = usePortfolio();
  const { items: partnerships } = usePartnerships();
  const { items: testimonials } = useTestimonials();

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
        <Contact content={content} />
        <Footer content={content} socials={socials} />
      </main>
    </LanguageContext.Provider>
  );
}
