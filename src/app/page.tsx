"use client";

export const dynamic = "force-dynamic";

import { useSiteContent, useSocialLinks, usePortfolio, usePartnerships } from "@/hooks/useFirestore";
import { useLanguageState, LanguageContext } from "@/hooks/useLanguage";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import Portfolio from "@/components/site/Portfolio";
import Partnerships from "@/components/site/Partnerships";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";

export default function Home() {
  const { lang, setLang } = useLanguageState();
  const { content } = useSiteContent();
  const { socials } = useSocialLinks();
  const { items: portfolioItems } = usePortfolio();
  const { items: partnerships } = usePartnerships();

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <main>
        <Navbar />
        <Hero content={content} socials={socials} heroImageUrl={content.heroImageUrl} />
        <About content={content} aboutImageUrl={content.aboutImageUrl} socials={socials} />
        <Portfolio items={portfolioItems} content={content} />
        <Partnerships items={partnerships} content={content} />
        <Contact content={content} />
        <Footer content={content} socials={socials} />
      </main>
    </LanguageContext.Provider>
  );
}
