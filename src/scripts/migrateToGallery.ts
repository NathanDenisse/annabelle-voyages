/**
 * Migration script: populate gallery[] from legacy fields.
 *
 * For each portfolio and partnership document in Firestore:
 * - If gallery[] is already non-empty → skip
 * - Otherwise build gallery[] from legacy fields (imageUrl, videoUrl, mp4VideoUrl, etc.)
 *   and write it back to the document
 *
 * Run via the /admin/migrate page (client-side, authenticated).
 */

import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MediaItem } from "@/types";

export interface MigrationLog {
  collection: string;
  id: string;
  status: "migrated" | "skipped" | "error";
  message: string;
}

// ─── Legacy field helpers ────────────────────────────────────────────────────

function detectYouTubeFormat(url: string): "vertical" | "horizontal" {
  return /youtube\.com\/shorts\/|youtu\.be\/shorts\//.test(url) ? "vertical" : "horizontal";
}

function buildGalleryFromLegacyPortfolio(raw: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];

  const mp4Url = raw.mp4VideoUrl as string | undefined;
  const videoUrl = raw.videoUrl as string | undefined;
  const imageUrl = raw.imageUrl as string | undefined;
  const thumbUrl = raw.thumbnailUrl as string | undefined;

  if (mp4Url) {
    items.push({ type: "video", url: mp4Url, platform: "mp4", format: "vertical", thumbnailUrl: thumbUrl });
  }
  if (videoUrl) {
    items.push({ type: "video", url: videoUrl, platform: "youtube", format: detectYouTubeFormat(videoUrl) });
  }
  if (imageUrl) {
    items.push({ type: "image", url: imageUrl });
  }

  return items;
}

function buildGalleryFromLegacyPartnership(raw: Record<string, unknown>): MediaItem[] {
  const items: MediaItem[] = [];

  const mp4Url = raw.mp4VideoUrl as string | undefined;
  const videoUrl = raw.videoUrl as string | undefined;
  const images = raw.images as string[] | undefined;

  if (mp4Url) {
    items.push({ type: "video", url: mp4Url, platform: "mp4", format: "vertical" });
  }
  if (videoUrl) {
    items.push({ type: "video", url: videoUrl, platform: "youtube", format: detectYouTubeFormat(videoUrl) });
  }
  if (images?.length) {
    for (const url of images) {
      items.push({ type: "image", url });
    }
  }

  return items;
}

// ─── Migration runners ───────────────────────────────────────────────────────

async function migrateCollection(
  collectionName: string,
  buildGallery: (raw: Record<string, unknown>) => MediaItem[]
): Promise<MigrationLog[]> {
  const logs: MigrationLog[] = [];
  const snap = await getDocs(collection(db, collectionName));

  for (const docSnap of snap.docs) {
    const raw = docSnap.data() as Record<string, unknown>;
    const existingGallery = raw.gallery as unknown[] | undefined;

    if (Array.isArray(existingGallery) && existingGallery.length > 0) {
      logs.push({ collection: collectionName, id: docSnap.id, status: "skipped", message: `gallery[] déjà présent (${existingGallery.length} items)` });
      continue;
    }

    const gallery = buildGallery(raw);

    if (gallery.length === 0) {
      logs.push({ collection: collectionName, id: docSnap.id, status: "skipped", message: "Aucun champ legacy à migrer" });
      continue;
    }

    try {
      await updateDoc(doc(db, collectionName, docSnap.id), { gallery });
      logs.push({ collection: collectionName, id: docSnap.id, status: "migrated", message: `${gallery.length} media(s) migrés` });
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
