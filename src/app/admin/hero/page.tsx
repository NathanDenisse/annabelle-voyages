"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Upload, Trash2, Film } from "lucide-react";
import { uploadSingleImage, uploadVideo, deleteFileByUrl } from "@/lib/storage";
import { updateSiteContent } from "@/lib/firestore";
import { useSiteContent } from "@/hooks/useFirestore";
import { useAutosave } from "@/hooks/useAutosave";
import SaveIndicator from "@/components/admin/SaveIndicator";
import toast from "react-hot-toast";

export default function HeroAdmin() {
  const { content, loading } = useSiteContent();
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [taglineFr, setTaglineFr] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      setHeroImageUrl(content.heroImageUrl || "");
      setHeroVideoUrl(content.heroVideoUrl || "");
      setTaglineFr(content.heroTagline.fr);
      setTaglineEn(content.heroTagline.en);
      setInitialized(true);
    }
  }, [loading, content, initialized]);

  // Autosave tagline with debounce
  const taglineData = useMemo(() => ({ fr: taglineFr, en: taglineEn }), [taglineFr, taglineEn]);
  const saveTagline = useCallback(
    async (data: { fr: string; en: string }) => {
      await updateSiteContent({ heroTagline: data });
    },
    []
  );
  const saveStatus = useAutosave(taglineData, saveTagline, 800, initialized);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadSingleImage(file, `hero/background.jpg`, 1920);
      setHeroImageUrl(url);
      await updateSiteContent({ heroImageUrl: url });
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Sélectionne un fichier vidéo.");
      return;
    }
    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const url = await uploadVideo(
        file,
        `hero/background-video.${ext}`,
        (percent) => setVideoProgress(percent)
      );
      setHeroVideoUrl(url);
      await updateSiteContent({ heroVideoUrl: url });
    } catch {
      toast.error("Erreur lors de l'upload de la vidéo.");
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  };

  const handleRemoveVideo = async () => {
    if (heroVideoUrl) await deleteFileByUrl(heroVideoUrl);
    setHeroVideoUrl("");
    await updateSiteContent({ heroVideoUrl: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Hero</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">Image de fond, vidéo et tagline</p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      <div className="space-y-4">
        {/* Video upload */}
        <div className="bg-white rounded-2xl border border-blush-100 p-6">
          <h2 className="font-serif text-base font-medium text-brown-800 mb-1">Vidéo de fond</h2>
          <p className="font-sans text-xs text-brown-400 mb-4">
            Upload une vidéo (MP4 recommandé). Elle jouera en boucle, sans son, en fond du hero.
          </p>
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVideoUpload(f);
            }}
          />

          {heroVideoUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black">
                <video
                  src={heroVideoUrl}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => videoRef.current?.click()}
                  disabled={uploadingVideo}
                  className="flex-1 py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Film size={16} />
                  Changer la vidéo
                </button>
                <button
                  onClick={handleRemoveVideo}
                  className="py-3 px-4 border border-red-200 rounded-xl font-sans text-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => videoRef.current?.click()}
              disabled={uploadingVideo}
              className="w-full py-8 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex flex-col items-center gap-2"
            >
              {uploadingVideo ? (
                <>
                  <div className="w-8 h-8 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
                  <span>Upload en cours... {videoProgress}%</span>
                  <div className="w-48 h-1.5 bg-blush-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-terracotta-500 rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Film size={28} className="text-brown-300" />
                  <span>Choisir une vidéo</span>
                  <span className="text-xs text-brown-300">MP4 recommandé</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Image upload (fallback) */}
        <div className="bg-white rounded-2xl border border-blush-100 p-6">
          <h2 className="font-serif text-base font-medium text-brown-800 mb-1">Image de fond (fallback)</h2>
          <p className="font-sans text-xs text-brown-400 mb-4">
            Affichée pendant le chargement de la vidéo, ou si aucune vidéo n&apos;est uploadée.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
            }}
          />

          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-blush-100 mb-4 cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Image
              src={heroImageUrl || "/images/placeholders/hero.svg"}
              alt="Hero preview"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <Upload size={28} className="text-white" />
              <p className="text-white font-sans text-sm font-medium">Changer l&apos;image</p>
            </div>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {uploading ? "Upload en cours..." : "Choisir une image"}
          </button>
        </div>

        {/* Tagline */}
        <div className="bg-white rounded-2xl border border-blush-100 p-6">
          <h2 className="font-serif text-base font-medium text-brown-800 mb-4">Tagline</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs text-brown-400 mb-1.5">Français</label>
              <input
                value={taglineFr}
                onChange={(e) => setTaglineFr(e.target.value)}
                className="w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                placeholder="Tagline en français..."
              />
            </div>
            <div>
              <label className="block font-sans text-xs text-brown-400 mb-1.5">English</label>
              <input
                value={taglineEn}
                onChange={(e) => setTaglineEn(e.target.value)}
                className="w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                placeholder="Tagline in English..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
