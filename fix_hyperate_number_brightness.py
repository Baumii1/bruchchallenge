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

path = "src/components/obs/HyperatePulseStrip.tsx"
text = read(path)

# The previous dark-mode workaround inverted the whole iframe.
# That made HypeRate's light BPM text dark. Remove it completely.
text = re.sub(
    r"\s*// HypeRate animation pages can render their own white canvas\.\n\s*// This darkens that canvas while keeping the red heart roughly red\.\n\s*filter:\s*'[^']*',\n",
    "\n",
    text,
)

text = re.sub(
    r"\s*filter:\s*'invert\([^']*',\n",
    "\n",
    text,
)

# Make the iframe as transparent-friendly as possible from our side.
text = text.replace(
    "background: 'transparent',\n              colorScheme: 'dark',",
    "background: 'transparent',\n              backgroundColor: 'transparent',\n              colorScheme: 'normal',"
)

if "backgroundColor: 'transparent'" not in text:
    text = text.replace(
        "background: 'transparent',",
        "background: 'transparent',\n              backgroundColor: 'transparent',",
        1,
    )

write(path, text)

print()
print("Done. Now run:")
print("  Remove-Item -Recurse -Force .next")
print("  npm run typecheck")
print("  npm run build")
