import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  SiteContent,
  SocialLinks,
  PortfolioItem,
  Partnership,
  ContactMessage,
  Testimonial,
  NextTrip,
} from "@/types";

// Collection names
export const COLLECTIONS = {
  CONTENT: "content",
  SOCIALS: "socials",
  PORTFOLIO: "portfolio",
  PARTNERSHIPS: "partnerships",
  MESSAGES: "messages",
  HERO: "hero",
  STORAGE_TRACKING: "storage_tracking",
  TESTIMONIALS: "testimonials",
  NEXT_TRIP: "next_trip",
} as const;

// --- Helpers ---
function fromTimestamp(data: DocumentData): DocumentData {
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  }
  return result;
}

// --- Site Content ---
export async function getSiteContent(): Promise<SiteContent | null> {
  const ref = doc(db, COLLECTIONS.CONTENT, "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...fromTimestamp(snap.data()) } as SiteContent;
}

export function onSiteContentChange(callback: (data: SiteContent | null) => void) {
  const ref = doc(db, COLLECTIONS.CONTENT, "main");
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...fromTimestamp(snap.data()) } as SiteContent);
  });
}

export async function updateSiteContent(data: Partial<SiteContent>): Promise<void> {
  const ref = doc(db, COLLECTIONS.CONTENT, "main");
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// --- Social Links ---
export async function getSocialLinks(): Promise<SocialLinks | null> {
  const ref = doc(db, COLLECTIONS.SOCIALS, "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...fromTimestamp(snap.data()) } as SocialLinks;
}

export function onSocialLinksChange(callback: (data: SocialLinks | null) => void) {
  const ref = doc(db, COLLECTIONS.SOCIALS, "main");
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...fromTimestamp(snap.data()) } as SocialLinks);
  });
}

export async function updateSocialLinks(data: Partial<SocialLinks>): Promise<void> {
  const ref = doc(db, COLLECTIONS.SOCIALS, "main");
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// --- Portfolio ---
export function onPortfolioChange(callback: (items: PortfolioItem[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.PORTFOLIO),
    orderBy("order", "asc")
  );
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...fromTimestamp(d.data()),
    })) as PortfolioItem[];
    callback(items);
  });
}

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  const q = query(
    collection(db, COLLECTIONS.PORTFOLIO),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...fromTimestamp(d.data()),
  })) as PortfolioItem[];
}

export async function addPortfolioItem(data: Omit<PortfolioItem, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.PORTFOLIO), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePortfolioItem(
  id: string,
  data: Partial<PortfolioItem>
): Promise<void> {
  const ref = doc(db, COLLECTIONS.PORTFOLIO, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deletePortfolioItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PORTFOLIO, id));
}

export async function updatePortfolioOrder(
  items: { id: string; order: number }[]
): Promise<void> {
  const promises = items.map(({ id, order }) =>
    updateDoc(doc(db, COLLECTIONS.PORTFOLIO, id), { order })
  );
  await Promise.all(promises);
}

// --- Partnerships ---
export function onPartnershipsChange(callback: (items: Partnership[]) => void) {
  // Do NOT use orderBy("order") — it silently excludes documents without the "order" field.
  // Sort client-side instead to handle seed data or manually inserted docs.
  return onSnapshot(collection(db, COLLECTIONS.PARTNERSHIPS), (snap: QuerySnapshot) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...fromTimestamp(d.data()),
    })) as Partnership[];
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    callback(items);
  });
}

export async function addPartnership(data: Omit<Partnership, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.PARTNERSHIPS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePartnership(
  id: string,
  data: Partial<Partnership>
): Promise<void> {
  const ref = doc(db, COLLECTIONS.PARTNERSHIPS, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deletePartnership(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PARTNERSHIPS, id));
}

export async function updatePartnershipOrder(
  items: { id: string; order: number }[]
): Promise<void> {
  const promises = items.map(({ id, order }) =>
    updateDoc(doc(db, COLLECTIONS.PARTNERSHIPS, id), { order })
  );
  await Promise.all(promises);
}

// --- Messages ---
export function onMessagesChange(callback: (items: ContactMessage[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap: QuerySnapshot) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...fromTimestamp(d.data()),
    })) as ContactMessage[];
    callback(items);
  });
}

export async function addContactMessage(
  data: Omit<ContactMessage, "id" | "read" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.MESSAGES), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.MESSAGES, id), { read });
}

export async function deleteMessage(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.MESSAGES, id));
}

export async function getUnreadMessagesCount(): Promise<number> {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

// --- Testimonials ---
export function onTestimonialsChange(callback: (items: Testimonial[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.TESTIMONIALS), (snap: QuerySnapshot) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...fromTimestamp(d.data()),
    })) as Testimonial[];
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    callback(items);
  });
}

export async function addTestimonial(data: Omit<Testimonial, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.TESTIMONIALS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TESTIMONIALS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TESTIMONIALS, id));
}

export async function updateTestimonialOrder(items: { id: string; order: number }[]): Promise<void> {
  await Promise.all(items.map(({ id, order }) =>
    updateDoc(doc(db, COLLECTIONS.TESTIMONIALS, id), { order })
  ));
}

// --- Storage Tracking ---
import { StorageTrackingEntry } from "@/types";

export async function addStorageEntry(data: Omit<StorageTrackingEntry, "id">): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.STORAGE_TRACKING), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteStorageEntryByUrl(url: string): Promise<void> {
  if (!url) return;
  const q = query(
    collection(db, COLLECTIONS.STORAGE_TRACKING),
    where("url", "==", url)
  );
  const snap = await getDocs(q);
  const promises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(promises);
}

export function onStorageTrackingChange(callback: (entries: StorageTrackingEntry[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.STORAGE_TRACKING), (snap: QuerySnapshot) => {
    const entries = snap.docs.map((d) => ({
      id: d.id,
      ...fromTimestamp(d.data()),
    })) as StorageTrackingEntry[];
    callback(entries);
  });
}

// --- Next Trip ---
export function onNextTripChange(callback: (data: NextTrip | null) => void) {
  const ref = doc(db, COLLECTIONS.NEXT_TRIP, "main");
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...fromTimestamp(snap.data()) } as NextTrip);
  });
}

export async function updateNextTrip(data: Partial<NextTrip>): Promise<void> {
  const ref = doc(db, COLLECTIONS.NEXT_TRIP, "main");
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
