HYPERATE_STRIP = '"use client";\n\nimport { useEffect, useMemo, useState } from \'react\';\nimport { HeartPulse, Link2Off } from \'lucide-react\';\nimport { cn } from \'@/lib/utils\';\nimport {\n  DEFAULT_HYPERATE_LINKS,\n  getQueryOverrideLinks,\n  subscribeHyperateLinks,\n  type HyperatePlayerLink,\n} from \'@/lib/hyperate-links\';\n\ninterface HyperatePulseStripProps {\n  className?: string;\n  embedded?: boolean;\n  livePage?: boolean;\n}\n\nconst appendHyperateEmbedParams = (rawUrl: string): string => {\n  if (!rawUrl) {\n    return \'\';\n  }\n\n  try {\n    const url = new URL(rawUrl);\n    url.searchParams.set(\'transparent\', \'true\');\n    url.searchParams.set(\'background\', \'transparent\');\n    url.searchParams.set(\'bg\', \'transparent\');\n    url.searchParams.set(\'theme\', \'dark\');\n    return url.toString();\n  } catch {\n    return rawUrl;\n  }\n};\n\nexport function HyperatePulseStrip({ className, embedded = false, livePage = false }: HyperatePulseStripProps) {\n  const [links, setLinks] = useState<HyperatePlayerLink[]>(DEFAULT_HYPERATE_LINKS);\n  const [queryOverrides, setQueryOverrides] = useState<Partial<Record<string, string>>>({});\n\n  useEffect(() => {\n    const unsubscribe = subscribeHyperateLinks(setLinks);\n\n    if (typeof window !== \'undefined\') {\n      setQueryOverrides(getQueryOverrideLinks(window.location.search));\n    }\n\n    return unsubscribe;\n  }, []);\n\n  const displayLinks = useMemo(() => {\n    return links\n      .filter((entry) => entry.enabled)\n      .map((entry) => ({\n        ...entry,\n        url: queryOverrides[entry.id] || entry.url,\n      }));\n  }, [links, queryOverrides]);\n\n  return (\n    <div\n      className={cn(\n        !livePage && \'obs-browser-source\',\n        \'grid grid-cols-2 overflow-hidden text-white [scrollbar-width:none]\',\n        embedded ? \'h-[88px] gap-2\' : livePage ? \'min-h-[148px] gap-4\' : \'h-[140px] w-[790px] max-w-full gap-3\',\n        className\n      )}\n    >\n      {displayLinks.map((entry) => (\n        <PulseAnimationCard key={entry.id} entry={entry} embedded={embedded} livePage={livePage} />\n      ))}\n    </div>\n  );\n}\n\nfunction PulseAnimationCard({\n  entry,\n  embedded,\n  livePage,\n}: {\n  entry: HyperatePlayerLink;\n  embedded: boolean;\n  livePage: boolean;\n}) {\n  const viewportHeight = embedded ? 60 : livePage ? 100 : 96;\n  const frameHeight = embedded ? 94 : 132;\n  const frameWidth = embedded ? 245 : 360;\n  const frameScale = embedded ? 0.68 : livePage ? 0.86 : 0.84;\n  const frameTranslateX = embedded ? -34 : -34;\n  const frameTranslateY = embedded ? -13 : -13;\n\n  return (\n    <article\n      className={cn(\n        \'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/55 shadow-lg backdrop-blur [scrollbar-width:none]\',\n        embedded ? \'px-2 py-1.5\' : \'px-4 py-3\'\n      )}\n    >\n      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(244,63,94,0.32),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(41,171,226,0.22),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.70),rgba(2,6,23,0.88))]" />\n\n      <div className={cn(\'flex items-center justify-between gap-2\', embedded ? \'mb-1\' : \'mb-2\')}>\n        <div className="flex min-w-0 items-center gap-1.5">\n          <HeartPulse\n            className={cn(\n              \'shrink-0 text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.85)]\',\n              embedded ? \'h-3.5 w-3.5\' : \'h-5 w-5\'\n            )}\n          />\n          <p className={cn(\'truncate font-black uppercase tracking-[0.18em] text-white/95\', embedded ? \'text-[9px]\' : \'text-sm\')}>\n            {entry.name}\n          </p>\n        </div>\n        <span\n          className={cn(\n            \'rounded-full border border-rose-300/30 bg-rose-500/10 font-black uppercase tracking-[0.18em] text-rose-100\',\n            embedded ? \'px-1.5 py-0.5 text-[7px]\' : \'px-2.5 py-1 text-[10px]\'\n          )}\n        >\n          BPM\n        </span>\n      </div>\n\n      {entry.url ? (\n        <div\n          className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/75 [scrollbar-width:none]"\n          style={{ height: viewportHeight }}\n        >\n          <iframe\n            title={`${entry.name} HypeRate animation`}\n            src={appendHyperateEmbedParams(entry.url)}\n            className="hyperate-frame pointer-events-none absolute left-0 top-0 border-0 bg-transparent"\n            allow="autoplay; clipboard-read; clipboard-write; encrypted-media"\n            referrerPolicy="no-referrer-when-downgrade"\n            scrolling="no"\n            data-hyperate-frame="true"\n            style={{\n              width: frameWidth,\n              height: frameHeight,\n              transform: `translate(${frameTranslateX}px, ${frameTranslateY}px) scale(${frameScale})`,\n              transformOrigin: \'top left\',\n              overflow: \'hidden\',\n              background: \'transparent\',\n              colorScheme: \'dark\',\n              filter: \'invert(1) hue-rotate(180deg) saturate(1.35) contrast(0.96) brightness(1.62)\',\n            }}\n          />\n          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />\n        </div>\n      ) : (\n        <div\n          className={cn(\n            \'flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 text-center text-white/45\',\n            embedded ? \'h-[60px] px-2 text-[9px]\' : \'h-[96px] px-4 text-xs\'\n          )}\n        >\n          <div>\n            <Link2Off className="mx-auto mb-1 h-4 w-4" />\n            HypeRate-Link fehlt\n          </div>\n        </div>\n      )}\n    </article>\n  );\n}\n'

