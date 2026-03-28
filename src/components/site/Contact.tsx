"use client";

import { useState, useRef } from "react";
import { useInView } from "framer-motion";
import { Send, Mail } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { SiteContent } from "@/types";
import { addContactMessage } from "@/lib/firestore";
import toast from "react-hot-toast";

interface ContactProps {
  content: SiteContent;
}

export default function Contact({ content }: ContactProps) {
  const { lang } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setLoading(true);
    try {
      await addContactMessage({
        name: form.name,
        email: form.email,
        message: form.message,
      });
      setForm({ name: "", email: "", message: "" });
      setSent(true);
      setTimeout(() => setSent(false), 5000);
      toast.success(
        lang === "fr"
          ? "Message envoyé ! Je vous répondrai bientôt."
          : "Message sent! I'll get back to you soon."
      );
    } catch {
      toast.error(
        lang === "fr" ? "Erreur, veuillez réessayer." : "Error, please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative py-14 md:py-20 overflow-hidden bg-[#1A1210]"
    >
      <div ref={ref} className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-8 transition-all duration-700 ease-out ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}>
          <p className="font-sans text-xs font-light text-white/40 tracking-[0.5em] uppercase mb-5">
            Contact
          </p>
          <h2 className="font-serif italic font-normal text-4xl md:text-6xl text-white mb-5 leading-tight">
            {t(content.contactTitle, lang)}
          </h2>
          <p className="font-sans text-white/60 leading-relaxed text-base max-w-md mx-auto">
            {t(content.contactSubtitle, lang)}
          </p>

          <a
            href={`mailto:${content.contactEmail}`}
            className="inline-flex items-center gap-2 mt-6 text-terracotta-400 hover:text-terracotta-300 font-sans font-medium transition-colors text-sm"
          >
            <Mail size={15} />
            {content.contactEmail}
          </a>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white/5 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-white/10 transition-all duration-700 delay-200 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="contact-name" className="block font-sans text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
                {lang === "fr" ? "Nom" : "Name"}
              </label>
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 font-sans text-sm text-white placeholder-white/25 focus:border-terracotta-400 focus:bg-white/10 transition-colors"
                placeholder={lang === "fr" ? "Votre nom" : "Your name"}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block font-sans text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 font-sans text-sm text-white placeholder-white/25 focus:border-terracotta-400 focus:bg-white/10 transition-colors"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div className="mb-8">
            <label htmlFor="contact-message" className="block font-sans text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
              Message
            </label>
            <textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={5}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 font-sans text-sm text-white placeholder-white/25 focus:border-terracotta-400 focus:bg-white/10 transition-colors resize-none"
              placeholder={
                lang === "fr"
                  ? "Décrivez votre projet ou proposition de collaboration..."
                  : "Describe your project or collaboration proposal..."
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading || sent}
            className="w-full gradient-sunset disabled:opacity-70 text-white font-sans font-medium py-4 px-6 rounded-xl transition-all duration-300 hover:opacity-90 active:opacity-80 flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : sent ? (
              <span>{lang === "fr" ? "Message envoyé" : "Message sent"}</span>
            ) : (
              <>
                <Send size={15} />
                {lang === "fr" ? "Envoyer le message" : "Send message"}
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
