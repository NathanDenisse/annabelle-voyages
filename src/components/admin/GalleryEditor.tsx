"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Video, Plus } from "lucide-react";
import { uploadSingleImage, detectVideoSource, getYouTubeId } from "@/lib/storage";
import { MediaItem } from "@/types";
import toast from "react-hot-toast";

interface GalleryEditorProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  storagePath: string;
}

export default function GalleryEditor({ items, onChange, storagePath }: GalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const newItems: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadSingleImage(file, `${storagePath}/${Date.now()}-${i}.jpg`, 1920);
        newItems.push({ type: "image", url });
      }
      if (newItems.length) {
        onChange([...items, ...newItems]);
        toast.success(`${newItems.length} photo${newItems.length > 1 ? "s" : ""} ajoutée${newItems.length > 1 ? "s" : ""}`);
      }
    } catch {
      toast.error("Erreur upload.");
    } finally {
      setUploading(false);
    }
  };

  const addVideo = () => {
    const url = videoInput.trim();
    if (!url) return;
    const source = detectVideoSource(url);
    const platform: "youtube" | "mp4" = (source === "youtube" || source === "youtube-short") ? "youtube" : "youtube";
    onChange([...items, { type: "video", url, platform }]);
    setVideoInput("");
    setShowVideoInput(false);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block font-sans text-sm font-medium text-brown-700 mb-2">
        Galerie de médias
        <span className="ml-2 font-normal text-brown-400 text-xs">— le 1er élément devient la couverture</span>
      </label>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-blush-100">
              {item.type === "image" ? (
                <Image src={item.url} alt={`Media ${idx + 1}`} fill className="object-cover" />
              ) : (
                <VideoThumbnail url={item.url} />
              )}
              <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none">
                <div className="flex justify-between">
                  <span className="font-sans text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {idx === 0 ? "Cover" : `${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="pointer-events-auto p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleImageUpload(e.target.files); }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 py-2.5 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-1.5"
        >
          <Upload size={14} />
          {uploading ? "Upload..." : "Ajouter photos"}
        </button>
        <button
          type="button"
          onClick={() => setShowVideoInput(!showVideoInput)}
          className={`flex-1 py-2.5 border-2 border-dashed rounded-xl font-sans text-sm transition-colors flex items-center justify-center gap-1.5 ${showVideoInput ? "border-terracotta-300 text-terracotta-500" : "border-blush-200 text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500"}`}
        >
          <Video size={14} />
          Ajouter vidéo
        </button>
      </div>

      {showVideoInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="url"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 bg-cream-100 border border-blush-200 rounded-xl px-3 py-2.5 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
            onKeyDown={(e) => e.key === "Enter" && addVideo()}
          />
          <button
            type="button"
            onClick={addVideo}
            disabled={!videoInput.trim()}
            className="px-3 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-white rounded-xl transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function VideoThumbnail({ url }: { url: string }) {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return (
      <>
        <Image
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt="Video thumbnail"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[9px] border-l-brown-700 ml-0.5" />
          </div>
        </div>
      </>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-brown-900/20">
      <Video size={22} className="text-brown-400" />
    </div>
  );
}