LIVE_TIMERS = "import type { Challenge, Game } from '@/types';\n\nexport const formatSecondsAsClock = (totalSeconds: number): string => {\n  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));\n  const hours = Math.floor(safeSeconds / 3600);\n  const minutes = Math.floor((safeSeconds % 3600) / 60);\n  const seconds = safeSeconds % 60;\n\n  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;\n};\n\nexport const getLiveChallengeSeconds = (challenge: Challenge | null | undefined, now = Date.now()): number => {\n  if (!challenge) {\n    return 0;\n  }\n\n  let totalSeconds = challenge.challengeAccumulatedDuration ?? 0;\n\n  if (challenge.status === 'live' && challenge.isChallengeTimerActive && challenge.challengeStartedAt) {\n    totalSeconds += (now - challenge.challengeStartedAt) / 1000;\n  }\n\n  return totalSeconds;\n};\n\nexport const getLiveGameSeconds = (challenge: Challenge | null | undefined, game: Game, now = Date.now()): number => {\n  let totalSeconds = game.accumulatedDuration ?? 0;\n\n  if (challenge?.status === 'live' && game.isTimerActive && game.timerStartedAt) {\n    totalSeconds += (now - game.timerStartedAt) / 1000;\n  }\n\n  return totalSeconds;\n};\n"

from pathlib import Path
import re

ROOT = Path.cwd()

def p(path: str) -> Path:
    return ROOT / path

def read(path: str) -> str:
    file = p(path)
    if not file.exists():
        raise FileNotFoundError(f"Missing expected file: {path}")
    return file.read_text(encoding="utf-8")

def write(path: str, content: str) -> None:
    file = p(path)
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(content, encoding="utf-8")
    print(f"patched {path}")

# A) Apply the OBS/livepage cleanup from the previous fix.
write("src/components/obs/HyperatePulseStrip.tsx", HYPERATE_STRIP)

globals_path = "src/app/globals.css"
globals_text = read(globals_path)

