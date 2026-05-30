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

strip_path = "src/components/obs/HyperatePulseStrip.tsx"
if Path(strip_path).exists():
    text = read(strip_path)

    # The whole pulse strip should NOT move down. Only the iframe content inside the card
    # should sit lower/centered. Also make the compact embedded strip shorter.
    text = text.replace("embedded ? 'mt-2 h-[88px] gap-2' : livePage ?", "embedded ? 'h-[78px] gap-2' : livePage ?")
    text = text.replace("embedded ? 'h-[88px] gap-2' : livePage ?", "embedded ? 'h-[78px] gap-2' : livePage ?")
    text = text.replace("embedded ? 'mt-2 h-[104px] gap-2' : livePage ?", "embedded ? 'h-[78px] gap-2' : livePage ?")
    text = text.replace("embedded ? 'h-[104px] gap-2' : livePage ?", "embedded ? 'h-[78px] gap-2' : livePage ?")

    # Smaller viewport for the HypeRate iframe in the OBS compact version.
    text = re.sub(r"const\s+viewportHeight\s*=\s*embedded\s*\?\s*\d+\s*:", "const viewportHeight = embedded ? 52 :", text)
    text = re.sub(r"const\s+frameHeight\s*=\s*embedded\s*\?\s*\d+\s*:", "const frameHeight = embedded ? 94 :", text)
    text = re.sub(r"const\s+frameScale\s*=\s*embedded\s*\?\s*[0-9.]+\s*:", "const frameScale = embedded ? 0.68 :", text)

    # This is the actual centering fix: move the HypeRate content lower inside its crop.
    text = re.sub(r"const\s+frameTranslateY\s*=\s*embedded\s*\?\s*-?\d+\s*:", "const frameTranslateY = embedded ? -6 :", text)

    # Placeholder should match the shorter embedded viewport.
    text = text.replace("embedded ? 'h-[60px] px-2 text-[9px]' : 'h-[96px] px-4 text-xs'", "embedded ? 'h-[52px] px-2 text-[9px]' : 'h-[96px] px-4 text-xs'")
    text = text.replace("embedded ? 'h-[76px] px-2 text-[9px]' : 'h-[104px] px-4 text-xs'", "embedded ? 'h-[52px] px-2 text-[9px]' : 'h-[96px] px-4 text-xs'")

    write(strip_path, text)
else:
    print(f"skipped missing {strip_path}")

obs_path = "src/app/obs/page.tsx"
if Path(obs_path).exists():
    text = read(obs_path)

    # Keep 3 games per page for the 360x640 layout.
    text = re.sub(r"const\s+GAMES_PER_PAGE\s*=\s*\d+\s*;", "const GAMES_PER_PAGE = 3;", text)

    # If the overlay has a dedicated pulse wrapper with fixed height, reduce common heights a bit.
    # These replacements are harmless if the exact classes do not exist.
    text = text.replace("h-[104px]", "h-[92px]")
    text = text.replace("h-[100px]", "h-[90px]")
    text = text.replace("h-[96px]", "h-[88px]")

    write(obs_path, text)
else:
    print(f"skipped missing {obs_path}")

print()
print("Done. Now run:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
