
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
        'grid grid-cols-2 gap-2 overflow-hidden text-white obs-browser-source',
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
        'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-lg backdrop-blur [scrollbar-width:none]',
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
          className={cn('hyperate-frame w-full overflow-hidden rounded-xl border-0 bg-transparent', embedded ? 'h-[52px]' : 'h-[92px]')}
          allow="autoplay; clipboard-read; clipboard-write; encrypted-media"
          referrerPolicy="no-referrer-when-downgrade"
          scrolling="no"
          data-hyperate-frame="true"
          style={{ background: 'transparent', colorScheme: 'dark' }}
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