globals_text = re.sub(
    r"\n*/\* OBS/HypeRate browser-source cleanup \*/.*?\.hyperate-frame\s*\{.*?\}\s*",
    "\n",
    globals_text,
    flags=re.S,
)
globals_text = re.sub(
    r"\n*/\* OBS browser-source surfaces must never show scrollbars\. \*/.*?\.hyperate-frame\s*\{.*?\}\s*",
    "\n",
    globals_text,
    flags=re.S,
)
globals_text = re.sub(
    r"\n*/\* OBS-only browser-source cleanup\..*?\.hyperate-frame\s*\{.*?\}\s*",
    "\n",
    globals_text,
    flags=re.S,
)

obs_css = r'''

/* OBS-only browser-source cleanup.
   Do not target body via :has(.obs-browser-source), because /challenges/live embeds the pulse component too. */
html:has(.obs-page-root),
body:has(.obs-page-root) {
  overflow: hidden !important;
  background: transparent !important;
}

.obs-page-root,
.obs-page-root *,
.obs-browser-source,
.obs-browser-source * {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.obs-page-root::-webkit-scrollbar,
.obs-page-root *::-webkit-scrollbar,
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
globals_text += obs_css
write(globals_path, globals_text)

for path in ["src/app/obs/page.tsx", "src/app/obs/pulse/page.tsx"]:
    if not p(path).exists():
        print(f"skipped missing {path}")
        continue

    text = read(path)
    text = text.replace('className="obs-browser-source fixed inset-0', 'className="obs-page-root obs-browser-source fixed inset-0')
    text = text.replace("className='obs-browser-source fixed inset-0", "className='obs-page-root obs-browser-source fixed inset-0")
    text = text.replace('className="fixed inset-0', 'className="obs-page-root obs-browser-source fixed inset-0')
    text = text.replace("className='fixed inset-0", "className='obs-page-root obs-browser-source fixed inset-0")
    text = text.replace("obs-page-root obs-page-root", "obs-page-root")
    text = text.replace("obs-browser-source obs-browser-source", "obs-browser-source")
    text = text.replace("const GAMES_PER_PAGE = 3;", "const GAMES_PER_PAGE = 4;")
    write(path, text)

live_path = "src/app/challenges/live/page.tsx"
if p(live_path).exists():
    text = read(live_path)

    text = re.sub(r"^import\s+\{?\s*PulsoidOAuthPanel\s*\}?\s+from\s+['\"].*PulsoidOAuthPanel['\"];\s*\n", "", text, flags=re.M)
    text = re.sub(r"^import\s+.*pulsoid.*;\s*\n", "", text, flags=re.M | re.I)
    text = re.sub(r"\n\s*<PulsoidOAuthPanel\s*/>\s*", "\n", text)
    text = re.sub(r"\n\s*<PulsoidOAuthPanel[^>]*>.*?</PulsoidOAuthPanel>\s*", "\n", text, flags=re.S)

    if "@/components/obs/HyperatePulseStrip" not in text:
        import_line = "import { HyperatePulseStrip } from '@/components/obs/HyperatePulseStrip';\n"
        matches = list(re.finditer(r"^import .+?;\s*$", text, flags=re.M))
        if matches:
            text = text[:matches[-1].end()] + "\n" + import_line + text[matches[-1].end():]
        else:
            text = import_line + text

    # Remove any previous auto-inserted HypeRate panel to avoid duplicates, then insert one clean panel.
    text = re.sub(
        r"\n\s*<section className=\"rounded-2xl border border-primary/20 bg-slate-950/80 p-4 shadow-xl\">\s*"
        r"<div className=\"mb-3 flex items-center justify-between gap-3\">.*?"
        r"<HyperatePulseStrip livePage />\s*</section>\s*",
        "\n",
        text,
        flags=re.S,
    )

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
        inserted = False
        for pattern in [
            r'(return \(\s*<div className="[^"]*space-y-[^"]*">\s*)',
            r"(return \(\s*<div className='[^']*space-y-[^']*'>\s*)",
        ]:
            text2, count = re.subn(pattern, r"\1\n" + panel, text, count=1, flags=re.S)
            if count:
                text = text2
                inserted = True
                break
        if not inserted:
            print("warning: Could not auto-insert HypeRate panel into live page. Import was added only.")

    text = text.replace("obs-page-root", "")
    text = text.replace("obs-browser-source", "")
    text = re.sub(r'className="\s+', 'className="', text)
    text = re.sub(r"\s+\"", '"', text)
    write(live_path, text)
else:
    print(f"skipped missing {live_path}")

write("src/lib/live-timers.ts", LIVE_TIMERS)

# B) Make upcoming/scheduled challenges easy to edit before they are started.
#    The existing editor already supports adding/removing games; this exposes the route where it is needed.

# 1) Add Edit button to upcoming ChallengeCards.
card_path = "src/components/ChallengeCard.tsx"
if p(card_path).exists():
    text = read(card_path)

    if "Edit3" not in text:
        text = text.replace("CalendarDays, Gamepad2, Info, Zap", "CalendarDays, Edit3, Gamepad2, Info, Zap")

    old_footer = '''      <CardFooter className="px-4 md:px-5 pb-4 pt-2">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all">
          <Link href={`/challenges/view?id=${challenge.id}`}>
            <Info className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
      </CardFooter>'''

    new_footer = '''      <CardFooter className="px-4 md:px-5 pb-4 pt-2">
        <div className="flex w-full flex-col gap-2">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all">
            <Link href={`/challenges/view?id=${challenge.id}`}>
              <Info className="mr-2 h-4 w-4" /> View Details
            </Link>
          </Button>
          {challenge.status === 'upcoming' && (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/admin/edit-challenge?id=${challenge.id}`}>
                <Edit3 className="mr-2 h-4 w-4" /> Geplante Challenge bearbeiten
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>'''

    if old_footer in text:
        text = text.replace(old_footer, new_footer)
    elif "Geplante Challenge bearbeiten" not in text:
        print("warning: ChallengeCard footer did not match expected structure; edit button not inserted.")

    write(card_path, text)
else:
    print(f"skipped missing {card_path}")

# 2) Add Edit button to Challenge details page for upcoming challenges.
view_client_path = "src/app/challenges/view/view-client.tsx"
if p(view_client_path).exists():
    text = read(view_client_path)

    text = text.replace("AlertTriangle, Loader2", "AlertTriangle, Edit3, Loader2")

    if "Geplante Challenge bearbeiten" not in text:
        old_return = "  return <ChallengeDetailsClient key={challenge.id} initialChallenge={challenge} />;"
        new_return = '''  return (
    <div className="space-y-4">
      {challenge.status === 'upcoming' && (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link href={`/admin/edit-challenge?id=${challenge.id}`}>
              <Edit3 className="mr-2 h-4 w-4" />
              Geplante Challenge bearbeiten
            </Link>
          </Button>
        </div>
      )}
      <ChallengeDetailsClient key={challenge.id} initialChallenge={challenge} />
    </div>
  );'''
        if old_return in text:
            text = text.replace(old_return, new_return)
        else:
            print("warning: ChallengeDetails view return did not match expected structure; edit button not inserted.")

    write(view_client_path, text)
else:
    print(f"skipped missing {view_client_path}")

# 3) Make edit-client wording explicit: upcoming challenges are safe to change before start.
edit_client_path = "src/app/admin/edit-challenge/edit-client.tsx"
if p(edit_client_path).exists():
    text = read(edit_client_path)
    text = text.replace(
        "Bearbeite Titel, Zeiten, Notizen und Spiele dieser Challenge. Änderungen gelten sofort für die Runtime-Daten.",
        "Bearbeite Titel, Zeiten, Notizen und Spiele. Geplante Challenges können hier vor dem Start vollständig angepasst werden, inklusive neuer Games."
    )
    write(edit_client_path, text)
else:
    print(f"skipped missing {edit_client_path}")

print()
print("Fertig. Jetzt ausführen:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
