import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

export const readPulseBroadcast = async (): Promise<Record<string, BroadcastPulseEntry>> => {
  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return {};
  }

  const snapshot = await getDoc(pulseDoc);
  if (!snapshot.exists()) {
    return {};
  }

  const data = snapshot.data();
  const entries = data.entries;
  if (!entries || typeof entries !== 'object') {
    return {};
  }

  return entries as Record<string, BroadcastPulseEntry>;
};

export const writePulseBroadcastEntry = async (entry: BroadcastPulseEntry): Promise<void> => {
  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    throw new Error('Firebase ist nicht konfiguriert.');
  }

  const sanitizedEntry = sanitizeEntry(entry);

  try {
    await updateDoc(pulseDoc, {
      [`entries.${entry.id}`]: sanitizedEntry,
      updatedAt: Date.now(),
    });
  } catch {
    await setDoc(pulseDoc, {
      entries: {
        [entry.id]: sanitizedEntry,
      },
      updatedAt: Date.now(),
    }, { merge: true });
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bruchchallenge:data-updated'));
  }
};

export const clearPulseBroadcastEntry = async (playerId: string): Promise<void> => {
  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return;
  }

  await setDoc(pulseDoc, {
    entries: {
      [playerId]: {
        id: playerId,
        name: playerId,
        bpm: null,
        status: 'missing',
        source: 'pulsoid',
        updatedAt: Date.now(),
        measuredAt: null,
        message: 'Publisher disconnected.',
      },
    },
    updatedAt: Date.now(),
  }, { merge: true });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bruchchallenge:data-updated'));
  }
};
