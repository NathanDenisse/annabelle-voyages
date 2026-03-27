"use client";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-2 font-sans text-xs">
      {status === "saving" && (
        <>
          <div className="w-3 h-3 border-2 border-brown-200 border-t-terracotta-500 rounded-full animate-spin" />
          <span className="text-brown-400">Sauvegarde...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <span className="text-green-500">&#10003;</span>
          <span className="text-green-600">Sauvegardé</span>
        </>
      )}
      {status === "error" && (
        <span className="text-red-500">Erreur de sauvegarde</span>
      )}
    </div>
  );
}
