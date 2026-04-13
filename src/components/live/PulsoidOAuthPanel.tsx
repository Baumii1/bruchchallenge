"use client";

import { useEffect, useState } from 'react';
import { HeartPulse, PlugZap, ShieldCheck, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { beginPulsoidOAuthLogin, clearPulsoidOAuthSession, getPulsoidSession, isPulsoidConfigured, type PulsoidSession } from '@/lib/pulse';
import { useToast } from '@/hooks/use-toast';

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

export function PulsoidOAuthPanel() {
  const { toast } = useToast();
  const [session, setSession] = useState<PulsoidSession | null>(null);
  const configured = isPulsoidConfigured();

  useEffect(() => {
    const refresh = () => setSession(getPulsoidSession());
    refresh();

    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener('storage', refresh as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', refresh as EventListener);
    };
  }, []);

  if (!configured) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-destructive" />
            Pulsoid OAuth
          </CardTitle>
          <CardDescription>
            Es fehlen noch die Pulsoid-Variablen. Lege zuerst die GitHub Variables für Client ID, Redirect URI und Heart-Rate-Endpoint an.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleConnect = () => {
    try {
      beginPulsoidOAuthLogin();
    } catch (error) {
      toast({ title: 'Pulsoid OAuth error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDisconnect = () => {
    clearPulsoidOAuthSession();
    setSession(null);
    toast({ title: 'Pulsoid disconnected', description: 'Die lokale Pulsoid-Verbindung wurde entfernt.' });
  };

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Pulsoid OAuth
        </CardTitle>
        <CardDescription>
          Verbinde diese Browser-Session mit deinem Pulsoid-Account, damit die Herzfrequenz im Live-Dashboard geladen werden kann.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {session?.accessToken
            ? `Verbunden. Token ${formatPulsoidExpiry(session.expiresAt)}.`
            : 'Noch nicht verbunden. Starte den OAuth-Login, um Pulsoid freizugeben.'}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleConnect}>
            <PlugZap className="mr-2 h-4 w-4" />
            {session?.accessToken ? 'Reconnect Pulsoid' : 'Connect Pulsoid'}
          </Button>
          <Button type="button" variant="outline" onClick={handleDisconnect} disabled={!session?.accessToken}>
            <Unplug className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
