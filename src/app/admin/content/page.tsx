"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { useSiteContent } from "@/hooks/useFirestore";
import { updateSiteContent } from "@/lib/firestore";
import { uploadSingleImage } from "@/lib/storage";
import { useAutosave } from "@/hooks/useAutosave";
import SaveIndicator from "@/components/admin/SaveIndicator";
import SmartBilingualField from "@/components/admin/SmartBilingualField";
import { SiteContent } from "@/types";
import toast from "react-hot-toast";

export default function ContentAdmin() {
  const { content, loading } = useSiteContent();
  const [form, setForm] = useState(content);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const aboutFileRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      setForm(content);
      setInitialized(true);
    }
  }, [loading, content, initialized]);

  // Autosave form data with debounce
  const saveContent = useCallback(
    async (data: SiteContent) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, updatedAt, ...rest } = data;
      await updateSiteContent(rest);
    },
    []
  );
  const saveStatus = useAutosave(form, saveContent, 800, initialized);

  const handleAboutImageUpload = async (file: File) => {
    setUploadingAbout(true);
    try {
      const url = await uploadSingleImage(file, "about/profile.jpg", 1200);
      setForm((prev) => ({ ...prev, aboutImageUrl: url }));
      await updateSiteContent({ aboutImageUrl: url });
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploadingAbout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Textes du site</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">Les modifications sont sauvegardées automatiquement</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="space-y-4">
        {/* Hero Section */}
        <Section title="Hero">
          <SmartBilingualField
            label="Tagline"
            valueFr={form.heroTagline.fr}
            valueEn={form.heroTagline.en}
            onChangeFr={(v) => setForm({ ...form, heroTagline: { ...form.heroTagline, fr: v } })}
            onChangeEn={(v) => setForm({ ...form, heroTagline: { ...form.heroTagline, en: v } })}
          />
          <SmartBilingualField
            label="Bouton CTA"
            valueFr={form.heroCta.fr}
            valueEn={form.heroCta.en}
            onChangeFr={(v) => setForm({ ...form, heroCta: { ...form.heroCta, fr: v } })}
            onChangeEn={(v) => setForm({ ...form, heroCta: { ...form.heroCta, en: v } })}
          />
        </Section>

        {/* About Section */}
        <Section title="À Propos">
          <div>
            <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
              Photo de profil
            </label>
            <input
              ref={aboutFileRef}
              type="file"
              accept="image/*"
                            className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAboutImageUpload(f);
              }}
            />
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-blush-100 flex-shrink-0">
                {form.aboutImageUrl ? (
                  <Image src={form.aboutImageUrl} alt="À propos" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload size={20} className="text-brown-300" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => aboutFileRef.current?.click()}
                disabled={uploadingAbout}
                className="flex-1 py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={15} />
                {uploadingAbout ? "Upload..." : "Changer la photo"}
              </button>
            </div>
          </div>

          <SmartBilingualField
            label="Bio"
            valueFr={form.aboutBio.fr}
            valueEn={form.aboutBio.en}
            onChangeFr={(v) => setForm({ ...form, aboutBio: { ...form.aboutBio, fr: v } })}
            onChangeEn={(v) => setForm({ ...form, aboutBio: { ...form.aboutBio, en: v } })}
            multiline
          />

          <div>
            <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
              Statistiques
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["countries", "followers", "collaborations"] as const).map((key) => (
                <div key={key} className="bg-cream-100 rounded-xl p-3">
                  <label className="block font-sans text-xs text-brown-400 mb-1">
                    {key === "countries" ? "Pays" : key === "followers" ? "Abonnés" : "Collabs"}
                  </label>
                  <input
                    type="number"
                    value={form.stats[key]}
                    onChange={(e) =>
                      setForm({ ...form, stats: { ...form.stats, [key]: parseInt(e.target.value) || 0 } })
                    }
                    className="w-full bg-white border border-blush-200 rounded-lg px-3 py-2 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Contact Section */}
        <Section title="Contact">
          <SmartBilingualField
            label="Titre contact"
            valueFr={form.contactTitle.fr}
            valueEn={form.contactTitle.en}
            onChangeFr={(v) => setForm({ ...form, contactTitle: { ...form.contactTitle, fr: v } })}
            onChangeEn={(v) => setForm({ ...form, contactTitle: { ...form.contactTitle, en: v } })}
          />
          <SmartBilingualField
            label="Sous-titre contact"
            valueFr={form.contactSubtitle.fr}
            valueEn={form.contactSubtitle.en}
            onChangeFr={(v) => setForm({ ...form, contactSubtitle: { ...form.contactSubtitle, fr: v } })}
            onChangeEn={(v) => setForm({ ...form, contactSubtitle: { ...form.contactSubtitle, en: v } })}
            multiline
          />
          <div>
            <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-2">
              Email de contact
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-blush-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-blush-100 bg-blush-100/50">
        <h2 className="font-serif text-base font-medium text-brown-800">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

