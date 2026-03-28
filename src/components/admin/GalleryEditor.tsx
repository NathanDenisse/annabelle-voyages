"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Film, Video, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadSingleImage, uploadVideo, getYouTubeId, detectVideoSource } from "@/lib/storage";
import { MediaItem } from "@/types";
import toast from "react-hot-toast";

interface GalleryEditorProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  storagePath: string;
}

/** Stable key per item — refreshed only when url changes */
function getKey(item: MediaItem, idx: number) {
  return `${idx}-${item.url.slice(-12)}`;
}

export default function GalleryEditor({ items, onChange, storagePath }: GalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingMp4, setUploadingMp4] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const mp4Ref = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const ids = items.map((_, i) => String(i));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(items, Number(active.id), Number(over.id)));
  };

  const handlePhotosUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const newItems: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadSingleImage(
          file,
          `${storagePath}/img-${Date.now()}-${i}.jpg`,
          1920
        );
        newItems.push({ type: "image", url });
      }
      if (newItems.length) {
        onChange([...items, ...newItems]);
        toast.success(
          `${newItems.length} photo${newItems.length > 1 ? "s" : ""} ajoutée${newItems.length > 1 ? "s" : ""}`
        );
      }
    } catch {
      toast.error("Erreur upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleMp4Upload = async (file: File) => {
    if (!file.type.startsWith("video/")) return;
    setUploadingMp4(true);
    setMp4Progress(0);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const url = await uploadVideo(
        file,
        `${storagePath}/vid-${Date.now()}.${ext}`,
        (pct) => setMp4Progress(pct)
      );
      onChange([...items, { type: "video", url, platform: "mp4" }]);
      toast.success("Vidéo MP4 ajoutée !");
    } catch {
      toast.error("Erreur upload MP4.");
    } finally {
      setUploadingMp4(false);
      setMp4Progress(0);
    }
  };

  const addYouTube = () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    const source = detectVideoSource(url);
    if (source !== "youtube" && source !== "youtube-short") {
      toast.error("Lien YouTube invalide.");
      return;
    }
    onChange([...items, { type: "video", url, platform: "youtube" }]);
    setYoutubeUrl("");
    setShowYouTubeInput(false);
    toast.success("Lien YouTube ajouté !");
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-2">
        <label className="font-sans text-sm font-medium text-brown-700">Médias</label>
        <p className="font-sans text-xs text-brown-400 mt-0.5">
          Le premier média = couverture. Glissez pour réordonner.
        </p>
      </div>

      {/* Grid of thumbnails */}
      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {items.map((item, idx) => (
                <SortableGalleryItem
                  key={getKey(item, idx)}
                  id={String(idx)}
                  item={item}
                  isCover={idx === 0}
                  onRemove={() => remove(idx)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Hidden file inputs */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handlePhotosUpload(e.target.files);
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

      {/* Add buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            disabled={uploading || uploadingMp4}
            className="py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-xs text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Upload size={13} />
            {uploading ? "Upload..." : "+ Photos"}
          </button>
          <button
            type="button"
            onClick={() => mp4Ref.current?.click()}
            disabled={uploading || uploadingMp4}
            className="py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-xs text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex flex-col items-center justify-center gap-0.5 disabled:opacity-50"
          >
            {uploadingMp4 ? (
              <>
                <div className="w-4 h-4 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
                <span className="text-[10px] text-terracotta-500">{mp4Progress}%</span>
              </>
            ) : (
              <>
                <Film size={13} />
                + MP4
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowYouTubeInput((v) => !v)}
            disabled={uploading || uploadingMp4}
            className={`py-3 border-2 border-dashed rounded-xl font-sans text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50 ${
              showYouTubeInput
                ? "border-terracotta-300 text-terracotta-500"
                : "border-blush-200 text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500"
            }`}
          >
            <Video size={13} />
            + YouTube
          </button>
        </div>

        {/* YouTube input */}
        {showYouTubeInput && (
          <div className="flex gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-cream-100 border border-blush-200 rounded-xl px-3 py-2.5 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && addYouTube()}
              autoFocus
            />
            <button
              type="button"
              onClick={addYouTube}
              disabled={!youtubeUrl.trim()}
              className="px-3 py-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sortable grid item ───────────────────────────────────────────────────────

function SortableGalleryItem({
  id,
  item,
  isCover,
  onRemove,
}: {
  id: string;
  item: MediaItem;
  isCover?: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const badge =
    item.type === "image" ? "Photo" : item.platform === "mp4" ? "MP4" : "YouTube";

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-xl overflow-hidden bg-blush-100">
      {/* Thumbnail */}
      <ItemPreview item={item} />

      {/* Top bar: drag handle + badge + delete */}
      <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none">
        <div className="flex items-start justify-between">
          {/* Drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="pointer-events-auto p-1 rounded bg-black/50 text-white cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={10} />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onRemove}
            className="pointer-events-auto p-1 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors"
          >
            <X size={10} />
          </button>
        </div>

        <div className="flex justify-between items-end">
          {isCover ? (
            <span className="font-sans text-[9px] bg-terracotta-500 text-white px-1.5 py-0.5 rounded font-medium">
              Couverture
            </span>
          ) : (
            <span className="font-sans text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemPreview({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return <Image src={item.url} alt="" fill className="object-cover" />;
  }

  if (item.platform === "mp4") {
    return (
      <video
        src={item.url}
        className="w-full h-full object-cover"
        muted
        autoPlay
        loop
        playsInline
      />
    );
  }

  // YouTube
  const videoId = getYouTubeId(item.url);
  if (videoId) {
    return (
      <>
        <Image
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt="YouTube"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-brown-700 ml-0.5" />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-brown-900/20">
      <Video size={20} className="text-brown-400" />
    </div>
  );
}
