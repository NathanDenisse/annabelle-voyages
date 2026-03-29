"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Instagram, Youtube, AlertCircle } from "lucide-react";
import { useSocialLinks } from "@/hooks/useFirestore";
import { updateSocialLinks } from "@/lib/firestore";
import { useAutosave } from "@/hooks/useAutosave";
import SaveIndicator from "@/components/admin/SaveIndicator";

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brown-700">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34v-6.9a8.17 8.17 0 004.77 1.52V6.47a4.85 4.85 0 01-1-.22z" />
    </svg>
  );
}

export default function SocialsAdmin() {
  const { socials, loading } = useSocialLinks();
  const [form, setForm] = useState({
    instagram: "",
    youtube: "",
    tiktok: "",
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (socials && !initialized) {
      setForm({
        instagram: socials.instagram || "",
        youtube: socials.youtube || "",
        tiktok: socials.tiktok || "",
      });
      setInitialized(true);
    }
  }, [socials, initialized]);

  const saveSocials = useCallback(
    async (data: { instagram: string; youtube: string; tiktok: string }) => {
      await updateSocialLinks(data);
    },
    []
  );
  const urlErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (form.instagram && !form.instagram.includes("instagram.com"))
      errors.instagram = "L'URL doit contenir instagram.com";
    if (form.youtube && !form.youtube.includes("youtube.com") && !form.youtube.includes("youtu.be"))
      errors.youtube = "L'URL doit contenir youtube.com";
    if (form.tiktok && !form.tiktok.includes("tiktok.com"))
      errors.tiktok = "L'URL doit contenir tiktok.com";
    return errors;
  }, [form]);

  const { status: saveStatus } = useAutosave(form, saveSocials, 800, initialized);

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
          <h1 className="font-serif text-2xl font-medium text-brown-900">Réseaux sociaux</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">Les modifications sont sauvegardées automatiquement</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="bg-white rounded-2xl border border-blush-100 p-6 space-y-5">
        {/* Instagram */}
        <div>
          <label className="flex items-center gap-2 font-sans text-sm font-medium text-brown-700 mb-2">
            <Instagram size={16} className="text-pink-500" />
            Instagram
          </label>
          <input
            type="url"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            className={`w-full bg-cream-100 border rounded-xl px-4 py-3 font-sans text-sm text-brown-900 transition-colors ${urlErrors.instagram ? "border-red-300 focus:border-red-400" : "border-blush-200 focus:border-terracotta-400"}`}
            placeholder="https://www.instagram.com/votrecompte"
          />
          {urlErrors.instagram && (
            <p className="flex items-center gap-1 font-sans text-xs text-red-500 mt-1">
              <AlertCircle size={12} /> {urlErrors.instagram}
            </p>
          )}
        </div>

        {/* YouTube */}
        <div>
          <label className="flex items-center gap-2 font-sans text-sm font-medium text-brown-700 mb-2">
            <Youtube size={16} className="text-red-500" />
            YouTube
          </label>
          <input
            type="url"
            value={form.youtube}
            onChange={(e) => setForm({ ...form, youtube: e.target.value })}
            className={`w-full bg-cream-100 border rounded-xl px-4 py-3 font-sans text-sm text-brown-900 transition-colors ${urlErrors.youtube ? "border-red-300 focus:border-red-400" : "border-blush-200 focus:border-terracotta-400"}`}
            placeholder="https://www.youtube.com/@votrechaine"
          />
          {urlErrors.youtube && (
            <p className="flex items-center gap-1 font-sans text-xs text-red-500 mt-1">
              <AlertCircle size={12} /> {urlErrors.youtube}
            </p>
          )}
        </div>

        {/* TikTok */}
        <div>
          <label className="flex items-center gap-2 font-sans text-sm font-medium text-brown-700 mb-2">
            <TikTokIcon />
            TikTok
          </label>
          <input
            type="url"
            value={form.tiktok}
            onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
            className={`w-full bg-cream-100 border rounded-xl px-4 py-3 font-sans text-sm text-brown-900 transition-colors ${urlErrors.tiktok ? "border-red-300 focus:border-red-400" : "border-blush-200 focus:border-terracotta-400"}`}
            placeholder="https://www.tiktok.com/@votrecompte (optionnel)"
          />
          {urlErrors.tiktok ? (
            <p className="flex items-center gap-1 font-sans text-xs text-red-500 mt-1">
              <AlertCircle size={12} /> {urlErrors.tiktok}
            </p>
          ) : (
            <p className="font-sans text-xs text-brown-400 mt-1">
              Laissez vide si vous n&apos;avez pas encore de compte TikTok.
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-blush-100 rounded-2xl p-4 mt-4">
        <p className="font-sans text-xs text-brown-500 mb-3 font-medium uppercase tracking-wide">Aperçu des liens</p>
        <div className="flex items-center gap-4">
          {form.instagram && (
            <a href={form.instagram} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brown-600 hover:text-terracotta-500 transition-colors">
              <Instagram size={16} />
              <span className="font-sans text-xs">Instagram</span>
            </a>
          )}
          {form.youtube && (
            <a href={form.youtube} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brown-600 hover:text-terracotta-500 transition-colors">
              <Youtube size={16} />
              <span className="font-sans text-xs">YouTube</span>
            </a>
          )}
          {form.tiktok && (
            <a href={form.tiktok} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brown-600 hover:text-terracotta-500 transition-colors">
              <TikTokIcon />
              <span className="font-sans text-xs">TikTok</span>
            </a>
          )}
          {!form.instagram && !form.youtube && !form.tiktok && (
            <p className="font-sans text-xs text-brown-300">Aucun lien configuré</p>
          )}
        </div>
      </div>
    </div>
  );
}
