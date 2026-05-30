
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

      try {
        const savedLinks = await writeHyperateLinks(sanitizedLinks);
        setLinks(savedLinks);
        toast({ title: 'HypeRate-Links gespeichert', description: 'Das OBS-Pulse-Overlay aktualisiert sich automatisch.' });
      } catch (error) {
        toast({
          title: 'Links nur lokal gespeichert',
          description: error instanceof Error ? error.message : 'Firestore-Sync fehlgeschlagen. Prüfe die Firestore-Regeln.',
          variant: 'destructive',
        });
      }
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
