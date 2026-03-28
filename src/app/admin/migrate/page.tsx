"use client";

import { useState } from "react";
import { Play, CheckCircle, AlertCircle, SkipForward, Search } from "lucide-react";
import { migrateAllToGallery, diagnoseAll, MigrationLog, DiagnosticItem } from "@/scripts/migrateToGallery";

type MigrateStatus = "idle" | "running" | "done" | "error";
type DiagStatus = "idle" | "running" | "done";

export default function MigratePage() {
  const [migrateStatus, setMigrateStatus] = useState<MigrateStatus>("idle");
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [diagStatus, setDiagStatus] = useState<DiagStatus>("idle");
  const [diagItems, setDiagItems] = useState<DiagnosticItem[]>([]);

  const migrated = logs.filter((l) => l.status === "migrated").length;
  const skipped = logs.filter((l) => l.status === "skipped").length;
  const errors = logs.filter((l) => l.status === "error").length;

  const runMigration = async () => {
    setMigrateStatus("running");
    setLogs([]);
    try {
      const result = await migrateAllToGallery();
      setLogs(result);
      setMigrateStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setLogs([{ collection: "-", id: "-", status: "error", message }]);
      setMigrateStatus("error");
    }
  };

  const runDiagnosis = async () => {
    setDiagStatus("running");
    setDiagItems([]);
    try {
      const result = await diagnoseAll();
      setDiagItems(result);
      setDiagStatus("done");
    } catch (err) {
      console.error(err);
      setDiagStatus("idle");
    }
  };

  const busy = migrateStatus === "running" || diagStatus === "running";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium text-brown-900">Migration gallery[]</h1>
        <p className="font-sans text-sm text-brown-400 mt-1">
          Convertit les anciens champs (imageUrl, videoUrl, mp4VideoUrl…) vers{" "}
          <code className="bg-blush-100 px-1 rounded text-xs">gallery[]</code>.
          Patch aussi le champ <code className="bg-blush-100 px-1 rounded text-xs">format</code> manquant sur les items déjà migrés.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={runMigration}
          disabled={busy}
          className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white font-sans font-medium px-5 py-3 rounded-xl transition-colors text-sm"
        >
          {migrateStatus === "running" ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Migration…
            </>
          ) : (
            <>
              <Play size={15} />
              Lancer la migration
            </>
          )}
        </button>

        <button
          onClick={runDiagnosis}
          disabled={busy}
          className="flex items-center gap-2 bg-white border border-blush-200 hover:bg-blush-50 disabled:opacity-60 text-brown-700 font-sans font-medium px-5 py-3 rounded-xl transition-colors text-sm"
        >
          {diagStatus === "running" ? (
            <>
              <div className="w-4 h-4 border-2 border-brown-200 border-t-brown-600 rounded-full animate-spin" />
              Lecture…
            </>
          ) : (
            <>
              <Search size={15} />
              Diagnostiquer
            </>
          )}
        </button>
      </div>

      {/* ── Migration summary ── */}
      {migrateStatus !== "idle" && migrateStatus !== "running" && (
        <div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
              <p className="font-sans text-2xl font-semibold text-green-700">{migrated}</p>
              <p className="font-sans text-xs text-green-600">Mis à jour</p>
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
        </div>
      )}

      {/* ── Diagnostic table ── */}
      {diagStatus === "done" && diagItems.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold text-brown-400 uppercase tracking-wider mb-3">
            Diagnostic — {diagItems.length} documents
          </p>
          <div className="bg-white border border-blush-100 rounded-2xl overflow-hidden">
            <div className="divide-y divide-blush-100">
              {diagItems.map((item, i) => (
                <div key={i} className="px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-semibold text-brown-700 truncate flex-1">
                      {item.name}
                    </span>
                    <span className="font-sans text-[10px] text-brown-400 flex-shrink-0">
                      {item.collection} · {item.galleryLength} media{item.galleryLength !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {item.cover ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-2">
                      <p className="font-sans text-[11px] text-brown-400">
                        <span className="text-brown-500">platform:</span> {item.cover.platform}
                      </p>
                      <p className="font-sans text-[11px] text-brown-400">
                        <span className="text-brown-500">type:</span> {item.cover.type}
                      </p>
                      <p className="font-sans text-[11px]">
                        <span className="text-brown-500">format stocké:</span>{" "}
                        <span className={item.cover.storedFormat === "MANQUANT" ? "text-red-500 font-semibold" : "text-green-600"}>
                          {item.cover.storedFormat}
                        </span>
                      </p>
                      <p className="font-sans text-[11px]">
                        <span className="text-brown-500">format calculé:</span>{" "}
                        <span className={item.cover.format === "vertical" ? "text-terracotta-500 font-semibold" : "text-brown-400"}>
                          {item.cover.format}
                        </span>
                      </p>
                      <p className="font-sans text-[11px] text-brown-400 col-span-2 truncate">
                        <span className="text-brown-500">url:</span> {item.cover.urlTail}
                      </p>
                      {item.cover.hasThumbnail && (
                        <p className="font-sans text-[11px] text-green-600 col-span-2">✓ thumbnailUrl présent</p>
                      )}
                    </div>
                  ) : (
                    <p className="font-sans text-[11px] text-brown-300 pl-2">gallery[] vide</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
