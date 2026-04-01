"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Trash2, Film, ImageIcon } from "lucide-react";
import { uploadVideo, uploadSingleImage, deleteFileByUrl } from "@/lib/storage";
import { updateSiteContent } from "@/lib/firestore";
import { useSiteContent } from "@/hooks/useFirestore";
import { useAutosave } from "@/hooks/useAutosave";
import SaveIndicator from "@/components/admin/SaveIndicator";
import toast from "react-hot-toast";

export default function HeroAdmin() {
  const { content, loading } = useSiteContent();
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [taglineFr, setTaglineFr] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const videoRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      setHeroVideoUrl(content.heroVideoUrl || "");
      setHeroImageUrl(content.heroImageUrl || "");
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
  const { status: saveStatus } = useAutosave(taglineData, saveTagline, 800, initialized);

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

  const handlePosterUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionne un fichier image.");
      return;
    }
    setUploadingPoster(true);
    try {
      const url = await uploadSingleImage(file, "hero/poster.jpg", 1920);
      setHeroImageUrl(url);
      await updateSiteContent({ heroImageUrl: url });
      toast.success("Image poster mise à jour");
    } catch {
      toast.error("Erreur lors de l'upload de l'image.");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleRemovePoster = async () => {
    if (heroImageUrl) await deleteFileByUrl(heroImageUrl);
    setHeroImageUrl("");
    await updateSiteContent({ heroImageUrl: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Hero</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">Vidéo et tagline</p>
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

        {/* Poster image */}
        <div className="bg-white rounded-2xl border border-blush-100 p-6">
          <h2 className="font-serif text-base font-medium text-brown-800 mb-1">Image poster</h2>
          <p className="font-sans text-xs text-brown-400 mb-4">
            Image affichée instantanément pendant le chargement de la vidéo. Utilise une capture de la première frame de ta vidéo.
          </p>
          <input
            ref={posterRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePosterUpload(f);
            }}
          />

          {heroImageUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black">
                <img
                  src={heroImageUrl}
                  alt="Hero poster"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => posterRef.current?.click()}
                  disabled={uploadingPoster}
                  className="flex-1 py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon size={16} />
                  Changer l&#39;image
                </button>
                <button
                  onClick={handleRemovePoster}
                  className="py-3 px-4 border border-red-200 rounded-xl font-sans text-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => posterRef.current?.click()}
              disabled={uploadingPoster}
              className="w-full py-8 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex flex-col items-center gap-2"
            >
              {uploadingPoster ? (
                <div className="w-8 h-8 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
              ) : (
                <>
                  <ImageIcon size={28} className="text-brown-300" />
                  <span>Choisir une image</span>
                  <span className="text-xs text-brown-300">JPG ou PNG — première frame de la vidéo recommandée</span>
                </>
              )}
            </button>
          )}
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
