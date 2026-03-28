"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, Eye, EyeOff, X, Save, Upload } from "lucide-react";
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
import { getYouTubeId, uploadSingleImage, deleteFileByUrl } from "@/lib/storage";
import SmartBilingualField from "@/components/admin/SmartBilingualField";
import GalleryEditor from "@/components/admin/GalleryEditor";
import SortableItem from "@/components/admin/SortableItem";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  description: { fr: "", en: "" },
  logoUrl: "",
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

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
    await updatePartnershipOrder(reordered.map((item, idx) => ({ id: item.id, order: idx })));
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
      gallery: item.gallery || [],
      externalLink: item.externalLink,
      visible: item.visible,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      if (form.logoUrl) await deleteFileByUrl(form.logoUrl);
      const url = await uploadSingleImage(file, `partnerships/${Date.now()}/logo.jpg`, 600);
      setForm((prev) => ({ ...prev, logoUrl: url }));
      toast.success("Logo uploadé !");
    } catch {
      toast.error("Erreur upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Le nom est requis.");
      return;
    }
    setSaving(true);
    try {
      const fullGallery: MediaItem[] = form.gallery;

      // Derive legacy fields from gallery[0] (cover) for backward compat
      const cover = fullGallery[0] ?? null;
      const mp4VideoUrl = cover?.platform === "mp4" ? cover.url : "";
      const videoUrl = cover?.platform === "youtube" ? cover.url : "";

      const data = {
        name: form.name,
        description: form.description,
        logoUrl: form.logoUrl || "",
        images: [] as string[],
        videoUrl,
        mp4VideoUrl,
        gallery: fullGallery,
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
      console.error("[Partnerships] Erreur sauvegarde:", err);
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id);
      if (item?.logoUrl) await deleteFileByUrl(item.logoUrl);
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

  const getListThumbnail = (item: Partnership) => {
    const first = item.gallery?.[0];
    if (first?.type === "image") return first.url;
    if (first?.platform === "youtube") {
      const id = getYouTubeId(first.url);
      if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    if (item.videoUrl) {
      const id = getYouTubeId(item.videoUrl);
      if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    return item.logoUrl || null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Partenariats</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">
            {items.length} partenaire{items.length > 1 ? "s" : ""}
          </p>
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
              {items.map((item) => {
                const thumb = getListThumbnail(item);
                const hasMp4Cover = item.gallery?.[0]?.platform === "mp4";
                return (
                  <SortableItem key={item.id} id={item.id}>
                    <div
                      onClick={() => openEdit(item)}
                      className={`bg-white rounded-2xl border border-blush-100 p-4 pl-10 flex items-center gap-4 cursor-pointer active:bg-blush-100/50 transition-colors ${!item.visible ? "opacity-60" : ""}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-blush-100">
                        {hasMp4Cover ? (
                          <video
                            src={item.gallery![0].url}
                            className="w-full h-full object-cover"
                            muted autoPlay loop playsInline
                          />
                        ) : thumb ? (
                          <Image src={thumb} alt={item.name} fill className="object-cover" />
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
                        <p className="font-sans text-sm font-medium text-brown-900">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-sans text-xs text-brown-400 truncate">{item.description.fr}</p>
                          {item.gallery && item.gallery.length > 0 && (
                            <span className="font-sans text-xs text-brown-300 flex-shrink-0">
                              · {item.gallery.length} média{item.gallery.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
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
                );
              })}
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
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-blush-200 rounded-xl font-sans text-sm text-brown-600 hover:bg-blush-100">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-sans text-sm font-medium">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-blush-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="font-serif text-lg font-medium text-brown-900">
                {editingId ? "Modifier le partenariat" : "Ajouter un partenariat"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-blush-100 text-brown-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6">

              {/* ── Section 1: Médias (cover = gallery[0]) ── */}
              <div className="bg-blush-50 rounded-2xl p-4">
                <GalleryEditor
                  items={form.gallery}
                  onChange={(gallery) => setForm({ ...form, gallery })}
                  storagePath={`partnerships/${Date.now()}`}
                />
              </div>

              {/* ── Section 3: Text info ── */}
              <div className="space-y-4">
                <p className="font-sans text-xs font-semibold text-brown-400 uppercase tracking-wider">
                  Informations
                </p>

                {/* Logo */}
                <div>
                  <label className="block font-sans text-sm font-medium text-brown-700 mb-2">
                    Logo (optionnel)
                  </label>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-blush-100 flex-shrink-0">
                      {form.logoUrl ? (
                        <Image src={form.logoUrl} alt="Logo" fill className="object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brown-300">
                          <Upload size={18} />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => logoRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex-1 py-3 border-2 border-dashed border-blush-200 rounded-xl font-sans text-sm text-brown-500 hover:border-terracotta-300 hover:text-terracotta-500 transition-colors"
                    >
                      {uploadingLogo ? "Upload en cours..." : form.logoUrl ? "Changer le logo" : "Choisir un logo"}
                    </button>
                  </div>
                </div>

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

                <SmartBilingualField
                  label="Description"
                  valueFr={form.description.fr}
                  valueEn={form.description.en}
                  onChangeFr={(v) => setForm({ ...form, description: { ...form.description, fr: v } })}
                  onChangeEn={(v) => setForm({ ...form, description: { ...form.description, en: v } })}
                  multiline
                  context={{ name: form.name, type: "partenariat" }}
                />

                {/* External link */}
                <div>
                  <label className="block font-sans text-sm font-medium text-brown-700 mb-1.5">
                    Lien externe
                  </label>
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
                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                      form.visible ? "bg-terracotta-500" : "bg-blush-200"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.visible ? "translate-x-5" : "translate-x-1"
                    }`} />
                  </button>
                  <span className="font-sans text-sm text-brown-600">
                    {form.visible ? "Visible sur le site" : "Masqué"}
                  </span>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="p-5 pt-0 sticky bottom-0 bg-white border-t border-blush-100">
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
