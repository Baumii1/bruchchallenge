import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
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
const PULSE_UPDATE_EVENT = 'bruchchallenge:pulse-updated';

const getPulseBroadcastDoc = () => {
  const db = getFirebaseDb();
  if (!db) {
    return null;
  }

  return doc(db, COLLECTION_ID, DOC_ID);
};

const sanitizeEntry = (entry: BroadcastPulseEntry): BroadcastPulseEntry => {
  const sanitized: BroadcastPulseEntry = {
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

const coerceEntry = (fallbackId: string, rawEntry: unknown): BroadcastPulseEntry | null => {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return null;
  }

  const entry = rawEntry as Partial<BroadcastPulseEntry>;
  const status = entry.status === 'ok' || entry.status === 'missing' || entry.status === 'error'
    ? entry.status
    : 'missing';

  return sanitizeEntry({
    id: typeof entry.id === 'string' && entry.id ? entry.id : fallbackId,
    name: typeof entry.name === 'string' && entry.name ? entry.name : fallbackId,
    bpm: typeof entry.bpm === 'number' && Number.isFinite(entry.bpm) ? entry.bpm : null,
    status,
    source: 'pulsoid',
    updatedAt: typeof entry.updatedAt === 'number' && Number.isFinite(entry.updatedAt) ? entry.updatedAt : Date.now(),
    measuredAt: typeof entry.measuredAt === 'number' && Number.isFinite(entry.measuredAt) ? entry.measuredAt : null,
    message: typeof entry.message === 'string' ? entry.message : undefined,
  });
};

const normalizeEntries = (rawEntries: unknown): Record<string, BroadcastPulseEntry> => {
  if (!rawEntries || typeof rawEntries !== 'object') {
    return {};
  }

  return Object.entries(rawEntries as Record<string, unknown>).reduce<Record<string, BroadcastPulseEntry>>((accumulator, [entryId, rawEntry]) => {
    const entry = coerceEntry(entryId, rawEntry);
    if (entry) {
      accumulator[entryId] = entry;
    }

    return accumulator;
  }, {});
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
    return normalizeEntries(parsed);
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
    window.dispatchEvent(new CustomEvent(PULSE_UPDATE_EVENT));
  }
};

const persistAndDispatchPulseBroadcast = (entries: Record<string, BroadcastPulseEntry>) => {
  persistLocalPulseBroadcast(entries);
  dispatchPulseUpdate();
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

    const entries = normalizeEntries(snapshot.data()?.entries);
    persistLocalPulseBroadcast(entries);
    return entries;
  } catch {
    return readLocalPulseBroadcast();
  }
};

export const writePulseBroadcastEntry = async (entry: BroadcastPulseEntry): Promise<void> => {
  const sanitizedEntry = sanitizeEntry(entry);
  const existingEntries = readLocalPulseBroadcast();
  const nextEntries: Record<string, BroadcastPulseEntry> = {
    ...existingEntries,
    [entry.id]: sanitizedEntry,
  };

  persistAndDispatchPulseBroadcast(nextEntries);

  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return;
  }

  await setDoc(
    pulseDoc,
    {
      entries: {
        [entry.id]: sanitizedEntry,
      },
      updatedAt: Date.now(),
    },
    { merge: true }
  );
};

export const clearPulseBroadcastEntry = async (playerId: string): Promise<void> => {
  const existingEntries = readLocalPulseBroadcast();
  const nextEntry: BroadcastPulseEntry = {
    id: playerId,
    name: existingEntries[playerId]?.name ?? playerId,
    bpm: null,
    status: 'missing',
    source: 'pulsoid',
    updatedAt: Date.now(),
    measuredAt: null,
    message: 'Publisher disconnected.',
  };

  const nextEntries: Record<string, BroadcastPulseEntry> = {
    ...existingEntries,
    [playerId]: nextEntry,
  };

  persistAndDispatchPulseBroadcast(nextEntries);

  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return;
  }

  await setDoc(
    pulseDoc,
    {
      entries: {
        [playerId]: nextEntry,
      },
      updatedAt: Date.now(),
    },
    { merge: true }
  );
};

export const subscribePulseBroadcast = (listener: (entries: Record<string, BroadcastPulseEntry>) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const emitLocalEntries = () => {
    listener(readLocalPulseBroadcast());
  };

  emitLocalEntries();

  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== LOCAL_STORAGE_KEY) {
        return;
      }

      emitLocalEntries();
    };

    const handlePulseUpdate = () => {
      emitLocalEntries();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PULSE_UPDATE_EVENT, handlePulseUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PULSE_UPDATE_EVENT, handlePulseUpdate as EventListener);
    };
  }

  return onSnapshot(
    pulseDoc,
    (snapshot) => {
      if (!snapshot.exists()) {
        emitLocalEntries();
        return;
      }

      const entries = normalizeEntries(snapshot.data()?.entries);
      persistLocalPulseBroadcast(entries);
      listener(entries);
    },
    () => {
      emitLocalEntries();
    }
  );
};
