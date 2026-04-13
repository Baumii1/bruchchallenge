export type PulseProvider = 'json-endpoint' | 'manual' | 'pulsoid-oauth';

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

export interface PulsoidOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string;
  endpoint?: string;
  playerId: string;
  playerName: string;
  valuePath?: string;
}

export interface PulsoidSession {
  accessToken: string;
  tokenType: string;
  expiresAt: number | null;
  scope: string | null;
}

interface PulsoidCallbackResult {
  ok: boolean;
  message: string;
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

const pulsoidStorageKeys = {
  state: 'pulsoid_oauth_state',
  accessToken: 'pulsoid_access_token',
  tokenType: 'pulsoid_token_type',
  expiresAt: 'pulsoid_access_token_expires_at',
  scope: 'pulsoid_scope',
};

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

const getBrowserCrypto = (): Crypto | null => {
  if (typeof window === 'undefined' || !window.crypto) {
    return null;
  }

  return window.crypto;
};

const createStateToken = (): string => {
  const cryptoApi = getBrowserCrypto();
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeScope = (rawScope: string): string => {
  return rawScope
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(',');
};

const safeLocalStorageGet = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
};

const safeLocalStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
};

const safeLocalStorageRemove = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
};

const parsePulsoidHash = (hash: string): URLSearchParams => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const normalized = raw.startsWith('token=') && raw.includes('access_token=')
    ? raw.slice('token='.length)
    : raw;

  return new URLSearchParams(normalized);
};

export const getPulsoidConfig = (): PulsoidOAuthConfig | null => {
  const clientId = process.env.NEXT_PUBLIC_PULSOID_CLIENT_ID?.trim();
  const redirectUri = process.env.NEXT_PUBLIC_PULSOID_REDIRECT_URI?.trim();

  if (!clientId || !redirectUri) {
    return null;
  }

  return {
    clientId,
    redirectUri,
    scopes: normalizeScope(process.env.NEXT_PUBLIC_PULSOID_SCOPES ?? 'data:heart_rate:read'),
    endpoint: process.env.NEXT_PUBLIC_PULSOID_HEART_RATE_ENDPOINT?.trim() || undefined,
    playerId: process.env.NEXT_PUBLIC_PULSOID_PLAYER_ID?.trim() || 'pulsoid-player',
    playerName: process.env.NEXT_PUBLIC_PULSOID_PLAYER_NAME?.trim() || 'Pulsoid Player',
    valuePath: process.env.NEXT_PUBLIC_PULSOID_VALUE_PATH?.trim() || undefined,
  };
};

export const isPulsoidConfigured = (): boolean => getPulsoidConfig() !== null;

export const getPulsoidSession = (): PulsoidSession | null => {
  const accessToken = safeLocalStorageGet(pulsoidStorageKeys.accessToken);
  if (!accessToken) {
    return null;
  }

  const expiresAtRaw = safeLocalStorageGet(pulsoidStorageKeys.expiresAt);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;

  return {
    accessToken,
    tokenType: safeLocalStorageGet(pulsoidStorageKeys.tokenType) ?? 'bearer',
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
    scope: safeLocalStorageGet(pulsoidStorageKeys.scope),
  };
};

export const isPulsoidSessionValid = (): boolean => {
  const session = getPulsoidSession();
  if (!session?.accessToken) {
    return false;
  }

  if (session.expiresAt && Date.now() >= session.expiresAt) {
    return false;
  }

  return true;
};

export const beginPulsoidOAuthLogin = (): void => {
  const config = getPulsoidConfig();
  if (!config || typeof window === 'undefined') {
    throw new Error('Pulsoid OAuth ist nicht vollständig konfiguriert.');
  }

  const state = createStateToken();
  safeLocalStorageSet(pulsoidStorageKeys.state, state);

  const authUrl = new URL('https://pulsoid.net/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', config.scopes);
  authUrl.searchParams.set('state', state);

  window.location.assign(authUrl.toString());
};

export const clearPulsoidOAuthSession = (): void => {
  safeLocalStorageRemove(pulsoidStorageKeys.accessToken);
  safeLocalStorageRemove(pulsoidStorageKeys.tokenType);
  safeLocalStorageRemove(pulsoidStorageKeys.expiresAt);
  safeLocalStorageRemove(pulsoidStorageKeys.scope);
  safeLocalStorageRemove(pulsoidStorageKeys.state);
};

