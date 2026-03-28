"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Eye, EyeOff, X, Save } from "lucide-react";
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
import { usePortfolio } from "@/hooks/useFirestore";
import {
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  updatePortfolioOrder,
} from "@/lib/firestore";
import { PortfolioItem, MediaCategory, MediaItem, CATEGORY_LABELS } from "@/types";
import { getYouTubeId, deleteFileByUrl } from "@/lib/storage";
import SmartBilingualField from "@/components/admin/SmartBilingualField";
import CoverEditor from "@/components/admin/CoverEditor";
import GalleryEditor from "@/components/admin/GalleryEditor";
import SortableItem from "@/components/admin/SortableItem";
import toast from "react-hot-toast";

const CATEGORIES: MediaCategory[] = ["hotel", "paysage", "lifestyle", "drone", "activity"];

const emptyForm = {
  title: { fr: "", en: "" },
  location: "",
  category: "hotel" as MediaCategory,
  description: { fr: "", en: "" },
  cover: null as MediaItem | null,
  gallery: [] as MediaItem[],
  visible: true,
};

export default function PortfolioAdmin() {
  const { items } = usePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    await updatePortfolioOrder(reordered.map((item, idx) => ({ id: item.id, order: idx })));
  };

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: PortfolioItem) => {
    const fullGallery = item.gallery || [];
    setForm({
      title: item.title,
      location: item.location,
      category: item.category,
      description: item.description,
      cover: fullGallery[0] || null,
      gallery: fullGallery.slice(1),
      visible: item.visible,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.fr) {
      toast.error("Le titre FR est requis.");
      return;
    }

    setSaving(true);
    try {
      const fullGallery: MediaItem[] = form.cover
        ? [form.cover, ...form.gallery]
        : form.gallery;

      // Derive legacy fields from cover for backward compat
      const cover = form.cover;
      const imageUrl = cover?.type === "image" ? cover.url : "";
      const mp4VideoUrl = cover?.platform === "mp4" ? cover.url : "";
      const videoUrl = cover?.platform === "youtube" ? cover.url : "";
      const type: "image" | "video" = cover?.type === "video" ? "video" : "image";

      const data = {
        title: form.title,
        location: form.location,
        category: form.category,
        description: form.description,
        type,
        imageUrl,
        thumbnailUrl: "",
        mp4VideoUrl,
        videoUrl,
        gallery: fullGallery,
        visible: form.visible,
        order: editingId
          ? (items.find((i) => i.id === editingId)?.order ?? items.length)
          : items.length,
      };

      if (editingId) {
        await updatePortfolioItem(editingId, data);
        toast.success("Média mis à jour !");
      } else {
        await addPortfolioItem(data);
        toast.success("Média ajouté !");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("[Portfolio] Erreur sauvegarde:", err);
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id);
      if (item) {
        if (item.imageUrl) await deleteFileByUrl(item.imageUrl);
        if (item.thumbnailUrl) await deleteFileByUrl(item.thumbnailUrl);
      }
      await deletePortfolioItem(id);
      toast.success("Média supprimé.");
      setDeleteConfirm(null);
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const toggleVisible = async (item: PortfolioItem) => {
    await updatePortfolioItem(item.id, { visible: !item.visible });
    toast.success(item.visible ? "Masqué" : "Visible");
  };

  const getListThumbnail = (item: PortfolioItem) => {
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
    return item.thumbnailUrl || item.imageUrl || "/images/placeholders/portfolio.svg";
  };

  const getListBadge = (item: PortfolioItem) => {
    const first = item.gallery?.[0];
    if (first?.platform === "mp4") return "MP4";
    if (first?.platform === "youtube") return "YT";
    if (first?.type === "image") return "Photo";
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Portfolio</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">{items.length} médias</p>
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
          <p className="font-sans text-brown-400 mb-4">Aucun média pour l&apos;instant</p>
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
                    {/* Thumbnail */}
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-blush-100">
                      {item.gallery?.[0]?.platform === "mp4" ? (
                        <video
                          src={item.gallery[0].url}
                          className="w-full h-full object-cover"
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                      ) : (
                        <Image
                          src={getListThumbnail(item)}
                          alt={item.title.fr}
                          fill
                          className="object-cover"
                        />
                      )}
                      {getListBadge(item) && (
                        <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded font-sans font-medium">
                          {getListBadge(item)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-medium text-brown-900 truncate">{item.title.fr}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-sans text-xs text-brown-400">{item.location}</span>
                        <span className="text-brown-200">·</span>
                        <span className="font-sans text-xs text-terracotta-400">{CATEGORY_LABELS[item.category].fr}</span>
                        {item.gallery && item.gallery.length > 1 && (
                          <>
                            <span className="text-brown-200">·</span>
                            <span className="font-sans text-xs text-brown-400">{item.gallery.length} médias</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisible(item); }}
                        className="p-3 rounded-lg text-brown-300 hover:text-brown-600 hover:bg-blush-100 transition-colors"
                        title={item.visible ? "Masquer" : "Afficher"}
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
                {editingId ? "Modifier le média" : "Ajouter un média"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-blush-100 text-brown-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6">

              {/* ── Section 1: Cover ── */}
              <div className="bg-blush-50 rounded-2xl p-4">
                <CoverEditor
                  item={form.cover}
                  onChange={(cover) => setForm({ ...form, cover })}
                  storagePath={`portfolio/${Date.now()}`}
                />
              </div>

              {/* ── Section 2: Gallery ── */}
              <div className="bg-blush-50 rounded-2xl p-4">
                <GalleryEditor
                  items={form.gallery}
                  onChange={(gallery) => setForm({ ...form, gallery })}
                  storagePath={`portfolio/gallery/${Date.now()}`}
                />
              </div>

              {/* ── Section 3: Text info ── */}
              <div className="space-y-4">
                <p className="font-sans text-xs font-semibold text-brown-400 uppercase tracking-wider">
                  Informations
                </p>

                <SmartBilingualField
                  label="Titre"
                  valueFr={form.title.fr}
                  valueEn={form.title.en}
                  onChangeFr={(v) => setForm({ ...form, title: { ...form.title, fr: v } })}
                  onChangeEn={(v) => setForm({ ...form, title: { ...form.title, en: v } })}
                  context={{ location: form.location, category: form.category, type: "portfolio" }}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-sans text-xs font-medium text-brown-600 mb-1">Lieu</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full bg-cream-100 border border-blush-200 rounded-xl px-3 py-2.5 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                      placeholder="Paris, France"
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-xs font-medium text-brown-600 mb-1">Catégorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as MediaCategory })}
                      className="w-full bg-cream-100 border border-blush-200 rounded-xl px-3 py-2.5 font-sans text-sm text-brown-900 focus:border-terracotta-400 transition-colors"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat].fr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <SmartBilingualField
                  label="Description"
                  valueFr={form.description.fr}
                  valueEn={form.description.en}
                  onChangeFr={(v) => setForm({ ...form, description: { ...form.description, fr: v } })}
                  onChangeEn={(v) => setForm({ ...form, description: { ...form.description, en: v } })}
                  multiline
                  context={{ title: form.title.fr, location: form.location, category: form.category, type: "portfolio" }}
                />

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
                    {editingId ? "Mettre à jour" : "Ajouter au portfolio"}
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
