"""Subset the Material Symbols icon font to the icons the app uses.

The full variable font is ~3.9MB (every icon, every axis). Each page only needs
a few dozen icons at one fixed style (globals.css pins FILL 0 / wght 400 /
GRAD 0 / opsz 24), so this script:

  1. reads every ligature name from the source font,
  2. keeps the names that appear as a quoted string literal anywhere in src/
     (this also catches dynamic names such as `icon: "home"` in data tables),
  3. subsets the font to those ligatures and pins the variable axes,
  4. writes public/fonts/material-symbols-<hash>.woff2 and points the
     @font-face in src/app/globals.css at it. The hashed name lets /fonts/*
     be cached as immutable.

Run after adding a new icon:  pnpm fonts:icons
"""

import hashlib
import io
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts/data/material-symbols-full.woff2"
OUT_DIR = ROOT / "public/fonts"
CSS = ROOT / "src/app/globals.css"
AXES = {"FILL": 0, "wght": 400, "GRAD": 0, "opsz": 24}
# Big generated data files hold no icon names; skip them for speed.
SKIP = {"catalog-data.json"}


def ligature_names(font: TTFont) -> set[str]:
    """Every icon name the font's ligature lookups can form."""
    rev = {glyph: chr(cp) for cp, glyph in font.getBestCmap().items()}
    names: set[str] = set()
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if st.LookupType == 7:  # extension wrapper
                st = st.ExtSubTable
            if getattr(st, "LookupType", None) != 4:
                continue
            for first, ligs in st.ligatures.items():
                for lig in ligs:
                    parts = [first, *lig.Component]
                    if all(p in rev for p in parts):
                        names.add("".join(rev[p] for p in parts))
    return names


def used_names(available: set[str]) -> list[str]:
    literal = re.compile(r"""["'`]([a-z][a-z0-9_]*)["'`]""")
    found: set[str] = set()
    for path in (ROOT / "src").rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".css", ".json"} or path.name in SKIP:
            continue
        found.update(m for m in literal.findall(path.read_text(encoding="utf-8")) if m in available)
    return sorted(found)


def main() -> None:
    # recalcTimestamp=False keeps head.modified fixed, so the same icons always
    # produce the same file (and hashed name).
    font = TTFont(SOURCE, recalcTimestamp=False)
    names = used_names(ligature_names(font))
    if not names:
        sys.exit("no icon names found in src/")

    # Keep only the chosen ligatures. layout_closure=False stops the subsetter
    # from pulling back every other icon whose letters are still present.
    opts = subset.Options()
    # Material Symbols forms icons with required ligatures (`rlig`), and swaps
    # FILL variants through `rclt` feature variations; `liga` alone drops them.
    opts.layout_features = ["rlig", "rclt", "liga"]
    opts.layout_closure = False
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    cmap = font.getBestCmap()
    icon_glyphs: set[str] = set()
    for name in names:
        icon_glyphs.update(lig_glyph_for(font, name, cmap))
    sub = subset.Subsetter(options=opts)
    sub.populate(glyphs=sorted(icon_glyphs), text="".join(names) + " ")
    sub.subset(font)

    font = instancer.instantiateVariableFont(font, AXES)
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()

    digest = hashlib.sha256(data).hexdigest()[:10]
    out = OUT_DIR / f"material-symbols-{digest}.woff2"
    for old in OUT_DIR.glob("material-symbols*.woff2"):
        if old != out:
            old.unlink()
    out.write_bytes(data)

    css = CSS.read_text(encoding="utf-8")
    css, n = re.subn(r'url\("/fonts/material-symbols[^"]*\.woff2"\)', f'url("/fonts/{out.name}")', css)
    if n != 1:
        sys.exit("expected exactly one material-symbols @font-face url in globals.css")
    CSS.write_text(css, encoding="utf-8")

    print(f"{len(names)} icons -> {out.relative_to(ROOT)} ({len(data) / 1024:.1f} KB)")
    print(" ".join(names))


def lig_glyph_for(font: TTFont, name: str, cmap: dict[int, str]) -> set[str]:
    """The ligature glyph(s) that spell `name`."""
    chars = [cmap.get(ord(c)) for c in name]
    if None in chars:
        return set()
    out: set[str] = set()
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if st.LookupType == 7:
                st = st.ExtSubTable
            if getattr(st, "LookupType", None) != 4:
                continue
            for lig in st.ligatures.get(chars[0], []):
                if lig.Component == chars[1:]:
                    out.add(lig.LigGlyph)
    return out


if __name__ == "__main__":
    main()
