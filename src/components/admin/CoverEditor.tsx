"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Film, Video, Trash2, X } from "lucide-react";
import { uploadSingleImage, uploadVideo, getYouTubeId, detectVideoSource } from "@/lib/storage";
import { MediaItem } from "@/types";
import toast from "react-hot-toast";

interface CoverEditorProps {
  item: MediaItem | null;
  onChange: (item: MediaItem | null) => void;
  storagePath: string;
}

export default function CoverEditor({ item, onChange, storagePath }: CoverEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const mp4Ref = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadSingleImage(file, `${storagePath}/cover-${Date.now()}.jpg`, 1920);
      onChange({ type: "image", url });
      toast.success("Photo uploadée !");
    } catch {
      toast.error("Erreur upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleMp4Upload = async (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const url = await uploadVideo(
        file,
        `${storagePath}/cover-${Date.now()}.${ext}`,
        (pct) => setProgress(pct)
      );
      onChange({ type: "video", url, platform: "mp4" });
      toast.success("Vidéo uploadée !");
    } catch {
      toast.error("Erreur upload MP4.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const confirmYouTube = () => {
    const url = youtubeUrl.trim();
    if (!url || !getYouTubeId(url)) {
      toast.error("Lien YouTube invalide.");
      return;
    }
    onChange({ type: "video", url, platform: "youtube" });
    setYoutubeUrl("");
    setShowYouTubeInput(false);
  };

  const ytId = item?.platform === "youtube" ? getYouTubeId(item.url) : null;

  // Determine preview aspect class based on content type
  const previewAspect = !item
    ? "aspect-video"
    : item.type === "image"
    ? "" // natural image ratio — no fixed aspect
    : item.platform === "mp4"
    ? "" // natural video ratio — no fixed aspect
    : detectVideoSource(item.url) === "youtube-short"
    ? "aspect-[9/16] max-h-72 mx-auto"
    : "aspect-video";

  return (
    <div>
      <div className="mb-2">
        <label className="font-sans text-sm font-medium text-brown-700">
          Photo / Vidéo de couverture
        </label>
        <p className="font-sans text-xs text-brown-400 mt-0.5">
          Ce qui s&apos;affiche dans le carousel sur le site
        </p>
      </div>

      {/* Preview — format-aware */}
      <div className={`relative rounded-xl overflow-hidden bg-blush-100 mb-3 ${previewAspect}`}>
        {item ? (
          <>
            {item.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="Couverture" className="w-full h-auto block" />
            )}
            {item.platform === "mp4" && (
              <video
                src={item.url}
                className="w-full h-auto block"
                muted
                autoPlay
                loop
                playsInline
              />
            )}
            {ytId && (
              <Image
                src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                alt="YouTube cover"
                fill
                className="object-cover"
              />
            )}

            {/* Overlay controls (always on top) */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
              <span className="font-sans text-[10px] font-medium bg-black/60 text-white px-2 py-0.5 rounded-full">
                {item.type === "image" ? "📷 Photo" : item.platform === "mp4" ? "🎬 MP4" : "▶️ YouTube"}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
                className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors"
                title="Supprimer la couverture"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        ) : uploading ? (
          <div className="aspect-video flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
            {progress > 0 && (
              <>
                <p className="font-sans text-xs text-brown-400">{progress}%</p>
                <div className="w-32 h-1.5 bg-blush-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terracotta-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center gap-2 text-brown-300">
            <Upload size={28} />
            <p className="font-sans text-sm">Aucune couverture</p>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePhotoUpload(f);
          e.target.value = "";
        }}
      />
      <input
        ref={mp4Ref}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleMp4Upload(f);
          e.target.value = "";
        }}
      />

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => { setShowYouTubeInput(false); photoRef.current?.click(); }}
          disabled={uploading}
          className="py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-xs text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Upload size={13} />
          📷 Photo
        </button>
        <button
          type="button"
          onClick={() => { setShowYouTubeInput(false); mp4Ref.current?.click(); }}
          disabled={uploading}
          className="py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-xs text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Film size={13} />
          🎬 MP4
        </button>
        <button
          type="button"
          onClick={() => setShowYouTubeInput((v) => !v)}
          disabled={uploading}
          className={`py-3 border-2 border-dashed rounded-xl font-sans text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
            showYouTubeInput
              ? "border-terracotta-300 text-terracotta-500 bg-terracotta-500/5"
              : "border-blush-200 text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500"
          }`}
        >
          <Video size={13} />
          ▶️ YouTube
        </button>
      </div>

      {/* YouTube URL input */}
      {showYouTubeInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 bg-cream-100 border border-blush-200 rounded-xl px-3 py-2.5 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && confirmYouTube()}
            autoFocus
          />
          <button
            type="button"
            onClick={confirmYouTube}
            disabled={!youtubeUrl.trim()}
            className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-white rounded-xl font-sans text-sm transition-colors"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => { setShowYouTubeInput(false); setYoutubeUrl(""); }}
            className="px-3 py-2 border border-blush-200 rounded-xl text-brown-400 hover:text-brown-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
