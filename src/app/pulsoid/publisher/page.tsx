"use client";

import { useEffect, useMemo, useState } from 'react';
import { HeartPulse, Loader2, PlayCircle, PlugZap, Square, Unplug } from 'lucide-react';
import { beginPulsoidOAuthLogin, clearPulsoidOAuthSession, getPulsePlayers, getPulsoidSession, isPulsoidConfigured, isPulsoidSessionValid, type PulsoidSession } from '@/lib/pulse';
import { clearPulseBroadcastEntry, writePulseBroadcastEntry } from '@/lib/pulse-broadcast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type PublisherStatus = 'idle' | 'publishing' | 'error';

const PULSOID_REALTIME_URL = 'wss://dev.pulsoid.net/api/v1/data/real_time';
const selectedPlayerStorageKey = 'bruchchallenge:pulse-publisher:selected-player';

const formatPulsoidExpiry = (expiresAt: number | null): string => {
  if (!expiresAt) {
    return 'unknown';
  }

  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    return 'expired';
  }

  const remainingMinutes = Math.round(remainingMs / 60000);
  return `${remainingMinutes} min left`;
};

const parseRealtimeMessage = (rawMessage: string): { bpm: number | null; measuredAt: number | null; message?: string } => {
  const trimmed = rawMessage.trim();

  if (!trimmed) {
    return { bpm: null, measuredAt: null, message: 'Leere Nachricht vom Pulsoid-WebSocket erhalten.' };
  }

  if (trimmed.startsWith('{')) {
    try {
      const payload = JSON.parse(trimmed) as { measured_at?: number; data?: { heart_rate?: number } };
      const bpm = typeof payload.data?.heart_rate === 'number' ? payload.data.heart_rate : null;
      return {
        bpm,
        measuredAt: typeof payload.measured_at === 'number' ? payload.measured_at : null,
        message: bpm === null ? 'Keine Herzfrequenz im WebSocket-Event gefunden.' : undefined,
      };
    } catch {
      return { bpm: null, measuredAt: null, message: 'WebSocket-Nachricht konnte nicht als JSON gelesen werden.' };
    }
  }

  const numericBpm = Number(trimmed);
  if (Number.isFinite(numericBpm)) {
    return { bpm: numericBpm, measuredAt: null };
  }

  return { bpm: null, measuredAt: null, message: `Unbekanntes WebSocket-Format: ${trimmed}` };
};

