from pathlib import Path
import re
import shutil

ROOT = Path.cwd()


def read(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        raise FileNotFoundError(f"Missing expected file: {path}")
    return p.read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')
    print(f"wrote {path}")


# 1) Replace pulse.ts with a provider-neutral implementation. No Pulsoid OAuth references.
write('src/lib/pulse.ts', r'''import { readPulseBroadcast } from '@/lib/pulse-broadcast';

export type PulseProvider = 'json-endpoint' | 'manual' | 'broadcast';

export interface PulsePlayerConfig {
  id: string;
  name: string;
  provider: PulseProvider;
  endpoint?: string;
  token?: string;
  headers?: Record<string, string>;
  valuePath?: string;
  manualBpm?: number;
}

export interface PulseReading {
  id: string;
  name: string;
  bpm: number | null;
  status: 'ok' | 'missing' | 'error';
  source: string;
  updatedAt: number | null;
  message?: string;
}

const DEFAULT_PULSE_PLAYERS: PulsePlayerConfig[] = [
  { id: 'merlin', name: 'Merlin', provider: 'broadcast' },
  { id: 'patrick', name: 'Patrick', provider: 'broadcast' },
];

const commonValuePaths = [
  'bpm',
  'heart_rate',
  'heartrate',
  'hr',
  'data.bpm',
  'data.heart_rate',
  'data.heartrate',
  'data.hr',
  'pulse',
  'live.bpm',
  'live.heart_rate',
];

const readPath = (payload: unknown, path: string): unknown => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, payload);
};

const normalizeBpm = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }

  return null;
};

const resolveBpm = (payload: unknown, valuePath?: string): number | null => {
  if (valuePath) {
    return normalizeBpm(readPath(payload, valuePath));
  }

  for (const path of commonValuePaths) {
    const resolved = normalizeBpm(readPath(payload, path));
    if (resolved !== null) {
      return resolved;
    }
  }

  return null;
};

const buildHeaders = (player: PulsePlayerConfig): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(player.headers ?? {}),
  };

  if (player.token && !Object.keys(headers).some((key) => key.toLowerCase() === 'authorization')) {
    headers.Authorization = `Bearer ${player.token}`;
  }

  return headers;
};

const normalizePulsePlayer = (player: PulsePlayerConfig): PulsePlayerConfig => {
  const id = player.id.trim().toLowerCase();
  const name = player.name.trim().toLowerCase() === 'baumii' ? 'Merlin' : player.name.trim();

  return {
    ...player,
    id: id || player.id,
    name: name || player.name,
  };
};

export const getPulsePlayers = (): PulsePlayerConfig[] => {
  const raw = process.env.NEXT_PUBLIC_PULSE_PLAYERS;

  if (!raw) {
    return DEFAULT_PULSE_PLAYERS;
  }

  try {
    const parsed = JSON.parse(raw) as PulsePlayerConfig[];
    if (!Array.isArray(parsed)) {
      return DEFAULT_PULSE_PLAYERS;
    }

    const configuredPlayers = parsed
      .filter((entry) => entry && entry.id && entry.name && entry.provider)
      .map(normalizePulsePlayer);

    return configuredPlayers.length > 0 ? configuredPlayers : DEFAULT_PULSE_PLAYERS;
  } catch (error) {
    console.warn('Could not parse NEXT_PUBLIC_PULSE_PLAYERS.', error);
    return DEFAULT_PULSE_PLAYERS;
  }
};

export const fetchPulseReading = async (player: PulsePlayerConfig): Promise<PulseReading> => {
  if (player.provider === 'manual') {
    return {
      id: player.id,
      name: player.name,
      bpm: normalizeBpm(player.manualBpm),
      status: player.manualBpm ? 'ok' : 'missing',
      source: 'manual',
      updatedAt: Date.now(),
      message: player.manualBpm ? undefined : 'No manual BPM configured.',
    };
  }

  if (player.provider === 'broadcast') {
    const entries = await readPulseBroadcast();
    const entry = entries[player.id];

    if (!entry) {
      return {
        id: player.id,
        name: player.name,
        bpm: null,
        status: 'missing',
        source: 'broadcast',
        updatedAt: null,
        message: 'Noch kein Pulse-Publisher für diesen Spieler aktiv.',
      };
    }

    return {
      id: player.id,
      name: entry.name || player.name,
      bpm: entry.bpm,
      status: entry.status,
      source: entry.source,
      updatedAt: entry.updatedAt,
      message: entry.message,
    };
  }

  if (!player.endpoint) {
    return {
      id: player.id,
      name: player.name,
      bpm: null,
      status: 'missing',
      source: 'json-endpoint',
      updatedAt: null,
      message: 'No endpoint configured.',
    };
  }

  try {
    const response = await fetch(player.endpoint, {
      method: 'GET',
      headers: buildHeaders(player),
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        id: player.id,
        name: player.name,
        bpm: null,
        status: 'error',
        source: 'json-endpoint',
        updatedAt: null,
        message: `HTTP ${response.status}`,
      };
    }

    const payload = await response.json();
    const bpm = resolveBpm(payload, player.valuePath);

    return {
      id: player.id,
      name: player.name,
      bpm,
      status: bpm !== null ? 'ok' : 'missing',
      source: 'json-endpoint',
      updatedAt: Date.now(),
      message: bpm !== null ? undefined : 'No BPM value found in JSON payload.',
    };
  } catch (error) {
    return {
      id: player.id,
      name: player.name,
      bpm: null,
      status: 'error',
      source: 'json-endpoint',
      updatedAt: null,
      message: error instanceof Error ? error.message : 'Unknown pulse request error.',
    };
  }
};

export const fetchAllPulseReadings = async (): Promise<PulseReading[]> => {
  const players = getPulsePlayers();
  return Promise.all(players.map((player) => fetchPulseReading(player)));
};
''')

# 2) Replace pulse-broadcast.ts with provider-neutral source types.
write('src/lib/pulse-broadcast.ts', r'''import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase-client';

export type BroadcastPulseSource = 'hyperate' | 'manual' | 'bridge' | 'json-endpoint';

export interface BroadcastPulseEntry {
  id: string;
  name: string;
  bpm: number | null;
  status: 'ok' | 'missing' | 'error';
  source: BroadcastPulseSource;
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

const normalizeSource = (source: unknown): BroadcastPulseSource => {
  return source === 'manual' || source === 'bridge' || source === 'json-endpoint' || source === 'hyperate'
    ? source
    : 'bridge';
};

const sanitizeEntry = (entry: BroadcastPulseEntry): BroadcastPulseEntry => {
  const sanitized: BroadcastPulseEntry = {
    id: entry.id,
    name: entry.name,
    bpm: entry.bpm,
    status: entry.status,
    source: normalizeSource(entry.source),
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
    bpm: typeof entry.bpm === 'number' && Number.isFinite(entry.bpm) ? Math.round(entry.bpm) : null,
    status,
    source: normalizeSource(entry.source),
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

const mergePulseEntries = (
  primaryEntries: Record<string, BroadcastPulseEntry>,
  secondaryEntries: Record<string, BroadcastPulseEntry>
): Record<string, BroadcastPulseEntry> => {
  const allIds = new Set([...Object.keys(primaryEntries), ...Object.keys(secondaryEntries)]);
  const mergedEntries: Record<string, BroadcastPulseEntry> = {};

  for (const entryId of allIds) {
    const primaryEntry = primaryEntries[entryId];
    const secondaryEntry = secondaryEntries[entryId];

    if (!primaryEntry) {
      mergedEntries[entryId] = secondaryEntry;
      continue;
    }

    if (!secondaryEntry) {
      mergedEntries[entryId] = primaryEntry;
      continue;
    }

    mergedEntries[entryId] = primaryEntry.updatedAt >= secondaryEntry.updatedAt
      ? primaryEntry
      : secondaryEntry;
  }

  return mergedEntries;
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
  const localEntries = readLocalPulseBroadcast();
  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return localEntries;
  }

  try {
    const snapshot = await getDoc(pulseDoc);
    if (!snapshot.exists()) {
      return localEntries;
    }

    const remoteEntries = normalizeEntries(snapshot.data()?.entries);
    const mergedEntries = mergePulseEntries(localEntries, remoteEntries);
    persistLocalPulseBroadcast(mergedEntries);
    return mergedEntries;
  } catch {
    return localEntries;
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
    source: 'manual',
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

  emitLocalEntries();

  const pulseDoc = getPulseBroadcastDoc();
  if (!pulseDoc) {
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PULSE_UPDATE_EVENT, handlePulseUpdate as EventListener);
    };
  }

  const unsubscribeSnapshot = onSnapshot(
    pulseDoc,
    (snapshot) => {
      if (!snapshot.exists()) {
        emitLocalEntries();
        return;
      }

      const localEntries = readLocalPulseBroadcast();
      const remoteEntries = normalizeEntries(snapshot.data()?.entries);
      const mergedEntries = mergePulseEntries(localEntries, remoteEntries);
      persistLocalPulseBroadcast(mergedEntries);
      listener(mergedEntries);
    },
    () => {
      emitLocalEntries();
    }
  );

  return () => {
    unsubscribeSnapshot();
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PULSE_UPDATE_EVENT, handlePulseUpdate as EventListener);
  };
};
''')

# 3) HypeRate link storage: localStorage + optional Firestore sync.
write('src/lib/hyperate-links.ts', r'''import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
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
''')

# 4) Shared visual component that embeds HypeRate animations inside Bruch Challenge styling.
write('src/components/obs/HyperatePulseStrip.tsx', r'''
"use client";

import { useEffect, useMemo, useState } from 'react';
import { HeartPulse, Link2Off } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_HYPERATE_LINKS,
  getQueryOverrideLinks,
  subscribeHyperateLinks,
  type HyperatePlayerLink,
} from '@/lib/hyperate-links';

interface HyperatePulseStripProps {
  className?: string;
  embedded?: boolean;
}

export function HyperatePulseStrip({ className, embedded = false }: HyperatePulseStripProps) {
  const [links, setLinks] = useState<HyperatePlayerLink[]>(DEFAULT_HYPERATE_LINKS);
  const [queryOverrides, setQueryOverrides] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    const unsubscribe = subscribeHyperateLinks(setLinks);
    if (typeof window !== 'undefined') {
      setQueryOverrides(getQueryOverrideLinks(window.location.search));
    }

    return unsubscribe;
  }, []);

  const displayLinks = useMemo(() => {
    return links
      .filter((entry) => entry.enabled)
      .map((entry) => ({
        ...entry,
        url: queryOverrides[entry.id] || entry.url,
      }));
  }, [links, queryOverrides]);

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 text-white',
        embedded ? 'h-[82px]' : 'h-[138px] w-[760px] max-w-full',
        className
      )}
    >
      {displayLinks.map((entry) => (
        <PulseAnimationCard key={entry.id} entry={entry} embedded={embedded} />
      ))}
    </div>
  );
}

function PulseAnimationCard({ entry, embedded }: { entry: HyperatePlayerLink; embedded: boolean }) {
  return (
    <article
      className={cn(
        'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-lg backdrop-blur',
        embedded ? 'px-2 py-1.5' : 'px-3 py-2.5'
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(244,63,94,0.28),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(41,171,226,0.20),transparent_30%)]" />
      <div className={cn('flex items-center justify-between gap-2', embedded ? 'mb-1' : 'mb-2')}>
        <div className="flex min-w-0 items-center gap-1.5">
          <HeartPulse className={cn('shrink-0 text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.7)]', embedded ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <p className={cn('truncate font-black uppercase tracking-[0.18em] text-white/90', embedded ? 'text-[9px]' : 'text-[11px]')}>
            {entry.name}
          </p>
        </div>
        <span className={cn('rounded-full border border-rose-300/30 bg-rose-500/10 font-black uppercase tracking-[0.18em] text-rose-200', embedded ? 'px-1.5 py-0.5 text-[7px]' : 'px-2 py-0.5 text-[9px]')}>
          BPM
        </span>
      </div>

      {entry.url ? (
        <iframe
          title={`${entry.name} HypeRate animation`}
          src={entry.url}
          className={cn('w-full rounded-xl border-0 bg-transparent', embedded ? 'h-[52px]' : 'h-[92px]')}
          allow="autoplay; clipboard-read; clipboard-write; encrypted-media"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className={cn('flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 text-center text-white/45', embedded ? 'h-[52px] px-2 text-[9px]' : 'h-[92px] px-4 text-xs')}>
          <div>
            <Link2Off className="mx-auto mb-1 h-4 w-4" />
            HypeRate-Link fehlt
          </div>
        </div>
      )}
    </article>
  );
}
''')

# 5) Dedicated OBS pulse page.
write('src/app/obs/pulse/page.tsx', r'''
"use client";

import { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';

export default function ObsPulsePage() {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-start bg-transparent p-0 text-white">
      <section className="relative isolate overflow-hidden rounded-[26px] border border-white/10 bg-[#050812]/95 p-3 shadow-2xl">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(244,63,94,0.20),transparent_34%),radial-gradient(circle_at_92%_0%,rgba(41,171,226,0.20),transparent_30%),linear-gradient(180deg,rgba(8,13,28,0.96),rgba(3,5,12,0.99))]" />
        <HyperatePulseStrip />
      </section>
    </div>
  );
}
''')

# 6) Admin page to configure/change HypeRate animation links without code changes.
write('src/app/admin/hyperate/page.tsx', r'''
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, HeartPulse, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  DEFAULT_HYPERATE_LINKS,
  normalizeHyperateUrl,
  readHyperateLinks,
  writeHyperateLinks,
  type HyperatePlayerLink,
} from '@/lib/hyperate-links';

export default function HyperateAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isAuthReady } = useAuth();
  const [links, setLinks] = useState<HyperatePlayerLink[]>(DEFAULT_HYPERATE_LINKS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    if (isAuthReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isAuthReady, router]);

  useEffect(() => {
    const loadLinks = async () => {
      const loadedLinks = await readHyperateLinks();
      setLinks(loadedLinks);
      setIsLoading(false);
    };

    void loadLinks();
  }, []);

  const updateLink = <K extends keyof HyperatePlayerLink>(index: number, field: K, value: HyperatePlayerLink[K]) => {
    setLinks((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const saveLinks = () => {
    startTransition(async () => {
      const sanitizedLinks = links.map((entry) => ({
        ...entry,
        id: entry.id.trim().toLowerCase(),
        name: entry.name.trim() || entry.id,
        url: normalizeHyperateUrl(entry.url),
      }));

      const invalidLinks = links.filter((entry) => entry.url.trim() && !normalizeHyperateUrl(entry.url));
      if (invalidLinks.length > 0) {
        toast({
          title: 'Ungültiger HypeRate-Link',
          description: 'Bitte nur HTTPS-Links von app.hyperate.io eintragen.',
          variant: 'destructive',
        });
        return;
      }

      const savedLinks = await writeHyperateLinks(sanitizedLinks);
      setLinks(savedLinks);
      toast({ title: 'HypeRate-Links gespeichert', description: 'Das OBS-Pulse-Overlay aktualisiert sich automatisch.' });
    });
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-lg">HypeRate-Konfiguration wird geladen...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="mx-auto max-w-4xl shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <HeartPulse className="h-6 w-6 text-rose-500" />
          HypeRate-Animationen
        </CardTitle>
        <CardDescription>
          Trage hier die HypeRate-Animation-Links für Merlin und Patrick ein. Wenn sich ein Link ändert, musst du nur diese Seite aktualisieren, nicht den Code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground">
          Beispiel-Link: <code className="rounded bg-background px-1.5 py-0.5">https://app.hyperate.io/animation/79/CDAF6</code>
        </div>

        <div className="space-y-4">
          {links.map((entry, index) => (
            <Card key={entry.id} className="border-border/70">
              <CardContent className="grid gap-4 pt-6 md:grid-cols-[160px_minmax(0,1fr)_100px] md:items-end">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={entry.name} onChange={(event) => updateLink(index, 'name', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>HypeRate Animation Link</Label>
                  <Input
                    placeholder="https://app.hyperate.io/animation/..."
                    value={entry.url}
                    onChange={(event) => updateLink(index, 'url', event.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={entry.enabled} onCheckedChange={(checked) => updateLink(index, 'enabled', checked)} />
                  <span className="text-sm text-muted-foreground">aktiv</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={saveLinks} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Links speichern
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/obs/pulse" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Pulse-Overlay testen
            </a>
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/obs" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Komplettes OBS-Overlay testen
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
''')

# 7) Make any manual pulse-control page compile with provider-neutral source if it exists.
for candidate in ['src/app/admin/pulse-control/page.tsx', 'src/app/admin/pulse/page.tsx']:
    p = ROOT / candidate
    if p.exists():
        text = p.read_text(encoding='utf-8')
        text = text.replace("source: 'pulsoid'", "source: 'manual'")
        text = text.replace('source: "pulsoid"', 'source: "manual"')
        text = text.replace('Pulsoid', 'HypeRate')
        text = text.replace('pulsoid', 'hyperate')
        p.write_text(text, encoding='utf-8')
        print(f"updated {candidate}")

# 8) Try to embed the HypeRate pulse strip into the existing /obs challenge overlay.
obs_page = ROOT / 'src/app/obs/page.tsx'
if obs_page.exists():
    text = obs_page.read_text(encoding='utf-8')
    if "@/components/obs/HyperatePulseStrip" not in text:
        text = text.replace(
            "import { cn } from '@/lib/utils';",
            "import { cn } from '@/lib/utils';\nimport { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';",
            1,
        )
    text = text.replace('const GAMES_PER_PAGE = 5;', 'const GAMES_PER_PAGE = 4;')
    if '<HyperatePulseStrip embedded' not in text:
        marker = "          </header>\n\n"
        if marker in text:
            text = text.replace(marker, "          </header>\n\n          <HyperatePulseStrip embedded className=\"mb-3\" />\n\n", 1)
        else:
            print('warning: Could not find OBS header marker; /obs/pulse was created, but /obs was not auto-embedded.')
    obs_page.write_text(text, encoding='utf-8')
    print('updated src/app/obs/page.tsx')
else:
    print('warning: src/app/obs/page.tsx not found. Dedicated /obs/pulse page was still created.')

# 9) Remove obvious stale callback route folder if it exists.
for stale_path in ['src/app/pulsoid', 'src/app/admin/pulsoid']:
    p = ROOT / stale_path
    if p.exists() and p.is_dir():
        shutil.rmtree(p)
        print(f"removed stale {stale_path}")

# 10) Report remaining source references. This intentionally does not edit .env files.
remaining = []
for path in (ROOT / 'src').rglob('*'):
    if path.is_file() and path.suffix in {'.ts', '.tsx', '.js', '.jsx'}:
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        if re.search(r'pulsoid', text, re.IGNORECASE):
            remaining.append(path.relative_to(ROOT).as_posix())

if remaining:
    print('\nwarning: Remaining Pulsoid references found:')
    for item in remaining:
        print(f" - {item}")
    print('Please inspect these files manually if typecheck reports an error.')
else:
    print('\nNo Pulsoid references left in src/*.ts(x) files.')

print('\nDone. Next steps:')
print('  npm run typecheck')
print('  npm run build')
print('  Open /admin/hyperate and paste the HypeRate animation links.')
print('  Use /obs as the combined OBS source or /obs/pulse for pulse only.')
