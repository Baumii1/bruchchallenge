from pathlib import Path
import re

ROOT = Path.cwd()

def read(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return p.read_text(encoding="utf-8")

def write(path: str, content: str) -> None:
    p = ROOT / path
    p.write_text(content, encoding="utf-8")
    print(f"patched {path}")

# 1) Make HypeRate link storage tolerant to Firestore permission errors.
path = "src/lib/hyperate-links.ts"
text = read(path)

old = """export const writeHyperateLinks = async (links: HyperatePlayerLink[]): Promise<HyperatePlayerLink[]> => {
  const now = Date.now();
  const normalizedLinks = normalizeLinks(links).map((entry) => ({ ...entry, updatedAt: now }));
  persistLocalHyperateLinks(normalizedLinks);

  const hyperateDoc = getHyperateDoc();
  if (hyperateDoc) {
    await setDoc(hyperateDoc, { links: normalizedLinks, updatedAt: now }, { merge: true });
  }

  return normalizedLinks;
};"""

new = """export const writeHyperateLinks = async (links: HyperatePlayerLink[]): Promise<HyperatePlayerLink[]> => {
  const now = Date.now();
  const normalizedLinks = normalizeLinks(links).map((entry) => ({ ...entry, updatedAt: now }));
  persistLocalHyperateLinks(normalizedLinks);

  const hyperateDoc = getHyperateDoc();
  if (hyperateDoc) {
    try {
      await setDoc(hyperateDoc, { links: normalizedLinks, updatedAt: now }, { merge: true });
    } catch (error) {
      console.warn(
        'HypeRate links were saved locally, but Firestore sync failed. Check Firestore rules for bruchchallenge/hyperate-links.',
        error
      );
    }
  }

  return normalizedLinks;
};"""

if old in text:
    text = text.replace(old, new)
else:
    print("writeHyperateLinks exact block not found; trying regex fallback.")
    pattern = re.compile(
        r"export const writeHyperateLinks = async \(links: HyperatePlayerLink\[\]\): Promise<HyperatePlayerLink\[\]> => \{.*?\n\};",
        re.S,
    )
    text, count = pattern.subn(new, text, count=1)
    if count == 0:
        raise RuntimeError("Could not patch writeHyperateLinks.")

write(path, text)

# 2) Make Pulse broadcast writes tolerant too, for /admin/pulse-control.
path = "src/lib/pulse-broadcast.ts"
text = read(path)

text = text.replace(
"""  await setDoc(
    pulseDoc,
    {
      entries: {
        [entry.id]: sanitizedEntry,
      },
      updatedAt: Date.now(),
    },
    { merge: true }
  );""",
"""  try {
    await setDoc(
      pulseDoc,
      {
        entries: {
          [entry.id]: sanitizedEntry,
        },
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn(
      'Pulse entry was saved locally, but Firestore sync failed. Check Firestore rules for bruchchallenge/pulse-broadcast.',
      error
    );
  }"""
)

text = text.replace(
"""  await setDoc(
    pulseDoc,
    {
      entries: {
        [playerId]: nextEntry,
      },
      updatedAt: Date.now(),
    },
    { merge: true }
  );""",
"""  try {
    await setDoc(
      pulseDoc,
      {
        entries: {
          [playerId]: nextEntry,
        },
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn(
      'Pulse disconnect state was saved locally, but Firestore sync failed. Check Firestore rules for bruchchallenge/pulse-broadcast.',
      error
    );
  }"""
)

write(path, text)

# 3) Add a defensive catch to /admin/hyperate so the admin page itself never crashes on save.
path = "src/app/admin/hyperate/page.tsx"
text = read(path)

old = """      const savedLinks = await writeHyperateLinks(sanitizedLinks);
      setLinks(savedLinks);
      toast({ title: 'HypeRate-Links gespeichert', description: 'Das OBS-Pulse-Overlay aktualisiert sich automatisch.' });"""

new = """      try {
        const savedLinks = await writeHyperateLinks(sanitizedLinks);
        setLinks(savedLinks);
        toast({ title: 'HypeRate-Links gespeichert', description: 'Das OBS-Pulse-Overlay aktualisiert sich automatisch.' });
      } catch (error) {
        toast({
          title: 'Links nur lokal gespeichert',
          description: error instanceof Error ? error.message : 'Firestore-Sync fehlgeschlagen. Prüfe die Firestore-Regeln.',
          variant: 'destructive',
        });
      }"""

if old in text:
    text = text.replace(old, new)
else:
    print("admin/hyperate save block not found; leaving page unchanged.")

write(path, text)

print()
print("Done. Now run:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
