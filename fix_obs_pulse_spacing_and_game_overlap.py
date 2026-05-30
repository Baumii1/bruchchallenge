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
    p.write_text(content, encoding="utf-8")
    print(f"patched {path}")

obs_path = "src/app/obs/page.tsx"
if Path(obs_path).exists():
    text = read(obs_path)
    text = re.sub(r"const\s+GAMES_PER_PAGE\s*=\s*\d+\s*;", "const GAMES_PER_PAGE = 3;", text)
    text = text.replace("space-y-2 overflow-hidden", "space-y-2 overflow-hidden pb-2")
    text = text.replace("space-y-2.5 overflow-hidden", "space-y-2.5 overflow-hidden pb-2")
    text = text.replace("space-y-3 overflow-hidden", "space-y-3 overflow-hidden pb-2")
    write(obs_path, text)
else:
    print(f"skipped missing {obs_path}")

strip_path = "src/components/obs/HyperatePulseStrip.tsx"
if Path(strip_path).exists():
    text = read(strip_path)
    text = text.replace(
        "embedded ? 'h-[88px] gap-2' : livePage ?",
        "embedded ? 'mt-2 h-[88px] gap-2' : livePage ?"
    )
    text = text.replace(
        "embedded ? 'h-[104px] gap-2' : livePage ?",
        "embedded ? 'mt-2 h-[104px] gap-2' : livePage ?"
    )
    text = text.replace("'mt-2 mt-2 ", "'mt-2 ")
    write(strip_path, text)
else:
    print(f"skipped missing {strip_path}")

globals_path = "src/app/globals.css"
if Path(globals_path).exists():
    text = read(globals_path)
    if "html:has(.obs-page-root)" not in text:
        text += """\n\n/* OBS-only browser-source cleanup */\nhtml:has(.obs-page-root),\nbody:has(.obs-page-root) {\n  overflow: hidden !important;\n  background: transparent !important;\n}\n\n.obs-page-root,\n.obs-page-root *,\n.obs-browser-source,\n.obs-browser-source * {\n  scrollbar-width: none !important;\n  -ms-overflow-style: none !important;\n}\n\n.obs-page-root::-webkit-scrollbar,\n.obs-page-root *::-webkit-scrollbar,\n.obs-browser-source::-webkit-scrollbar,\n.obs-browser-source *::-webkit-scrollbar {\n  width: 0 !important;\n  height: 0 !important;\n  display: none !important;\n}\n"""
    write(globals_path, text)
else:
    print(f"skipped missing {globals_path}")

print()
print("Done. Now run:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
