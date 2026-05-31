"use client";

import { useEffect, useMemo, useState } from 'react';
import { HeartPulse, Link2Off } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_HYPERATE_LINKS,
  getQueryOverrideLinks,
  readHyperateLinks,
  subscribeHyperateLinks,
  type HyperatePlayerLink,
} from '@/lib/hyperate-links';

interface HyperatePulseStripProps {
  className?: string;
  embedded?: boolean;
  livePage?: boolean;
  lowPower?: boolean;
}

const EMBEDDED_LOW_POWER_ROTATION_MS = 15000;
const EMBEDDED_LOW_POWER_LINK_REFRESH_MS = 60000;

const appendHyperateEmbedParams = (rawUrl: string, lowPower = false): string => {
  if (!rawUrl) {
    return '';
  }

  try {
    const url = new URL(rawUrl);
    url.searchParams.set('transparent', 'true');
    url.searchParams.set('background', 'transparent');
    url.searchParams.set('bg', 'transparent');
    url.searchParams.set('theme', 'dark');

    // HypeRate ignores unknown params, but these are harmless hints for embed variants
    // that support reduced motion / throttled rendering.
    if (lowPower) {
      url.searchParams.set('reducedMotion', 'true');
      url.searchParams.set('lowPower', 'true');
      url.searchParams.set('fps', '15');
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
};

export function HyperatePulseStrip({ className, embedded = false, livePage = false, lowPower }: HyperatePulseStripProps) {
  const [links, setLinks] = useState<HyperatePlayerLink[]>(DEFAULT_HYPERATE_LINKS);
  const [queryOverrides, setQueryOverrides] = useState<Partial<Record<string, string>>>({});
  const [queryMode, setQueryMode] = useState<string | null>(null);
  const [activeEmbeddedIndex, setActiveEmbeddedIndex] = useState(0);

  const isEmbeddedLowPower = embedded && queryMode !== 'full' && (lowPower ?? true);
  const isDisabledByQuery = queryMode === 'off';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setQueryOverrides(getQueryOverrideLinks(window.location.search));
      setQueryMode(params.get('hyperate'));
    }

    if (isEmbeddedLowPower) {
      let mounted = true;

      const loadLinks = async () => {
        try {
          const nextLinks = await readHyperateLinks();
          if (mounted) {
            setLinks(nextLinks);
          }
        } catch {
          if (mounted) {
            setLinks(DEFAULT_HYPERATE_LINKS);
          }
        }
      };

      void loadLinks();

      const refreshInterval = window.setInterval(() => {
        void loadLinks();
      }, EMBEDDED_LOW_POWER_LINK_REFRESH_MS);

      return () => {
        mounted = false;
        window.clearInterval(refreshInterval);
      };
    }

    const unsubscribe = subscribeHyperateLinks(setLinks);
    return unsubscribe;
  }, [isEmbeddedLowPower]);

  const displayLinks = useMemo(() => {
    if (isDisabledByQuery) {
      return [];
    }

    return links
      .filter((entry) => entry.enabled)
      .map((entry) => ({
        ...entry,
        url: queryOverrides[entry.id] || entry.url,
      }));
  }, [isDisabledByQuery, links, queryOverrides]);

  useEffect(() => {
    if (!isEmbeddedLowPower || displayLinks.length <= 1) {
      setActiveEmbeddedIndex(0);
      return;
    }

    const rotationInterval = window.setInterval(() => {
      setActiveEmbeddedIndex((currentIndex) => (currentIndex + 1) % displayLinks.length);
    }, EMBEDDED_LOW_POWER_ROTATION_MS);

    return () => window.clearInterval(rotationInterval);
  }, [displayLinks.length, isEmbeddedLowPower]);

  const visibleLinks = useMemo(() => {
    if (!isEmbeddedLowPower || displayLinks.length <= 1) {
      return displayLinks;
    }

    return [displayLinks[activeEmbeddedIndex % displayLinks.length]];
  }, [activeEmbeddedIndex, displayLinks, isEmbeddedLowPower]);

  if (isDisabledByQuery) {
    return null;
  }

  return (
    <div
      className={cn(
        !livePage && 'obs-browser-source',
        'grid overflow-hidden text-white [scrollbar-width:none]',
        isEmbeddedLowPower ? 'grid-cols-1' : 'grid-cols-2',
        embedded ? 'h-[78px] gap-2' : livePage ? 'min-h-[148px] gap-4' : 'h-[140px] w-[790px] max-w-full gap-3',
        className
      )}
    >
      {visibleLinks.map((entry) => (
        <PulseAnimationCard key={entry.id} entry={entry} embedded={embedded} livePage={livePage} lowPower={isEmbeddedLowPower} />
      ))}
    </div>
  );
}

function PulseAnimationCard({
  entry,
  embedded,
  livePage,
  lowPower,
}: {
  entry: HyperatePlayerLink;
  embedded: boolean;
  livePage: boolean;
  lowPower: boolean;
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
        'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/55 [scrollbar-width:none]',
        lowPower ? 'shadow-none' : 'shadow-lg backdrop-blur',
        embedded ? 'px-2 py-1.5' : 'px-4 py-3'
      )}
    >
      {!lowPower && (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(244,63,94,0.32),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(41,171,226,0.22),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.70),rgba(2,6,23,0.88))]" />
      )}

      <div className={cn('flex items-center justify-between gap-2', embedded ? 'mb-1' : 'mb-2')}>
        <div className="flex min-w-0 items-center gap-1.5">
          <HeartPulse
            className={cn(
              'shrink-0 text-rose-300',
              !lowPower && 'drop-shadow-[0_0_10px_rgba(244,63,94,0.85)]',
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
            src={appendHyperateEmbedParams(entry.url, lowPower)}
            className="hyperate-frame pointer-events-none absolute left-0 top-0 border-0 bg-transparent"
            allow="autoplay; clipboard-read; clipboard-write; encrypted-media"
            referrerPolicy="no-referrer-when-downgrade"
            scrolling="no"
            data-hyperate-frame="true"
            loading={lowPower ? 'lazy' : 'eager'}
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
