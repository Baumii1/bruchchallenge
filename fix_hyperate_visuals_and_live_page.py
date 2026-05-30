from pathlib import Path
import re

ROOT = Path.cwd()


def read(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        raise FileNotFoundError(f"Missing expected file: {path}")
    return p.read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    print(f"patched {path}")


# 1) Replace the HypeRate visual strip with a larger clipped viewport, dark-mode filter and no scrollbars.
hyperate_component = '''"use client";

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
    // Harmless if ignored; useful if HypeRate supports transparent/dark embed params.
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
        'obs-browser-source grid grid-cols-2 overflow-hidden text-white [scrollbar-width:none]',
        embedded ? 'h-[104px] gap-2' : livePage ? 'min-h-[152px] gap-4' : 'h-[152px] w-[790px] max-w-full gap-3',
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
  const viewportHeight = embedded ? 76 : livePage ? 104 : 104;
  const frameHeight = embedded ? 100 : 132;
  const frameWidth = embedded ? 245 : 360;
  const frameScale = embedded ? 0.74 : livePage ? 0.86 : 0.86;
  const frameTranslateX = embedded ? -30 : -34;
  const frameTranslateY = embedded ? -12 : -12;

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
              colorScheme: 'dark',
              filter: 'invert(1) hue-rotate(180deg) saturate(1.35) contrast(0.96) brightness(1.62)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 text-center text-white/45',
            embedded ? 'h-[76px] px-2 text-[9px]' : 'h-[104px] px-4 text-xs'
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
'''
write("src/components/obs/HyperatePulseStrip.tsx", hyperate_component)

# 2) Ensure OBS CSS is hard no-scroll and iframe-friendly.
path = "src/app/globals.css"
text = read(path)
css = '''

/* OBS/HypeRate browser-source cleanup */
html:has(.obs-browser-source),
body:has(.obs-browser-source) {
  overflow: hidden !important;
  background: transparent !important;
}

.obs-browser-source,
.obs-browser-source * {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.obs-browser-source::-webkit-scrollbar,
.obs-browser-source *::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

.hyperate-frame {
  display: block;
  overflow: hidden !important;
  background: transparent !important;
}
'''
if "OBS/HypeRate browser-source cleanup" not in text:
    text += css
write(path, text)

# 3) Mark OBS pages as OBS browser source root and give the pulse strip more space.
for page in ["src/app/obs/page.tsx", "src/app/obs/pulse/page.tsx"]:
    p = ROOT / page
    if not p.exists():
        print(f"skipped missing {page}")
        continue

    text = read(page)
    if "obs-browser-source" not in text:
        text = text.replace('className="fixed inset-0', 'className="obs-browser-source fixed inset-0')
        text = text.replace("className='fixed inset-0", "className='obs-browser-source fixed inset-0")

    text = text.replace("const GAMES_PER_PAGE = 4;", "const GAMES_PER_PAGE = 3;")
    text = text.replace("const GAMES_PER_PAGE = 5;", "const GAMES_PER_PAGE = 3;")
    write(page, text)

# 4) Put the same HypeRate panel into /challenges/live near the top.
live_path = ROOT / "src/app/challenges/live/page.tsx"
if live_path.exists():
    text = read("src/app/challenges/live/page.tsx")

    if "@/components/obs/HyperatePulseStrip" not in text:
        import_line = "import { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';\n"
        last_import_match = list(re.finditer(r"^import .+?;\s*$", text, flags=re.M))
        if last_import_match:
            insert_at = last_import_match[-1].end()
            text = text[:insert_at] + "\n" + import_line + text[insert_at:]
        else:
            text = import_line + text

    panel = '''      <section className="rounded-2xl border border-primary/20 bg-slate-950/80 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-200">Live Pulse</p>
            <h2 className="text-xl font-bold text-white">Merlin & Patrick</h2>
          </div>
          <p className="text-xs text-muted-foreground">HypeRate Feed</p>
        </div>
        <HyperatePulseStrip livePage />
      </section>

'''

    if "<HyperatePulseStrip livePage" not in text:
        pattern = re.compile(r'(return \(\s*<div className="[^"]*space-y-[^"]*">\s*)', re.S)
        text, count = pattern.subn(r"\1\n" + panel, text, count=1)

        if count == 0:
            pattern = re.compile(r"(return \(\s*<div className='[^']*space-y-[^']*'>\s*)", re.S)
            text, count = pattern.subn(r"\1\n" + panel, text, count=1)

        if count == 0:
            print("warning: Could not auto-insert live pulse panel into src/app/challenges/live/page.tsx. Import was added, component is ready.")
        else:
            print("inserted HypeRate panel into /challenges/live")

    write("src/app/challenges/live/page.tsx", text)
else:
    print("skipped missing src/app/challenges/live/page.tsx")

print()
print("Done. Now run:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
