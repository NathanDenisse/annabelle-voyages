"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Mail, MailOpen, Trash2, Reply, Calendar } from "lucide-react";
import { useMessages } from "@/hooks/useFirestore";
import { markMessageRead, deleteMessage } from "@/lib/firestore";
import { ContactMessage } from "@/types";
import toast from "react-hot-toast";

export default function MessagesAdmin() {
  const { messages, loading, unreadCount } = useMessages();
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleOpen = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) {
      await markMessageRead(msg.id, true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMessage(id);
      if (selected?.id === id) setSelected(null);
      setDeleteConfirm(null);
      toast.success("Message supprimé.");
    } catch {
      toast.error("Erreur.");
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-brown-900">Messages</h1>
        <p className="font-sans text-sm text-brown-400 mt-0.5">
          {messages.length} message{messages.length > 1 ? "s" : ""}
          {unreadCount > 0 && (
            <span className="ml-2 bg-terracotta-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-terracotta-200 border-t-terracotta-500 rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-blush-100">
          <Mail size={32} className="text-brown-200 mx-auto mb-3" />
          <p className="font-sans text-brown-400">Aucun message pour l&apos;instant</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => handleOpen(msg)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                !msg.read
                  ? "border-terracotta-200 bg-terracotta-500/5"
                  : "border-blush-100"
              } ${selected?.id === msg.id ? "ring-2 ring-terracotta-300" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`mt-0.5 flex-shrink-0 ${!msg.read ? "text-terracotta-500" : "text-brown-300"}`}>
                  {msg.read ? <MailOpen size={18} /> : <Mail size={18} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-sans text-sm ${!msg.read ? "font-semibold text-brown-900" : "font-medium text-brown-700"}`}>
                      {msg.name}
                    </p>
                    {!msg.read && (
                      <span className="w-2 h-2 rounded-full bg-terracotta-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="font-sans text-xs text-brown-400">{msg.email}</p>
                  <p className={`font-sans text-sm mt-1 ${
                    selected?.id === msg.id ? "text-brown-700" : "text-brown-500 line-clamp-2"
                  }`}>
                    {msg.message}
                  </p>

                  {/* Expanded actions */}
                  {selected?.id === msg.id && (
                    <div className="mt-3 pt-3 border-t border-blush-100 flex items-center gap-3">
                      <a
                        href={`mailto:${msg.email}?subject=Re: Collaboration Annabelle Voyages`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-sans text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                      >
                        <Reply size={13} />
                        Répondre
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markMessageRead(msg.id, !msg.read);
                          toast.success(msg.read ? "Marqué non lu" : "Marqué lu");
                        }}
                        className="flex items-center gap-1.5 bg-blush-100 hover:bg-blush-200 text-brown-600 font-sans text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                      >
                        {msg.read ? <Mail size={13} /> : <MailOpen size={13} />}
                        {msg.read ? "Non lu" : "Lu"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(msg.id);
                        }}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-sans text-xs font-medium px-3 py-2 rounded-xl transition-colors ml-auto"
                      >
                        <Trash2 size={13} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="flex-shrink-0 flex items-center gap-1 text-brown-300">
                  <Calendar size={11} />
                  <span className="font-sans text-xs">{formatDate(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-serif text-lg font-medium text-brown-900 mb-2">Supprimer ce message ?</h3>
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
