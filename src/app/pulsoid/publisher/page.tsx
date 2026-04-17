"use client";

import { useEffect, useMemo, useState } from 'react';
import { HeartPulse, Loader2, PlayCircle, PlugZap, Square, Unplug } from 'lucide-react';
import { beginPulsoidOAuthLogin, clearPulsoidOAuthSession, getPulsePlayers, getPulsoidSession, isPulsoidConfigured, isPulsoidSessionValid, type PulsoidSession } from '@/lib/pulse';
import { clearPulseBroadcastEntry, writePulseBroadcastEntry } from '@/lib/pulse-broadcast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type PublisherStatus = 'idle' | 'publishing' | 'error';

const PULSOID_LATEST_HEART_RATE_URL = 'https://dev.pulsoid.net/api/v1/data/heart_rate/latest';
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

    const publishOnce = async () => {
      const currentSession = getPulsoidSession();
      setSession(currentSession);

      if (!currentSession?.accessToken || !isPulsoidSessionValid()) {
        setPublisherStatus('error');
        setStatusMessage('Pulsoid token fehlt oder ist abgelaufen. Bitte neu verbinden.');
        return;
      }

      try {
        const response = await fetch(PULSOID_LATEST_HEART_RATE_URL, {
          headers: {
            Authorization: `Bearer ${currentSession.accessToken}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (response.status === 412) {
          await writePulseBroadcastEntry({
            id: selectedPlayer.id,
            name: selectedPlayer.name,
            bpm: null,
            status: 'missing',
            source: 'pulsoid',
            updatedAt: Date.now(),
            measuredAt: null,
            message: 'Pulsoid hat aktuell keine Herzfrequenzdaten für diesen Nutzer.',
          });
          setLatestBpm(null);
          setStatusMessage('Verbunden, aber noch keine Herzfrequenzdaten verfügbar.');
          return;
        }

        if (!response.ok) {
          throw new Error(`Pulsoid HTTP ${response.status}`);
        }

        const payload = await response.json() as { measured_at?: number; data?: { heart_rate?: number } };
        const bpm = payload.data?.heart_rate ?? null;

        await writePulseBroadcastEntry({
          id: selectedPlayer.id,
          name: selectedPlayer.name,
          bpm,
          status: bpm !== null ? 'ok' : 'missing',
          source: 'pulsoid',
          updatedAt: Date.now(),
          measuredAt: payload.measured_at ?? null,
          message: bpm !== null ? undefined : 'Keine Herzfrequenz im API-Response gefunden.',
        });

        if (!isCancelled) {
          setLatestBpm(bpm);
          setStatusMessage(bpm !== null ? `Publishing läuft: ${bpm} BPM` : 'Publishing läuft, aber ohne BPM-Wert.');
        }
      } catch (error) {
        if (!isCancelled) {
          setPublisherStatus('error');
          setStatusMessage(error instanceof Error ? error.message : 'Unknown Pulsoid publishing error.');
        }
      }
    };

    void publishOnce();
    const intervalId = window.setInterval(() => {
      void publishOnce();
    }, 1000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
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
              Diese Liste kommt aus NEXT_PUBLIC_PULSE_PLAYERS mit provider=\"broadcast\".
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
