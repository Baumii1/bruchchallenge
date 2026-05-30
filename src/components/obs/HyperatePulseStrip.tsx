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
  livePage?: boolean;
}

const appendHyperateEmbedParams = (rawUrl: string): string => {
  if (!rawUrl) {
    return '';
  }

  try {
    const url = new URL(rawUrl);
    url.searchParams.set('transparent', 'true');
    url.searchParams.set('background', 'transparent');
    url.searchParams.set('bg', 'transparent');
    url.searchParams.set('theme', 'dark');
    return url.toString();
  } catch {
    return rawUrl;
  }
};

export function HyperatePulseStrip({ className, embedded = false, livePage = false }: HyperatePulseStripProps) {
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
        !livePage && 'obs-browser-source',
        'grid grid-cols-2 overflow-hidden text-white [scrollbar-width:none]',
        embedded ? 'h-[78px] gap-2' : livePage ? 'min-h-[148px] gap-4' : 'h-[140px] w-[790px] max-w-full gap-3',
        className
      )}
    >
      {displayLinks.map((entry) => (
        <PulseAnimationCard key={entry.id} entry={entry} embedded={embedded} livePage={livePage} />
      ))}
    </div>
  );
}

function PulseAnimationCard({
  entry,
  embedded,
  livePage,
}: {
  entry: HyperatePlayerLink;
  embedded: boolean;
  livePage: boolean;
}) {
  const viewportHeight = embedded ? 52 : livePage ? 100 : 96;
  const frameHeight = embedded ? 94 : 132;
  const frameWidth = embedded ? 245 : 360;
  const frameScale = embedded ? 0.68 : livePage ? 0.86 : 0.84;
  const frameTranslateX = embedded ? -34 : -34;
  const frameTranslateY = embedded ? -6 : -13;

  return (
    <article
      className={cn(
        'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/55 shadow-lg backdrop-blur [scrollbar-width:none]',
        embedded ? 'px-2 py-1.5' : 'px-4 py-3'
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(244,63,94,0.32),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(41,171,226,0.22),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.70),rgba(2,6,23,0.88))]" />

      <div className={cn('flex items-center justify-between gap-2', embedded ? 'mb-1' : 'mb-2')}>
        <div className="flex min-w-0 items-center gap-1.5">
          <HeartPulse
            className={cn(
              'shrink-0 text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.85)]',
              embedded ? 'h-3.5 w-3.5' : 'h-5 w-5'
            )}
          />
          <p className={cn('truncate font-black uppercase tracking-[0.18em] text-white/95', embedded ? 'text-[9px]' : 'text-sm')}>
            {entry.name}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border border-rose-300/30 bg-rose-500/10 font-black uppercase tracking-[0.18em] text-rose-100',
            embedded ? 'px-1.5 py-0.5 text-[7px]' : 'px-2.5 py-1 text-[10px]'
          )}
        >
          BPM
        </span>
      </div>

      {entry.url ? (
        <div
          className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/75 [scrollbar-width:none]"
          style={{ height: viewportHeight }}
        >
          <iframe
            title={`${entry.name} HypeRate animation`}
            src={appendHyperateEmbedParams(entry.url)}
            className="hyperate-frame pointer-events-none absolute left-0 top-0 border-0 bg-transparent"
            allow="autoplay; clipboard-read; clipboard-write; encrypted-media"
            referrerPolicy="no-referrer-when-downgrade"
            scrolling="no"
            data-hyperate-frame="true"
            style={{
              width: frameWidth,
              height: frameHeight,
              transform: `translate(${frameTranslateX}px, ${frameTranslateY}px) scale(${frameScale})`,
              transformOrigin: 'top left',
              overflow: 'hidden',
              background: 'transparent',
              backgroundColor: 'transparent',
              colorScheme: 'normal',
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 text-center text-white/45',
            embedded ? 'h-[52px] px-2 text-[9px]' : 'h-[96px] px-4 text-xs'
          )}
        >
          <div>
            <Link2Off className="mx-auto mb-1 h-4 w-4" />
            HypeRate-Link fehlt
          </div>
        </div>
      )}
    </article>
  );
}
