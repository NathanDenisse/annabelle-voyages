"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Plus, Trash2, Film, Eye, EyeOff } from "lucide-react";
import { uploadVideo, deleteFileByUrl } from "@/lib/storage";
import { updateNextTrip } from "@/lib/firestore";
import { useNextTrip } from "@/hooks/useFirestore";
import { useAutosave } from "@/hooks/useAutosave";
import SaveIndicator from "@/components/admin/SaveIndicator";
import toast from "react-hot-toast";

export default function NextTripAdmin() {
  const { data, loading } = useNextTrip();
  const [initialized, setInitialized] = useState(false);

  const [destinationFr, setDestinationFr] = useState("");
  const [destinationEn, setDestinationEn] = useState("");
  const [periodFr, setPeriodFr] = useState("");
  const [periodEn, setPeriodEn] = useState("");
  const [places, setPlaces] = useState<string[]>([]);
  const [newPlace, setNewPlace] = useState("");
  const [pitchFr, setPitchFr] = useState("");
  const [pitchEn, setPitchEn] = useState("");
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState("");
  const [visible, setVisible] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !initialized) {
      setDestinationFr(data.destination.fr);
      setDestinationEn(data.destination.en);
      setPeriodFr(data.period.fr);
      setPeriodEn(data.period.en);
      setPlaces(data.places ?? []);
      setPitchFr(data.pitch.fr);
      setPitchEn(data.pitch.en);
      setBackgroundVideoUrl(data.backgroundVideoUrl ?? "");
      setVisible(data.visible);
      setInitialized(true);
    }
  }, [loading, data, initialized]);

  const formData = useMemo(() => ({
    destinationFr, destinationEn, periodFr, periodEn,
    places, pitchFr, pitchEn, visible,
  }), [destinationFr, destinationEn, periodFr, periodEn, places, pitchFr, pitchEn, visible]);

  const saveFn = useCallback(async (d: typeof formData) => {
    await updateNextTrip({
      destination: { fr: d.destinationFr, en: d.destinationEn },
      period: { fr: d.periodFr, en: d.periodEn },
      places: d.places,
      pitch: { fr: d.pitchFr, en: d.pitchEn },
      visible: d.visible,
    });
  }, []);

  const { status: saveStatus } = useAutosave(formData, saveFn, 800, initialized);

  const handleToggleVisible = async () => {
    const next = !visible;
    setVisible(next);
  };

  const handleAddPlace = () => {
    const trimmed = newPlace.trim();
    if (!trimmed) return;
    setPlaces((prev) => [...prev, trimmed]);
    setNewPlace("");
  };

  const handleRemovePlace = (idx: number) => {
    setPlaces((prev) => prev.filter((_, i) => i !== idx));
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
        `next-trip/background.${ext}`,
        (percent) => setVideoProgress(percent)
      );
      setBackgroundVideoUrl(url);
      await updateNextTrip({ backgroundVideoUrl: url });
      toast.success("Vidéo uploadée !");
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  };

  const handleRemoveVideo = async () => {
    if (backgroundVideoUrl) await deleteFileByUrl(backgroundVideoUrl);
    setBackgroundVideoUrl("");
    await updateNextTrip({ backgroundVideoUrl: "" });
    toast.success("Vidéo supprimée.");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Prochain voyage</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">Sauvegarde auto</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <button
            onClick={handleToggleVisible}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-sans text-sm transition-colors ${
              visible
                ? "bg-terracotta-50 border-terracotta-200 text-terracotta-600 hover:bg-terracotta-100"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {visible ? <Eye size={15} /> : <EyeOff size={15} />}
            {visible ? "Visible" : "Masquée"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Destination */}
        <div className="bg-white rounded-2xl border border-blush-100 p-5">
          <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
            Destination
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="font-sans text-xs text-brown-400 mb-1">Français</p>
              <input
                type="text"
                value={destinationFr}
                onChange={(e) => setDestinationFr(e.target.value)}
                placeholder="Polynésie Française"
                className="w-full border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors"
              />
            </div>
            <div>
              <p className="font-sans text-xs text-brown-400 mb-1">English</p>
              <input
                type="text"
                value={destinationEn}
                onChange={(e) => setDestinationEn(e.target.value)}
                placeholder="French Polynesia"
                className="w-full border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Period */}
        <div className="bg-white rounded-2xl border border-blush-100 p-5">
          <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
            Période
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="font-sans text-xs text-brown-400 mb-1">Français</p>
              <input
                type="text"
                value={periodFr}
                onChange={(e) => setPeriodFr(e.target.value)}
                placeholder="Été 2026"
                className="w-full border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors"
              />
            </div>
            <div>
              <p className="font-sans text-xs text-brown-400 mb-1">English</p>
              <input
                type="text"
                value={periodEn}
                onChange={(e) => setPeriodEn(e.target.value)}
                placeholder="Summer 2026"
                className="w-full border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Places */}
        <div className="bg-white rounded-2xl border border-blush-100 p-5">
          <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
            Lieux / Îles
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {places.map((place, idx) => (
              <span key={idx} className="flex items-center gap-1.5 bg-blush-100 text-brown-700 font-sans text-sm px-3 py-1.5 rounded-full">
                {place}
                <button onClick={() => handleRemovePlace(idx)} className="text-brown-400 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPlace(); } }}
              placeholder="Ajouter un lieu..."
              className="flex-1 border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors"
            />
            <button
              onClick={handleAddPlace}
              className="flex items-center gap-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={15} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Pitch */}
        <div className="bg-white rounded-2xl border border-blush-100 p-5">
          <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
            Texte d&apos;accroche
          </label>
          <div className="space-y-3">
            <div>
              <p className="font-sans text-xs text-brown-400 mb-1">Français</p>
              <textarea
                value={pitchFr}
                onChange={(e) => setPitchFr(e.target.value)}
                rows={2}
                placeholder="Vous cherchez du contenu authentique depuis le paradis ?..."
                className="w-full border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors resize-none"
              />
            </div>
            <div>
              <p className="font-sans text-xs text-brown-400 mb-1">English</p>
              <textarea
                value={pitchEn}
                onChange={(e) => setPitchEn(e.target.value)}
                rows={2}
                placeholder="Looking for authentic content from paradise?..."
                className="w-full border border-blush-200 rounded-xl px-3.5 py-2.5 font-sans text-sm text-brown-800 placeholder-brown-200 focus:border-terracotta-400 bg-blush-50/30 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Background video */}
        <div className="bg-white rounded-2xl border border-blush-100 p-5">
          <label className="block font-sans text-xs font-medium text-brown-500 uppercase tracking-wide mb-3">
            Vidéo de fond (optionnel)
          </label>
          {backgroundVideoUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-3">
              <video src={backgroundVideoUrl} muted loop playsInline className="w-full h-full object-cover" />
              <button
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-blush-200 rounded-xl p-8 text-center cursor-pointer hover:border-terracotta-300 hover:bg-terracotta-50/20 transition-colors"
            >
              {uploadingVideo ? (
                <div className="space-y-2">
                  <div className="w-full bg-blush-100 rounded-full h-1.5">
                    <div className="bg-terracotta-500 h-1.5 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                  </div>
                  <p className="font-sans text-xs text-brown-400">{videoProgress}%</p>
                </div>
              ) : (
                <>
                  <Film size={24} className="text-brown-300 mx-auto mb-2" />
                  <p className="font-sans text-sm text-brown-400">Cliquer pour uploader une vidéo MP4</p>
                  <p className="font-sans text-xs text-brown-300 mt-1">Sans vidéo : fond couleur lagon</p>
                </>
              )}
            </div>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
          />
        </div>
      </div>
    </div>
  );
}
