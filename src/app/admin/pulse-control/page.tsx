"use client";

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, Loader2, RadioTower } from 'lucide-react';
import { getPulsePlayers } from '@/lib/pulse';
import { writePulseBroadcastEntry } from '@/lib/pulse-broadcast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PulseControlPage() {
  const router = useRouter();
  const { isAdmin, isAuthReady } = useAuth();
  const players = useMemo(() => getPulsePlayers(), []);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthReady && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isAuthReady, router]);

  const writeValue = (playerId: string, name: string) => {
    const bpm = Number(values[playerId]);
    if (!Number.isFinite(bpm) || bpm <= 0) {
      toast({ title: 'Ungültiger Puls', description: 'Bitte eine positive Zahl eintragen.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      await writePulseBroadcastEntry({
        id: playerId,
        name,
        bpm: Math.round(bpm),
        status: 'ok',
        source: 'manual',
        updatedAt: Date.now(),
        measuredAt: Date.now(),
        message: 'manual update',
      });
      toast({ title: `${name} aktualisiert`, description: `${Math.round(bpm)} bpm gesendet.` });
    });
  };

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="mt-4 text-lg">Admin-Status wird geladen...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-primary/30 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioTower className="h-6 w-6 text-primary" />
            Pulse Control
          </CardTitle>
          <CardDescription>
            Kostenloser Fallback ohne HypeRate-OAuth. Werte werden in den bestehenden Pulse-Broadcast geschrieben und erscheinen unter /obs/pulse.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {players.map((player) => (
          <Card key={player.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-rose-400" />
                {player.name}
              </CardTitle>
              <CardDescription>ID: {player.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>BPM</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  min="1"
                  placeholder="z. B. 96"
                  value={values[player.id] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [player.id]: event.target.value }))}
                />
              </div>
              <Button className="w-full" disabled={isPending} onClick={() => writeValue(player.id, player.name)}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Senden
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
