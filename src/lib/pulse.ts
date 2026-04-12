export type PulseProvider = 'json-endpoint' | 'manual';

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

export const getPulsePlayers = (): PulsePlayerConfig[] => {
  const raw = process.env.NEXT_PUBLIC_PULSE_PLAYERS;

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PulsePlayerConfig[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => entry && entry.id && entry.name && entry.provider);
  } catch (error) {
    console.warn('Could not parse NEXT_PUBLIC_PULSE_PLAYERS.', error);
    return [];
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
