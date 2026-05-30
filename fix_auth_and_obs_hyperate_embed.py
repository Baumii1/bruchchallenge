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

# 1) Stabilize Firebase auth persistence and avoid anonymous sign-in racing persisted admin login.
path = "src/lib/firebase-client.ts"
text = read(path)

text = text.replace(
    "import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';",
    "import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, signInAnonymously, type Auth } from 'firebase/auth';"
)

# Add auth state readiness helpers after cached variables.
marker = "let viewerSessionPromise: Promise<void> | null = null;\n"
helper = """let authPersistencePromise: Promise<void> | null = null;
let initialAuthStatePromise: Promise<void> | null = null;

const ensureAuthPersistence = async (auth: Auth): Promise<void> => {
  if (!authPersistencePromise) {
    authPersistencePromise = setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Could not enforce Firebase local auth persistence.', error);
    });
  }

  await authPersistencePromise;
};

const waitForInitialAuthState = async (auth: Auth): Promise<void> => {
  if (auth.currentUser) {
    return;
  }

  if (!initialAuthStatePromise) {
    initialAuthStatePromise = new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        () => {
          unsubscribe();
          resolve();
        },
        () => {
          unsubscribe();
          resolve();
        }
      );
    });
  }

  await initialAuthStatePromise;
};

"""
if helper not in text:
    text = text.replace(marker, marker + helper)

# Patch getFirebaseAuthClient to set persistence early.
old = """  const app = getFirebaseApp();
  cachedAuth = app ? getAuth(app) : null;
  return cachedAuth;
};"""
new = """  const app = getFirebaseApp();
  cachedAuth = app ? getAuth(app) : null;
  if (cachedAuth && typeof window !== 'undefined') {
    void ensureAuthPersistence(cachedAuth);
  }
  return cachedAuth;
};"""
text = text.replace(old, new)

# Patch ensureViewerFirebaseSession to wait for persisted auth before anonymous login.
old = """  if (auth.currentUser) {
    return;
  }

  if (!viewerSessionPromise) {
    viewerSessionPromise = signInAnonymously(auth)
      .then(() => undefined)
      .catch((error) => {
        console.warn('Anonymous Firebase sign-in unavailable for viewer session.', error);
      })
      .finally(() => {
        viewerSessionPromise = null;
      });
  }

  await viewerSessionPromise;"""
new = """  await ensureAuthPersistence(auth);
  await waitForInitialAuthState(auth);

  if (auth.currentUser) {
    return;
  }

  if (!viewerSessionPromise) {
    viewerSessionPromise = signInAnonymously(auth)
      .then(() => undefined)
      .catch((error) => {
        console.warn('Anonymous Firebase sign-in unavailable for viewer session.', error);
      })
      .finally(() => {
        viewerSessionPromise = null;
      });
  }

  await viewerSessionPromise;"""
text = text.replace(old, new)

write(path, text)

# 2) Make explicit local persistence part of admin login too.
path = "src/context/AuthContext.tsx"
text = read(path)
text = text.replace(
    "import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';",
    "import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';"
)

old = """    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);"""
new = """    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);"""
text = text.replace(old, new)
write(path, text)

# 3) Hide scrollbars globally for OBS routes and make iframe embedding cleaner.
path = "src/app/globals.css"
text = read(path)
css = r"""

/* OBS browser-source surfaces must never show scrollbars. */
body:has(.obs-browser-source),
body:has(.obs-browser-source) html {
  overflow: hidden !important;
  background: transparent !important;
}

.obs-browser-source,
.obs-browser-source * {
  scrollbar-width: none;
}

.obs-browser-source::-webkit-scrollbar,
.obs-browser-source *::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

.hyperate-frame {
  display: block;
  overflow: hidden;
  background: transparent;
  color-scheme: dark;
}
"""
if "obs-browser-source" not in text:
    text += css
write(path, text)

# 4) Patch HypeRate strip: no scrollbars, better clipping, transparent iframe attrs/style.
path = "src/components/obs/HyperatePulseStrip.tsx"
text = read(path)

text = text.replace(
    "'grid grid-cols-2 gap-2 text-white'",
    "'grid grid-cols-2 gap-2 overflow-hidden text-white obs-browser-source'"
)

# Make card stronger no-scroll.
text = text.replace(
    "'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-lg backdrop-blur'",
    "'relative isolate overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-lg backdrop-blur [scrollbar-width:none]'"
)

# Add iframe attributes/classes if not already patched.
if "data-hyperate-frame" not in text:
    text = text.replace(
"""          className={cn('w-full rounded-xl border-0 bg-transparent', embedded ? 'h-[52px]' : 'h-[92px]')}
          allow="autoplay; clipboard-read; clipboard-write; encrypted-media"
          referrerPolicy="no-referrer-when-downgrade"
        />""",
"""          className={cn('hyperate-frame w-full overflow-hidden rounded-xl border-0 bg-transparent', embedded ? 'h-[52px]' : 'h-[92px]')}
          allow="autoplay; clipboard-read; clipboard-write; encrypted-media"
          referrerPolicy="no-referrer-when-downgrade"
          scrolling="no"
          data-hyperate-frame="true"
          style={{ background: 'transparent', colorScheme: 'dark' }}
        />"""
    )

write(path, text)

# 5) Mark OBS pages explicitly as browser source roots.
for path in ["src/app/obs/page.tsx", "src/app/obs/pulse/page.tsx"]:
    p = ROOT / path
    if not p.exists():
        print(f"skipped missing {path}")
        continue
    text = read(path)
    text = text.replace("className=\"fixed inset-0", "className=\"obs-browser-source fixed inset-0")
    text = text.replace("className='fixed inset-0", "className='obs-browser-source fixed inset-0")
    write(path, text)

print()
print("Done. Now run:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
