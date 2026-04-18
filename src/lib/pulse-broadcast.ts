import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-client';

export interface BroadcastPulseEntry {
  id: string;
  name: string;
  bpm: number | null;
  status: 'ok' | 'missing' | 'error';
  source: 'pulsoid';
  updatedAt: number;
  measuredAt: number | null;
  message?: string;
}

const COLLECTION_ID = 'bruchchallenge';
const DOC_ID = 'pulse-broadcast';
const LOCAL_STORAGE_KEY = 'bruchchallenge:pulse-broadcast:v1';

const getPulseBroadcastDoc = () => {
  const db = getFirebaseDb();
  if (!db) {
    return null;
  }

  return doc(db, COLLECTION_ID, DOC_ID);
};

const sanitizeEntry = (entry: BroadcastPulseEntry) => {
  const sanitized: Record<string, unknown> = {
    id: entry.id,
    name: entry.name,
    bpm: entry.bpm,
    status: entry.status,
    source: entry.source,
    updatedAt: entry.updatedAt,
    measuredAt: entry.measuredAt,
  };

  if (entry.message !== undefined) {
    sanitized.message = entry.message;
  }

  return sanitized;
};

const readLocalPulseBroadcast = (): Record<string, BroadcastPulseEntry> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, BroadcastPulseEntry>;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
};

const persistLocalPulseBroadcast = (entries: Record<string, BroadcastPulseEntry>) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore localStorage persistence errors
  }
};

const dispatchPulseUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bruchchallenge:data-updated'));
  }
};

export const readPulseBroadcast = async (): Promise<Record<string, BroadcastPulseEntry>> => {
  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return readLocalPulseBroadcast();
  }

  try {
    const snapshot = await getDoc(pulseDoc);
    if (!snapshot.exists()) {
      return readLocalPulseBroadcast();
    }

    const data = snapshot.data();
    const entries = data.entries;
    if (!entries || typeof entries !== 'object') {
      return readLocalPulseBroadcast();
    }

    const typedEntries = entries as Record<string, BroadcastPulseEntry>;
    persistLocalPulseBroadcast(typedEntries);
    return typedEntries;
  } catch {
    return readLocalPulseBroadcast();
  }
};

export const writePulseBroadcastEntry = async (entry: BroadcastPulseEntry): Promise<void> => {
  const sanitizedEntry = sanitizeEntry(entry) as BroadcastPulseEntry;
  const existingEntries = await readPulseBroadcast();
  const nextEntries: Record<string, BroadcastPulseEntry> = {
    ...existingEntries,
    [entry.id]: sanitizedEntry,
  };

  persistLocalPulseBroadcast(nextEntries);

  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    dispatchPulseUpdate();
    return;
  }

  await setDoc(
    pulseDoc,
    {
      entries: nextEntries,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  dispatchPulseUpdate();
};

export const clearPulseBroadcastEntry = async (playerId: string): Promise<void> => {
  const existingEntries = await readPulseBroadcast();
  const nextEntries: Record<string, BroadcastPulseEntry> = {
    ...existingEntries,
    [playerId]: {
      id: playerId,
      name: existingEntries[playerId]?.name ?? playerId,
      bpm: null,
      status: 'missing',
      source: 'pulsoid',
      updatedAt: Date.now(),
      measuredAt: null,
      message: 'Publisher disconnected.',
    },
  };

  persistLocalPulseBroadcast(nextEntries);

  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    dispatchPulseUpdate();
    return;
  }

  await setDoc(
    pulseDoc,
    {
      entries: nextEntries,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  dispatchPulseUpdate();
};
