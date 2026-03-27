"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, Eye, EyeOff, X, Save, Upload, Video, Film } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { usePartnerships } from "@/hooks/useFirestore";
import {
  addPartnership,
  updatePartnership,
  deletePartnership,
  updatePartnershipOrder,
} from "@/lib/firestore";
import { Partnership, MediaItem } from "@/types";
import { uploadSingleImage, uploadVideo, deleteFileByUrl } from "@/lib/storage";
import SmartBilingualField from "@/components/admin/SmartBilingualField";
import GalleryEditor from "@/components/admin/GalleryEditor";
import SortableItem from "@/components/admin/SortableItem";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  description: { fr: "", en: "" },
  logoUrl: "",
  images: [] as string[],
  videoUrl: "",
  mp4VideoUrl: "",
  videoSource: "youtube" as "youtube" | "mp4",
  gallery: [] as MediaItem[],
  externalLink: "",
  visible: true,
};

export default function PartnershipsAdmin() {
  const { items } = usePartnerships();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesFileRef = useRef<HTMLInputElement>(null);
  const mp4FileRef = useRef<HTMLInputElement>(null);
  const [uploadingMp4, setUploadingMp4] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((item, idx) => ({ id: item.id, order: idx }));
    await updatePartnershipOrder(updates);
  };

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: Partnership) => {
    setForm({
      name: item.name,
      description: item.description,
      logoUrl: item.logoUrl || "",
      images: item.images || [],
      videoUrl: item.videoUrl || "",
      mp4VideoUrl: item.mp4VideoUrl || "",
      videoSource: item.mp4VideoUrl ? "mp4" : "youtube",
      gallery: item.gallery || [],
      externalLink: item.externalLink,
      visible: item.visible,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      // Delete old logo from Storage if replacing
      if (form.logoUrl) await deleteFileByUrl(form.logoUrl);
      const url = await uploadSingleImage(file, `partnerships/${Date.now()}/logo.jpg`, 600);
      setForm((prev) => ({ ...prev, logoUrl: url }));
      toast.success("Logo uploadé !");
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleImagesUpload = async (files: FileList) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadSingleImage(file, `partnerships/${Date.now()}-${i}/photo.jpg`, 1920);
        urls.push(url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploadée${urls.length > 1 ? "s" : ""} !`);
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const url = form.images[index];
    if (url) await deleteFileByUrl(url);
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMp4Upload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Sélectionne un fichier vidéo.");
      return;
    }
    setUploadingMp4(true);
    setMp4Progress(0);
    try {
      if (form.mp4VideoUrl) await deleteFileByUrl(form.mp4VideoUrl);
      const ext = file.name.split(".").pop() || "mp4";
      const url = await uploadVideo(
        file,
        `partnerships/${Date.now()}/video.${ext}`,
        (pct) => setMp4Progress(pct)
      );
      setForm((prev) => ({ ...prev, mp4VideoUrl: url }));
      toast.success("Vidéo uploadée !");
    } catch {
      toast.error("Erreur lors de l'upload.");
    } finally {
      setUploadingMp4(false);
      setMp4Progress(0);
    }
  };

  const removeMp4 = async () => {
    if (form.mp4VideoUrl) await deleteFileByUrl(form.mp4VideoUrl);
    setForm((prev) => ({ ...prev, mp4VideoUrl: "" }));
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Le nom est requis.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        logoUrl: form.logoUrl || "",
        images: form.images,
        videoUrl: form.videoSource === "youtube" ? (form.videoUrl || "") : "",
        mp4VideoUrl: form.videoSource === "mp4" ? (form.mp4VideoUrl || "") : "",
        gallery: form.gallery,
        externalLink: form.externalLink,
        visible: form.visible,
        order: editingId
          ? (items.find((i) => i.id === editingId)?.order ?? items.length)
          : items.length,
      };

      if (editingId) {
        await updatePartnership(editingId, data);
        toast.success("Partenariat mis à jour !");
      } else {
        await addPartnership(data);
        toast.success("Partenariat ajouté !");
      }
      setShowForm(false);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("[Partnerships] Erreur sauvegarde:", { code: err?.code, message: err?.message, raw: error });
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id);
      if (item) {
        // Delete all media files from Firebase Storage
        if (item.logoUrl) await deleteFileByUrl(item.logoUrl);
        if (item.images) {
          await Promise.all(item.images.map((url) => deleteFileByUrl(url)));
        }
      }
      await deletePartnership(id);
      toast.success("Partenariat supprimé.");
      setDeleteConfirm(null);
    } catch {
      toast.error("Erreur.");
    }
  };

  const toggleVisible = async (item: Partnership) => {
    await updatePartnership(item.id, { visible: !item.visible });
    toast.success(item.visible ? "Masqué" : "Visible");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Partenariats</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">{items.length} partenaire{items.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-blush-100">
          <p className="font-sans text-brown-400 mb-4">Aucun partenariat pour l&apos;instant</p>
          <button onClick={openAdd} className="text-terracotta-500 font-medium font-sans text-sm hover:underline">
            + Ajouter le premier
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  <div
                    onClick={() => openEdit(item)}
                    className={`bg-white rounded-2xl border border-blush-100 p-4 pl-10 flex items-center gap-4 cursor-pointer active:bg-blush-100/50 transition-colors ${!item.visible ? "opacity-60" : ""}`}
                  >
                    {/* Logo */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-blush-100">
                      {item.logoUrl ? (
                        <Image src={item.logoUrl} alt={item.name} fill className="object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-serif text-xl font-medium text-terracotta-400">
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-sans text-sm font-medium text-brown-900">{item.name}</p>
                        {item.videoUrl && <Video size={13} className="text-red-400 flex-shrink-0" />}
                      </div>
                      <p className="font-sans text-xs text-brown-400 truncate mt-0.5">{item.description.fr}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisible(item); }}
                        className="p-3 rounded-lg text-brown-300 hover:text-brown-600 hover:bg-blush-100 transition-colors"
                      >
                        {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                        className="p-3 rounded-lg text-brown-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-serif text-lg font-medium text-brown-900 mb-2">Confirmer la suppression</h3>
            <p className="font-sans text-sm text-brown-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-blush-200 rounded-xl font-sans text-sm text-brown-600 hover:bg-blush-100"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-sans text-sm font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-blush-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-serif text-lg font-medium text-brown-900">
                {editingId ? "Modifier le partenariat" : "Ajouter un partenariat"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-blush-100 text-brown-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Logo upload */}
              <div>
                <label className="block font-sans text-sm font-medium text-brown-700 mb-2">Logo</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                                    className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                  }}
                />
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-blush-100 flex-shrink-0">
                    {form.logoUrl ? (
                      <Image src={form.logoUrl} alt="Logo" fill className="object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brown-300">
                        <Upload size={20} />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors"
                  >
                    {uploading ? "Upload en cours..." : "Choisir un logo"}
                  </button>
                </div>
              </div>

              {/* Photos gallery */}
              <div>
                <label className="block font-sans text-sm font-medium text-brown-700 mb-2">Photos du partenariat</label>
                <input
                  ref={imagesFileRef}
                  type="file"
                  accept="image/*"
                                    multiple
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files;
                    if (f && f.length > 0) handleImagesUpload(f);
                  }}
                />
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {form.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-blush-100">
                        <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => imagesFileRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors"
                >
                  {uploading ? "Upload en cours..." : "+ Ajouter des photos"}
                </button>
              </div>

              {/* Video */}
              <div>
                <label className="block font-sans text-sm font-medium text-brown-700 mb-2">Vidéo</label>
                {/* Source toggle */}
                <div className="flex rounded-xl overflow-hidden border border-blush-200 mb-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, videoSource: "youtube" })}
                    className={`flex-1 py-2.5 text-xs font-medium font-sans flex items-center justify-center gap-1.5 transition-colors ${
                      form.videoSource === "youtube" ? "bg-terracotta-500 text-white" : "bg-white text-brown-500 hover:bg-blush-100"
                    }`}
                  >
                    <Video size={14} /> Lien YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, videoSource: "mp4" })}
                    className={`flex-1 py-2.5 text-xs font-medium font-sans flex items-center justify-center gap-1.5 transition-colors ${
                      form.videoSource === "mp4" ? "bg-terracotta-500 text-white" : "bg-white text-brown-500 hover:bg-blush-100"
                    }`}
                  >
                    <Film size={14} /> Upload MP4
                  </button>
                </div>

                {form.videoSource === "youtube" ? (
                  <div className="flex items-center gap-2 bg-cream-100 border border-blush-200 rounded-xl px-4 py-3">
                    <Video size={18} className={`flex-shrink-0 ${form.videoUrl ? "text-red-500" : "text-brown-300"}`} />
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 bg-transparent font-sans text-sm text-brown-900 placeholder-brown-300 focus:outline-none"
                    />
                    {form.videoUrl && (
                      <button type="button" onClick={() => setForm({ ...form, videoUrl: "" })} className="text-brown-300 hover:text-brown-500 flex-shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      ref={mp4FileRef}
                      type="file"
                      accept="video/*"
                                            className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleMp4Upload(f);
                      }}
                    />
                    {form.mp4VideoUrl ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                          <video src={form.mp4VideoUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => mp4FileRef.current?.click()} disabled={uploadingMp4}
                            className="flex-1 py-2.5 border-2 border-dashed border-blush-200 rounded-xl font-sans text-xs text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex items-center justify-center gap-1.5">
                            <Film size={14} /> Changer
                          </button>
                          <button type="button" onClick={removeMp4}
                            className="py-2.5 px-3 border border-red-200 rounded-xl font-sans text-xs text-red-400 hover:bg-red-50 transition-colors flex items-center gap-1.5">
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => mp4FileRef.current?.click()} disabled={uploadingMp4}
                        className="w-full py-6 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors flex flex-col items-center gap-2">
                        {uploadingMp4 ? (
                          <>
                            <div className="w-6 h-6 border-2 border-terracotta-300 border-t-terracotta-500 rounded-full animate-spin" />
                            <span className="text-xs">{mp4Progress}%</span>
                            <div className="w-32 h-1.5 bg-blush-200 rounded-full overflow-hidden">
                              <div className="h-full bg-terracotta-500 rounded-full transition-all" style={{ width: `${mp4Progress}%` }} />
                            </div>
                          </>
                        ) : (
                          <>
                            <Film size={24} className="text-brown-300" />
                            <span>Choisir une vidéo MP4</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Gallery */}
              <GalleryEditor
                items={form.gallery}
                onChange={(gallery) => setForm({ ...form, gallery })}
                storagePath={`partnerships/gallery/${Date.now()}`}
              />

              {/* Name */}
              <div>
                <label className="block font-sans text-sm font-medium text-brown-700 mb-1.5">Nom *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                  placeholder="Nom du partenaire"
                />
              </div>

              {/* Description */}
              <SmartBilingualField
                label="Description"
                valueFr={form.description.fr}
                valueEn={form.description.en}
                onChangeFr={(v) => setForm({ ...form, description: { ...form.description, fr: v } })}
                onChangeEn={(v) => setForm({ ...form, description: { ...form.description, en: v } })}
                multiline
                context={{ name: form.name, type: "partenariat" }}
              />

              {/* Link */}
              <div>
                <label className="block font-sans text-sm font-medium text-brown-700 mb-1.5">Lien externe</label>
                <input
                  type="url"
                  value={form.externalLink}
                  onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
                  className="w-full bg-cream-100 border border-blush-200 rounded-xl px-4 py-3 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                  placeholder="https://..."
                />
              </div>

              {/* Visible toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, visible: !form.visible })}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${form.visible ? "bg-terracotta-500" : "bg-blush-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.visible ? "translate-x-5" : "translate-x-1"}`} />
                </button>
                <span className="font-sans text-sm text-brown-600">
                  {form.visible ? "Visible sur le site" : "Masqué"}
                </span>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-sans font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    {editingId ? "Mettre à jour" : "Ajouter"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
