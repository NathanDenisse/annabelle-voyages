"use client";

import { useState } from "react";
import { Play, CheckCircle, AlertCircle, SkipForward } from "lucide-react";
import { migrateAllToGallery, MigrationLog } from "@/scripts/migrateToGallery";

type Status = "idle" | "running" | "done" | "error";

export default function MigratePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<MigrationLog[]>([]);

  const migrated = logs.filter((l) => l.status === "migrated").length;
  const skipped = logs.filter((l) => l.status === "skipped").length;
  const errors = logs.filter((l) => l.status === "error").length;

  const run = async () => {
    setStatus("running");
    setLogs([]);
    try {
      const result = await migrateAllToGallery();
      setLogs(result);
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setLogs([{ collection: "-", id: "-", status: "error", message }]);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium text-brown-900">Migration gallery[]</h1>
        <p className="font-sans text-sm text-brown-400 mt-1">
          Convertit les anciens champs (imageUrl, videoUrl, mp4VideoUrl…) vers le champ{" "}
          <code className="bg-blush-100 px-1 rounded text-xs">gallery[]</code> unifié.
          Les documents déjà migrés sont ignorés.
        </p>
      </div>

      {/* Run button */}
      <button
        onClick={run}
        disabled={status === "running"}
        className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-sans font-medium px-5 py-3 rounded-xl transition-colors text-sm mb-6"
      >
        {status === "running" ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Migration en cours…
          </>
        ) : (
          <>
            <Play size={15} />
            Lancer la migration
          </>
        )}
      </button>

      {/* Summary */}
      {status !== "idle" && status !== "running" && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <p className="font-sans text-2xl font-semibold text-green-700">{migrated}</p>
            <p className="font-sans text-xs text-green-600">Migrés</p>
          </div>
          <div className="flex-1 bg-blush-50 border border-blush-200 rounded-xl px-4 py-3 text-center">
            <p className="font-sans text-2xl font-semibold text-brown-500">{skipped}</p>
            <p className="font-sans text-xs text-brown-400">Ignorés</p>
          </div>
          <div className="flex-1 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
            <p className="font-sans text-2xl font-semibold text-red-600">{errors}</p>
            <p className="font-sans text-xs text-red-500">Erreurs</p>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-white border border-blush-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-blush-100">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                {log.status === "migrated" && <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />}
                {log.status === "skipped" && <SkipForward size={15} className="text-brown-300 mt-0.5 flex-shrink-0" />}
                {log.status === "error" && <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-xs font-medium text-brown-700 truncate">
                    <span className="text-brown-400">{log.collection}/</span>{log.id}
                  </p>
                  <p className="font-sans text-xs text-brown-400 mt-0.5">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