export const completePulsoidOAuthCallback = (hash: string): PulsoidCallbackResult => {
  const params = parsePulsoidHash(hash);
  const accessToken = params.get('access_token');
  const tokenType = params.get('token_type') ?? 'bearer';
  const expiresIn = params.get('expires_in');
  const scope = params.get('scope');
  const returnedState = params.get('state');
  const expectedState = safeLocalStorageGet(pulsoidStorageKeys.state);

  if (!accessToken) {
    return { ok: false, message: 'Kein access_token in der Pulsoid-Antwort gefunden.' };
  }

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return { ok: false, message: 'Pulsoid state mismatch. Der OAuth-Login wurde aus Sicherheitsgründen verworfen.' };
  }

  safeLocalStorageSet(pulsoidStorageKeys.accessToken, accessToken);
  safeLocalStorageSet(pulsoidStorageKeys.tokenType, tokenType);
  if (scope) {
    safeLocalStorageSet(pulsoidStorageKeys.scope, scope);
  }
  if (expiresIn) {
    const expiresAt = Date.now() + Number(expiresIn) * 1000;
    safeLocalStorageSet(pulsoidStorageKeys.expiresAt, String(expiresAt));
  }
  safeLocalStorageRemove(pulsoidStorageKeys.state);

  return { ok: true, message: 'Pulsoid erfolgreich verbunden.' };
};

const getPulsoidPlayerConfig = (): PulsePlayerConfig | null => {
  const config = getPulsoidConfig();
  if (!config) {
    return null;
  }

  return {
    id: config.playerId,
    name: config.playerName,
    provider: 'pulsoid-oauth',
    endpoint: config.endpoint,
    valuePath: config.valuePath,
  };
};

export const getPulsePlayers = (): PulsePlayerConfig[] => {
  const raw = process.env.NEXT_PUBLIC_PULSE_PLAYERS;
  let parsedPlayers: PulsePlayerConfig[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PulsePlayerConfig[];
      if (Array.isArray(parsed)) {
        parsedPlayers = parsed.filter((entry) => entry && entry.id && entry.name && entry.provider);
      }
    } catch (error) {
      console.warn('Could not parse NEXT_PUBLIC_PULSE_PLAYERS.', error);
    }
  }

  const pulsoidPlayer = getPulsoidPlayerConfig();
  if (pulsoidPlayer && !parsedPlayers.some((entry) => entry.id === pulsoidPlayer.id)) {
    parsedPlayers.push(pulsoidPlayer);
  }

  return parsedPlayers;
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

  let resolvedPlayer = player;

  if (player.provider === 'pulsoid-oauth') {
    const session = getPulsoidSession();
    if (!session?.accessToken) {
      return {
        id: player.id,
        name: player.name,
        bpm: null,
        status: 'missing',
        source: 'pulsoid-oauth',
        updatedAt: null,
        message: 'Pulsoid ist noch nicht verbunden.',
      };
    }

    if (session.expiresAt && Date.now() >= session.expiresAt) {
      return {
        id: player.id,
        name: player.name,
        bpm: null,
        status: 'error',
        source: 'pulsoid-oauth',
        updatedAt: null,
        message: 'Pulsoid access token ist abgelaufen. Bitte neu verbinden.',
      };
    }

    resolvedPlayer = {
      ...player,
      token: session.accessToken,
      endpoint: player.endpoint ?? getPulsoidConfig()?.endpoint,
      valuePath: player.valuePath ?? getPulsoidConfig()?.valuePath,
    };
  }

  if (!resolvedPlayer.endpoint) {
    return {
      id: resolvedPlayer.id,
      name: resolvedPlayer.name,
      bpm: null,
      status: 'missing',
      source: resolvedPlayer.provider,
      updatedAt: null,
      message: 'No endpoint configured.',
    };
  }

  try {
    const response = await fetch(resolvedPlayer.endpoint, {
      method: 'GET',
      headers: buildHeaders(resolvedPlayer),
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        id: resolvedPlayer.id,
        name: resolvedPlayer.name,
        bpm: null,
        status: 'error',
        source: resolvedPlayer.provider,
        updatedAt: null,
        message: `HTTP ${response.status}`,
      };
    }

    const payload = await response.json();
    const bpm = resolveBpm(payload, resolvedPlayer.valuePath);

    return {
      id: resolvedPlayer.id,
      name: resolvedPlayer.name,
      bpm,
      status: bpm !== null ? 'ok' : 'missing',
      source: resolvedPlayer.provider,
      updatedAt: Date.now(),
      message: bpm !== null ? undefined : 'No BPM value found in JSON payload.',
    };
  } catch (error) {
    return {
      id: resolvedPlayer.id,
      name: resolvedPlayer.name,
      bpm: null,
      status: 'error',
      source: resolvedPlayer.provider,
      updatedAt: null,
      message: error instanceof Error ? error.message : 'Unknown pulse request error.',
    };
  }
};

export const fetchAllPulseReadings = async (): Promise<PulseReading[]> => {
  const players = getPulsePlayers();
  return Promise.all(players.map((player) => fetchPulseReading(player)));
};
