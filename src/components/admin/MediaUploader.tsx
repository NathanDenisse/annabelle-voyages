"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Video } from "lucide-react";
import { uploadImage, detectVideoSource, VideoSource } from "@/lib/storage";
import toast from "react-hot-toast";

interface MediaUploaderProps {
  type: "image" | "video";
  onTypeChange: (type: "image" | "video") => void;
  imagePreview?: string;
  videoUrl?: string;
  onImageUpload: (url: string, thumbUrl: string) => void;
  onVideoUrlChange: (url: string) => void;
  storagePath: string;
}

const SOURCE_LABELS: Record<VideoSource, string> = {
  youtube: "YouTube",
  "youtube-short": "YouTube Short",
  instagram: "Instagram Reel",
  tiktok: "TikTok",
  unknown: "",
};

const SOURCE_COLORS: Record<VideoSource, string> = {
  youtube: "text-red-500",
  "youtube-short": "text-red-400",
  instagram: "text-pink-500",
  tiktok: "text-brown-700",
  unknown: "text-brown-300",
};

export default function MediaUploader({
  type,
  onTypeChange,
  imagePreview,
  videoUrl,
  onImageUpload,
  onVideoUrlChange,
  storagePath,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const detectedSource = videoUrl ? detectVideoSource(videoUrl) : "unknown";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image.");
      return;
    }
    setUploading(true);
    try {
      const { url, thumbnailUrl } = await uploadImage(file, storagePath);
      onImageUpload(url, thumbnailUrl);
      toast.success("Image uploadée !");
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-blush-200 mb-4">
        <button
          type="button"
          onClick={() => onTypeChange("image")}
          className={`flex-1 py-2.5 text-sm font-medium font-sans transition-colors ${
            type === "image"
              ? "bg-terracotta-500 text-white"
              : "bg-white text-brown-500 hover:bg-blush-100"
          }`}
        >
          📷 Image
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("video")}
          className={`flex-1 py-2.5 text-sm font-medium font-sans transition-colors ${
            type === "video"
              ? "bg-terracotta-500 text-white"
              : "bg-white text-brown-500 hover:bg-blush-100"
          }`}
        >
          🎬 Vidéo
        </button>
      </div>

      {type === "image" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              dragOver
                ? "border-terracotta-400 bg-terracotta-400/5"
                : "border-blush-200 hover:border-terracotta-300 hover:bg-blush-100/50"
            }`}
          >
            {imagePreview ? (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-sans">Changer l&apos;image</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                {uploading ? (
                  <div className="w-8 h-8 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={28} className="text-brown-300 mb-2" />
                    <p className="font-sans text-sm text-brown-500">
                      Glisser une image ou <span className="text-terracotta-500 font-medium">parcourir</span>
                    </p>
                    <p className="font-sans text-xs text-brown-300 mt-1">
                      JPG, PNG — max 1920px, compressé auto
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          {uploading && (
            <p className="text-center font-sans text-xs text-brown-400 mt-2">Upload en cours...</p>
          )}
        </div>
      ) : (
        <div>
          <div className={`flex items-center gap-2 bg-cream-100 border rounded-xl px-4 py-3 ${
            detectedSource !== "unknown" ? "border-terracotta-300" : "border-blush-200"
          }`}>
            <Video size={18} className={`flex-shrink-0 ${SOURCE_COLORS[detectedSource]}`} />
            <input
              type="url"
              value={videoUrl || ""}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              placeholder="Colle un lien YouTube, Instagram ou TikTok..."
              className="flex-1 bg-transparent font-sans text-sm text-brown-900 placeholder-brown-300 focus:outline-none"
            />
            {videoUrl && (
              <button
                type="button"
                onClick={() => onVideoUrlChange("")}
                className="text-brown-300 hover:text-brown-500 flex-shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Detected source badge */}
          {detectedSource !== "unknown" ? (
            <p className={`font-sans text-xs mt-1.5 ml-1 font-medium ${SOURCE_COLORS[detectedSource]}`}>
              ✓ {SOURCE_LABELS[detectedSource]} détecté
            </p>
          ) : videoUrl ? (
            <p className="font-sans text-xs mt-1.5 ml-1 text-orange-400">
              ⚠ Format non reconnu — vérifie le lien
            </p>
          ) : (
            <p className="font-sans text-xs mt-1.5 ml-1 text-brown-400">
              Supporte : YouTube · YouTube Shorts · Instagram Reels · TikTok
            </p>
          )}
        </div>
      )}
    </div>
  );
}