export default function PulsoidPublisherPage() {
  const { toast } = useToast();
  const configuredPlayers = useMemo(() => getPulsePlayers().filter((player) => player.provider === 'broadcast'), []);
  const [selectedPlayerId, setSelectedPlayerId] = useState(configuredPlayers[0]?.id ?? '');
  const [session, setSession] = useState<PulsoidSession | null>(null);
  const [publisherStatus, setPublisherStatus] = useState<PublisherStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Noch nicht verbunden.');
  const [latestBpm, setLatestBpm] = useState<number | null>(null);

  const pulsoidConfigured = isPulsoidConfigured();
  const selectedPlayer = configuredPlayers.find((player) => player.id === selectedPlayerId) ?? null;

  useEffect(() => {
    const storedPlayerId = typeof window !== 'undefined'
      ? window.localStorage.getItem(selectedPlayerStorageKey)
      : null;

    if (storedPlayerId && configuredPlayers.some((player) => player.id === storedPlayerId)) {
      setSelectedPlayerId(storedPlayerId);
    }

    setSession(getPulsoidSession());
  }, [configuredPlayers]);

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedPlayerId) {
      window.localStorage.setItem(selectedPlayerStorageKey, selectedPlayerId);
    }
  }, [selectedPlayerId]);

  useEffect(() => {
    if (publisherStatus !== 'publishing' || !selectedPlayer) {
      return;
    }

    let isCancelled = false;
    let reconnectAttempts = 0;
    let reconnectTimeoutId: number | null = null;
    let socket: WebSocket | null = null;
    let intentionalClose = false;

    const cleanupSocket = () => {
      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = null;
      }

      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };

    const connectSocket = () => {
      const currentSession = getPulsoidSession();
      setSession(currentSession);

      if (!currentSession?.accessToken || !isPulsoidSessionValid()) {
        setPublisherStatus('error');
        setStatusMessage('Pulsoid token fehlt oder ist abgelaufen. Bitte neu verbinden.');
        return;
      }

      const url = new URL(PULSOID_REALTIME_URL);
      url.searchParams.set('access_token', currentSession.accessToken);

      setStatusMessage(reconnectAttempts > 0 ? `Verbinde Realtime-Stream erneut (Versuch ${reconnectAttempts + 1})...` : 'Verbinde Realtime-Stream...');
      socket = new WebSocket(url.toString());

      socket.onopen = () => {
        reconnectAttempts = 0;
        if (!isCancelled) {
          setStatusMessage('Realtime verbunden. Warte auf Herzfrequenz...');
        }
      };

      socket.onmessage = (event) => {
        const payload = typeof event.data === 'string' ? event.data : '';
        const parsed = parseRealtimeMessage(payload);

        void writePulseBroadcastEntry({
          id: selectedPlayer.id,
          name: selectedPlayer.name,
          bpm: parsed.bpm,
          status: parsed.bpm !== null ? 'ok' : 'missing',
          source: 'pulsoid',
          updatedAt: Date.now(),
          measuredAt: parsed.measuredAt,
          message: parsed.message,
        });

        if (!isCancelled) {
          setLatestBpm(parsed.bpm);
          setStatusMessage(parsed.bpm !== null ? `Publishing läuft: ${parsed.bpm} BPM` : (parsed.message ?? 'Publishing läuft ohne BPM-Wert.'));
        }
      };

      socket.onerror = () => {
        if (!isCancelled) {
          setStatusMessage('Pulsoid WebSocket Fehler. Reconnect wird vorbereitet...');
        }
      };

      socket.onclose = () => {
        if (isCancelled || intentionalClose) {
          return;
        }

        const currentSessionAfterClose = getPulsoidSession();
        if (!currentSessionAfterClose?.accessToken || !isPulsoidSessionValid()) {
          setPublisherStatus('error');
          setStatusMessage('Pulsoid token fehlt oder ist abgelaufen. Bitte neu verbinden.');
          return;
        }

        reconnectAttempts += 1;
        const delay = Math.min(10000, 1000 * Math.max(1, reconnectAttempts));
        setStatusMessage(`Realtime-Verbindung unterbrochen. Neuer Versuch in ${Math.round(delay / 1000)}s...`);
        reconnectTimeoutId = window.setTimeout(() => {
          connectSocket();
        }, delay);
      };
    };

    connectSocket();

    return () => {
      isCancelled = true;
      intentionalClose = true;
      cleanupSocket();
    };
  }, [publisherStatus, selectedPlayer]);

  const handleConnect = () => {
    try {
      beginPulsoidOAuthLogin();
    } catch (error) {
      toast({ title: 'Pulsoid OAuth error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDisconnect = async () => {
    if (selectedPlayer) {
      await clearPulseBroadcastEntry(selectedPlayer.id);
    }
    clearPulsoidOAuthSession();
    setSession(null);
    setPublisherStatus('idle');
    setLatestBpm(null);
    setStatusMessage('Pulsoid getrennt.');
  };

  const handleStartPublishing = () => {
    if (!selectedPlayer) {
      toast({ title: 'Kein Spieler gewählt', description: 'Wähle zuerst einen broadcast-Player aus NEXT_PUBLIC_PULSE_PLAYERS.', variant: 'destructive' });
      return;
    }

    if (!isPulsoidSessionValid()) {
      toast({ title: 'Pulsoid nicht verbunden', description: 'Verbinde zuerst Pulsoid auf diesem Gerät.', variant: 'destructive' });
      return;
    }

    setPublisherStatus('publishing');
    setStatusMessage('Publishing wird gestartet...');
  };

  const handleStopPublishing = async () => {
    setPublisherStatus('idle');
    setStatusMessage('Publishing gestoppt.');
    if (selectedPlayer) {
      await clearPulseBroadcastEntry(selectedPlayer.id);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <HeartPulse className="h-6 w-6 text-destructive" />
            Pulsoid Publisher
          </CardTitle>
          <CardDescription>
            Dieses Gerät verbindet sich einmal mit Pulsoid und published danach die BPM in Firebase. Zuschauer lesen nur Firebase und müssen Pulsoid nicht autorisieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pulsoidConfigured && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Pulsoid OAuth ist noch nicht vollständig konfiguriert. Es fehlen mindestens Client ID oder Redirect URI.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Broadcast-Spieler</label>
            <select
              value={selectedPlayerId}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {configuredPlayers.map((player) => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Diese Liste kommt aus NEXT_PUBLIC_PULSE_PLAYERS mit provider="broadcast".
            </p>
          </div>

          <div className="rounded-md border p-4 text-sm">
            <p><strong>Pulsoid Session:</strong> {session?.accessToken ? `verbunden (${formatPulsoidExpiry(session.expiresAt)})` : 'nicht verbunden'}</p>
            <p className="mt-1"><strong>Publisher Status:</strong> {statusMessage}</p>
            <p className="mt-1"><strong>Letzter BPM:</strong> {latestBpm ?? '—'}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleConnect} disabled={!pulsoidConfigured}>
              <PlugZap className="mr-2 h-4 w-4" />
              {session?.accessToken ? 'Pulsoid neu verbinden' : 'Pulsoid verbinden'}
            </Button>
            <Button type="button" variant="outline" onClick={handleDisconnect} disabled={!session?.accessToken}>
              <Unplug className="mr-2 h-4 w-4" />
              Trennen
            </Button>
            <Button type="button" onClick={handleStartPublishing} disabled={publisherStatus === 'publishing' || !session?.accessToken}>
              {publisherStatus === 'publishing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
              Publishing starten
            </Button>
            <Button type="button" variant="outline" onClick={handleStopPublishing} disabled={publisherStatus !== 'publishing'}>
              <Square className="mr-2 h-4 w-4" />
              Publishing stoppen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
