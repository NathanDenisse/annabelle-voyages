/**
 * Migration script: populate gallery[] from legacy fields + fix missing format.
 *
 * Pass 1 — build gallery[] from legacy fields if gallery is empty.
 * Pass 2 — for every item in gallery[], patch missing format field.
 *
 * Run via the /admin/migrate page (client-side, authenticated).
 */

import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MediaItem } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MigrationLog {
  collection: string;
  id: string;
  status: "migrated" | "skipped" | "error";
  message: string;
}

export interface DiagnosticItem {
  collection: string;
  id: string;
  name: string;
  galleryLength: number;
  cover: {
    type: string;
    platform: string;
    format: string;
    storedFormat: string;
    urlTail: string;
    hasThumbnail: boolean;
  } | null;
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function inferFormat(item: Record<string, unknown>): "vertical" | "horizontal" {
  const url = (item.url as string) || "";
  const platform = item.platform as string | undefined;

  if (platform === "mp4") return "vertical";
  if (platform === "youtube") {
    return /youtube\.com\/shorts\/|youtu\.be\/shorts\//.test(url) ? "vertical" : "horizontal";
  }
  // images default horizontal
  return "horizontal";
}

/** detectVideoSource inline (no import from storage to keep script self-contained) */
function detectSource(url: string): string {
  if (!url) return "unknown";
  if (/youtube\.com\/shorts\//.test(url)) return "youtube-short";
  if (/youtube\.com\/watch/.test(url) || /youtu\.be\//.test(url) || /youtube\.com\/embed\//.test(url)) return "youtube";
  if (/instagram\.com\/reel\//.test(url) || /instagram\.com\/p\//.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  return "unknown";
}

// ─── Legacy field builders ───────────────────────────────────────────────────

function buildGalleryFromLegacyPortfolio(raw: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];
  const mp4Url = raw.mp4VideoUrl as string | undefined;
  const videoUrl = raw.videoUrl as string | undefined;
  const imageUrl = raw.imageUrl as string | undefined;
  const thumbUrl = raw.thumbnailUrl as string | undefined;

  if (mp4Url) items.push({ type: "video", url: mp4Url, platform: "mp4", format: "vertical", thumbnailUrl: thumbUrl });
  if (videoUrl) {
    const format = /youtube\.com\/shorts\/|youtu\.be\/shorts\//.test(videoUrl) ? "vertical" : "horizontal";
    items.push({ type: "video", url: videoUrl, platform: "youtube", format });
  }
  if (imageUrl) items.push({ type: "image", url: imageUrl });
  return items;
}

function buildGalleryFromLegacyPartnership(raw: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];
  const mp4Url = raw.mp4VideoUrl as string | undefined;
  const videoUrl = raw.videoUrl as string | undefined;
  const images = raw.images as string[] | undefined;

  if (mp4Url) items.push({ type: "video", url: mp4Url, platform: "mp4", format: "vertical" });
  if (videoUrl) {
    const format = /youtube\.com\/shorts\/|youtu\.be\/shorts\//.test(videoUrl) ? "vertical" : "horizontal";
    items.push({ type: "video", url: videoUrl, platform: "youtube", format });
  }
  if (images?.length) {
    for (const url of images) items.push({ type: "image", url });
  }
  return items;
}

// ─── Core migration ──────────────────────────────────────────────────────────

async function migrateCollection(
  collectionName: string,
  buildLegacy: (raw: Record<string, unknown>) => MediaItem[]
): Promise<MigrationLog[]> {
  const logs: MigrationLog[] = [];
  const snap = await getDocs(collection(db, collectionName));

  for (const docSnap of snap.docs) {
    const raw = docSnap.data() as Record<string, unknown>;
    const existingGallery = raw.gallery as Record<string, unknown>[] | undefined;

    let gallery: MediaItem[];
    let note = "";

    if (Array.isArray(existingGallery) && existingGallery.length > 0) {
      // Pass 2 — fix missing format on existing items
      const fixed = existingGallery.map((item) => {
        if (item.format) return item as unknown as MediaItem;
        return { ...item, format: inferFormat(item) } as unknown as MediaItem;
      });

      const hadMissingFormat = fixed.some((item, i) => (item as unknown as Record<string, unknown>).format !== existingGallery[i].format);
      if (!hadMissingFormat) {
        logs.push({ collection: collectionName, id: docSnap.id, status: "skipped", message: `gallery[] OK (${existingGallery.length} items, format présent)` });
        continue;
      }
      gallery = fixed;
      note = `format ajouté sur ${fixed.filter((item, i) => !existingGallery[i].format).length} item(s)`;
    } else {
      // Pass 1 — build from legacy
      gallery = buildLegacy(raw);
      if (gallery.length === 0) {
        logs.push({ collection: collectionName, id: docSnap.id, status: "skipped", message: "Aucun champ legacy et gallery vide" });
        continue;
      }
      note = `${gallery.length} media(s) depuis champs legacy`;
    }

    try {
      await updateDoc(doc(db, collectionName, docSnap.id), { gallery });
      logs.push({ collection: collectionName, id: docSnap.id, status: "migrated", message: note });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logs.push({ collection: collectionName, id: docSnap.id, status: "error", message });
    }
  }

  return logs;
}

export async function migrateAllToGallery(): Promise<MigrationLog[]> {
  const [portfolioLogs, partnershipLogs] = await Promise.all([
    migrateCollection("portfolio", buildGalleryFromLegacyPortfolio),
    migrateCollection("partnerships", buildGalleryFromLegacyPartnership),
  ]);
  return [...portfolioLogs, ...partnershipLogs];
}

// ─── Diagnostic ──────────────────────────────────────────────────────────────

async function diagnoseCollection(collectionName: string, nameField: string): Promise<DiagnosticItem[]> {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((docSnap) => {
    const raw = docSnap.data() as Record<string, unknown>;
    const gallery = (raw.gallery as Record<string, unknown>[]) ?? [];
    const first = gallery[0] ?? null;
    const name = (raw[nameField] as string) || (typeof raw.name === "string" ? raw.name : docSnap.id);

    let cover: DiagnosticItem["cover"] = null;
    if (first) {
      const url = (first.url as string) || "";
      const platform = (first.platform as string) || "—";
      const storedFormat = (first.format as string) || "MANQUANT";
      const computed = inferFormat(first);
      const detectedSource = detectSource(url);
      cover = {
        type: (first.type as string) || "—",
        platform,
        format: computed,
        storedFormat,
        urlTail: url.length > 50 ? "…" + url.slice(-50) : url,
        hasThumbnail: !!first.thumbnailUrl,
      };
      // Include detected source for videos
      if (platform === "youtube") {
        cover.platform = `youtube (${detectedSource})`;
      }
    }

    return { collection: collectionName, id: docSnap.id, name: String(name), galleryLength: gallery.length, cover };
  });
}

export async function diagnoseAll(): Promise<DiagnosticItem[]> {
  const [portfolioItems, partnershipItems] = await Promise.all([
    diagnoseCollection("portfolio", "title"),
    diagnoseCollection("partnerships", "name"),
  ]);
  return [...portfolioItems, ...partnershipItems];
}
