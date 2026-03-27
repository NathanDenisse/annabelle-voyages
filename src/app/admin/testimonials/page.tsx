"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Eye, EyeOff, X, GripVertical } from "lucide-react";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTestimonials } from "@/hooks/useFirestore";
import {
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateTestimonialOrder,
} from "@/lib/firestore";
import { Testimonial } from "@/types";
import SmartBilingualField from "@/components/admin/SmartBilingualField";
import toast from "react-hot-toast";

// ── Auto-save debounced row ──
function TestimonialRow({
  item,
  onDelete,
  onToggleVisible,
}: {
  item: Testimonial;
  onDelete: (id: string) => void;
  onToggleVisible: (item: Testimonial) => void;
}) {
  const [textFr, setTextFr] = useState(item.text.fr);
  const [textEn, setTextEn] = useState(item.text.en);
  const [roleFr, setRoleFr] = useState(item.role.fr);
  const [roleEn, setRoleEn] = useState(item.role.en);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const save = useCallback(
    (tf: string, te: string, rf: string, re: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateTestimonial(item.id, {
            text: { fr: tf, en: te },
            role: { fr: rf, en: re },
          });
        } catch {
          toast.error("Erreur de sauvegarde.");
        }
      }, 800);
    },
    [item.id]
  );

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleTextFr = (v: string) => { setTextFr(v); save(v, textEn, roleFr, roleEn); };
  const handleTextEn = (v: string) => { setTextEn(v); save(textFr, v, roleFr, roleEn); };
  const handleRoleFr = (v: string) => { setRoleFr(v); save(textFr, textEn, v, roleEn); };
  const handleRoleEn = (v: string) => { setRoleEn(v); save(textFr, textEn, roleFr, v); };

  // Translate FR → EN for text
  const translateText = async () => {
    if (!textFr) return;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textFr, from: "fr", to: "en" }),
      });
      const data = await res.json();
      if (data.translation) {
        setTextEn(data.translation);
        save(textFr, data.translation, roleFr, roleEn);
        toast.success("Texte traduit !");
      }
    } catch {
      toast.error("Erreur de traduction.");
    }
  };

  // Translate FR → EN for role
  const translateRole = async () => {
    if (!roleFr) return;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: roleFr, from: "fr", to: "en" }),
      });
      const data = await res.json();
      if (data.translation) {
        setRoleEn(data.translation);
        save(textFr, textEn, roleFr, data.translation);
        toast.success("Rôle traduit !");
      }
    } catch {
      toast.error("Erreur de traduction.");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border border-blush-100 p-5 ${!item.visible ? "opacity-60" : ""}`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-brown-300 hover:text-brown-500 hover:bg-blush-100 transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <span className="flex-1 font-sans text-xs text-brown-400 truncate italic">
          {textFr || "Nouveau témoignage"}
        </span>
        <button
          onClick={() => onToggleVisible(item)}
          className="p-2 rounded-lg text-brown-300 hover:text-brown-600 hover:bg-blush-100 transition-colors"
        >
          {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg text-brown-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Text bilingual */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-sans text-xs font-medium text-brown-500 uppercase tracking-wide">
            Citation
          </label>
          <button
            type="button"
            onClick={translateText}
            className="font-sans text-xs text-terracotta-500 hover:underline"
          >
            Traduire FR → EN
          </button>
        </div>
        <SmartBilingualField
          label=""
          valueFr={textFr}
          valueEn={textEn}
          onChangeFr={handleTextFr}
          onChangeEn={handleTextEn}
          multiline
        />
      </div>

      {/* Role bilingual */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-sans text-xs font-medium text-brown-500 uppercase tracking-wide">
            Rôle / Type
          </label>
          <button
            type="button"
            onClick={translateRole}
            className="font-sans text-xs text-terracotta-500 hover:underline"
          >
            Traduire FR → EN
          </button>
        </div>
        <SmartBilingualField
          label=""
          valueFr={roleFr}
          valueEn={roleEn}
          onChangeFr={handleRoleFr}
          onChangeEn={handleRoleEn}
        />
      </div>
    </div>
  );
}

// ── Main page ──
export default function TestimonialsAdmin() {
  const { items } = useTestimonials();
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
    await updateTestimonialOrder(reordered.map((item, idx) => ({ id: item.id, order: idx })));
  };

  const handleAdd = async () => {
    await addTestimonial({
      text: { fr: "", en: "" },
      role: { fr: "", en: "" },
      order: items.length,
      visible: true,
    });
    toast.success("Témoignage ajouté.");
  };

  const handleDelete = async (id: string) => {
    await deleteTestimonial(id);
    toast.success("Témoignage supprimé.");
    setDeleteConfirm(null);
  };

  const handleToggleVisible = async (item: Testimonial) => {
    await updateTestimonial(item.id, { visible: !item.visible });
    toast.success(item.visible ? "Masqué" : "Visible");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-brown-900">Témoignages</h1>
          <p className="font-sans text-sm text-brown-400 mt-0.5">
            {items.length} témoignage{items.length !== 1 ? "s" : ""} — sauvegarde auto
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-blush-100">
          <p className="font-sans text-brown-400 mb-4">Aucun témoignage pour l&apos;instant</p>
          <button onClick={handleAdd} className="text-terracotta-500 font-medium font-sans text-sm hover:underline">
            + Ajouter le premier
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item) => (
                <TestimonialRow
                  key={item.id}
                  item={item}
                  onDelete={(id) => setDeleteConfirm(id)}
                  onToggleVisible={handleToggleVisible}
                />
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
    </div>
  );
}
