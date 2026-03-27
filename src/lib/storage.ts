import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";
import { addStorageEntry, deleteStorageEntryByUrl } from "./firestore";
import imageCompression from "browser-image-compression";

export async function compressImage(
  file: File,
  maxWidthOrHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: quality,
  };
  return await imageCompression(file, options);
}

export async function uploadImage(
  file: File,
  path: string
): Promise<{ url: string; thumbnailUrl: string }> {
  const compressed = await compressImage(file, 1920, 0.8);
  const thumbnail = await compressImage(file, 400, 0.75);

  const mainRef = ref(storage, `${path}/original.jpg`);
  const thumbRef = ref(storage, `${path}/thumbnail.jpg`);

  await uploadBytes(mainRef, compressed);
  await uploadBytes(thumbRef, thumbnail);

  const [url, thumbnailUrl] = await Promise.all([
    getDownloadURL(mainRef),
    getDownloadURL(thumbRef),
  ]);

  // Track both files
  addStorageEntry({ fileName: `${path}/original.jpg`, fileSize: compressed.size, uploadedAt: new Date(), type: "image", url }).catch(() => {});
  addStorageEntry({ fileName: `${path}/thumbnail.jpg`, fileSize: thumbnail.size, uploadedAt: new Date(), type: "image", url: thumbnailUrl }).catch(() => {});

  return { url, thumbnailUrl };
}

export async function uploadSingleImage(
  file: File,
  path: string,
  maxSize: number = 1920
): Promise<string> {
  const compressed = await compressImage(file, maxSize, 0.85);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed);
  const url = await getDownloadURL(storageRef);
  // Track in Firestore
  addStorageEntry({ fileName: path, fileSize: compressed.size, uploadedAt: new Date(), type: "image", url }).catch(() => {});
  return url;
}

export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch {
    // ignore
  }
}

/** Delete a file in Firebase Storage by its download URL. Silently ignores errors. */
export async function deleteFileByUrl(url: string): Promise<void> {
  if (!url || !url.includes("firebasestorage")) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    // Remove tracking entry
    deleteStorageEntryByUrl(url).catch(() => {});
  } catch {
    // ignore — file may already be deleted or URL may be external
  }
}

// --- Video source detection ---

export type VideoSource = "youtube" | "youtube-short" | "instagram" | "tiktok" | "unknown";

export function detectVideoSource(url: string): VideoSource {
  if (!url) return "unknown";
  if (/youtube\.com\/shorts\//.test(url)) return "youtube-short";
  if (/youtube\.com\/watch/.test(url) || /youtu\.be\//.test(url) || /youtube\.com\/embed\//.test(url)) return "youtube";
  if (/instagram\.com\/reel\//.test(url) || /instagram\.com\/p\//.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  return "unknown";
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

export function getInstagramCode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p)\/([^/?]+)/);
  return match ? match[1] : null;
}

/** Returns an embed URL for the video, or null if not embeddable. */
export function getVideoEmbedUrl(url: string): string | null {
  const source = detectVideoSource(url);
  if (source === "youtube" || source === "youtube-short") {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
  }
  if (source === "tiktok") {
    const id = getTikTokId(url);
    return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
  }
  // Instagram Reels can't be embedded in a plain iframe — open externally
  return null;
}

/** Returns a thumbnail URL for the video. */
export function getVideoThumbnail(url: string): string {
  const source = detectVideoSource(url);
  if (source === "youtube" || source === "youtube-short") {
    const id = getYouTubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return "/images/placeholders/portfolio.svg";
}

// Keep for backwards compat
export function getYouTubeThumbnail(url: string): string {
  return getVideoThumbnail(url);
}

/** Upload a video file to Firebase Storage with progress callback. */
export async function uploadVideo(
  file: File,
  path: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const fileSize = file.size;
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        // Track in Firestore
        addStorageEntry({ fileName: path, fileSize, uploadedAt: new Date(), type: "video", url }).catch(() => {});
        resolve(url);
      }
    );
  });
}
