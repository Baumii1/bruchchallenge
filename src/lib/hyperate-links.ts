import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-client';

export interface HyperatePlayerLink {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  updatedAt?: number;
}

const COLLECTION_ID = 'bruchchallenge';
const DOC_ID = 'hyperate-links';
const LOCAL_STORAGE_KEY = 'bruchchallenge:hyperate-links:v1';
const UPDATE_EVENT = 'bruchchallenge:hyperate-links-updated';

export const DEFAULT_HYPERATE_LINKS: HyperatePlayerLink[] = [
  { id: 'merlin', name: 'Merlin', url: '', enabled: true },
  { id: 'patrick', name: 'Patrick', url: '', enabled: true },
];

const getHyperateDoc = () => {
  const db = getFirebaseDb();
  if (!db) {
    return null;
  }

  return doc(db, COLLECTION_ID, DOC_ID);
};

export const normalizeHyperateUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const allowedHosts = new Set(['app.hyperate.io', 'hyperate.io', 'www.hyperate.io']);

    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
      return '';
    }

    return url.toString();
  } catch {
    return '';
  }
};

const normalizeEntry = (fallback: HyperatePlayerLink, rawEntry: unknown): HyperatePlayerLink => {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return fallback;
  }

  const entry = rawEntry as Partial<HyperatePlayerLink>;
  const normalizedUrl = normalizeHyperateUrl(typeof entry.url === 'string' ? entry.url : '');

  return {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim().toLowerCase() : fallback.id,
    name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : fallback.name,
    url: normalizedUrl,
    enabled: typeof entry.enabled === 'boolean' ? entry.enabled : fallback.enabled,
    updatedAt: typeof entry.updatedAt === 'number' && Number.isFinite(entry.updatedAt) ? entry.updatedAt : fallback.updatedAt,
  };
};

const normalizeLinks = (rawLinks: unknown): HyperatePlayerLink[] => {
  const byId = new Map<string, unknown>();

  if (Array.isArray(rawLinks)) {
    for (const entry of rawLinks) {
      if (entry && typeof entry === 'object' && typeof (entry as Partial<HyperatePlayerLink>).id === 'string') {
        byId.set(((entry as Partial<HyperatePlayerLink>).id ?? '').toLowerCase(), entry);
      }
    }
  }

  return DEFAULT_HYPERATE_LINKS.map((fallback) => normalizeEntry(fallback, byId.get(fallback.id)));
};

const readLocalHyperateLinks = (): HyperatePlayerLink[] => {
  if (typeof window === 'undefined') {
    return DEFAULT_HYPERATE_LINKS;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_HYPERATE_LINKS;
    }

    return normalizeLinks(JSON.parse(raw));
  } catch {
    return DEFAULT_HYPERATE_LINKS;
  }
};

const persistLocalHyperateLinks = (links: HyperatePlayerLink[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizeLinks(links)));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
};

const mergeLinks = (localLinks: HyperatePlayerLink[], remoteLinks: HyperatePlayerLink[]): HyperatePlayerLink[] => {
  const remoteById = new Map(remoteLinks.map((entry) => [entry.id, entry]));

  return localLinks.map((localEntry) => {
    const remoteEntry = remoteById.get(localEntry.id);
    if (!remoteEntry) {
      return localEntry;
    }

    const localUpdatedAt = localEntry.updatedAt ?? 0;
    const remoteUpdatedAt = remoteEntry.updatedAt ?? 0;
    return remoteUpdatedAt >= localUpdatedAt ? remoteEntry : localEntry;
  });
};

export const readHyperateLinks = async (): Promise<HyperatePlayerLink[]> => {
  const localLinks = readLocalHyperateLinks();
  const hyperateDoc = getHyperateDoc();

  if (!hyperateDoc) {
    return localLinks;
  }

  try {
    const snapshot = await getDoc(hyperateDoc);
    if (!snapshot.exists()) {
      return localLinks;
    }

    const remoteLinks = normalizeLinks(snapshot.data()?.links);
    const mergedLinks = mergeLinks(localLinks, remoteLinks);
    persistLocalHyperateLinks(mergedLinks);
    return mergedLinks;
  } catch {
    return localLinks;
  }
};

export const writeHyperateLinks = async (links: HyperatePlayerLink[]): Promise<HyperatePlayerLink[]> => {
  const now = Date.now();
  const normalizedLinks = normalizeLinks(links).map((entry) => ({ ...entry, updatedAt: now }));
  persistLocalHyperateLinks(normalizedLinks);

  const hyperateDoc = getHyperateDoc();
  if (hyperateDoc) {
    await setDoc(hyperateDoc, { links: normalizedLinks, updatedAt: now }, { merge: true });
  }

  return normalizedLinks;
};

export const subscribeHyperateLinks = (listener: (links: HyperatePlayerLink[]) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const emitLocalLinks = () => {
    listener(readLocalHyperateLinks());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== LOCAL_STORAGE_KEY) {
      return;
    }

    emitLocalLinks();
  };

  const handleUpdate = () => emitLocalLinks();

  window.addEventListener('storage', handleStorage);
  window.addEventListener(UPDATE_EVENT, handleUpdate as EventListener);

  emitLocalLinks();

  const hyperateDoc = getHyperateDoc();
  if (!hyperateDoc) {
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(UPDATE_EVENT, handleUpdate as EventListener);
    };
  }

  const unsubscribeSnapshot = onSnapshot(
    hyperateDoc,
    (snapshot) => {
      if (!snapshot.exists()) {
        emitLocalLinks();
        return;
      }

      const localLinks = readLocalHyperateLinks();
      const remoteLinks = normalizeLinks(snapshot.data()?.links);
      const mergedLinks = mergeLinks(localLinks, remoteLinks);
      persistLocalHyperateLinks(mergedLinks);
      listener(mergedLinks);
    },
    () => emitLocalLinks()
  );

  return () => {
    unsubscribeSnapshot();
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(UPDATE_EVENT, handleUpdate as EventListener);
  };
};

export const getQueryOverrideLinks = (search: string): Partial<Record<string, string>> => {
  const params = new URLSearchParams(search);
  return {
    merlin: normalizeHyperateUrl(params.get('merlin') ?? params.get('merlinUrl') ?? ''),
    patrick: normalizeHyperateUrl(params.get('patrick') ?? params.get('patrickUrl') ?? ''),
  };
};
