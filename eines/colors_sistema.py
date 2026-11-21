# -*- coding: utf-8 -*-
"""Genera el theme_values.xml que tenyeix una app MIUI (Configuració, Seguretat...) amb la paleta Xoriguer.

Llegeix els colors de l'APK (aapt2 dump resources) i substitueix:
  - fons negres del mode fosc      -> pissarra #1E2A3B
  - targetes / diàlegs gris fosc   -> #27354A
  - blau MIUI (#0D84FF)            -> taronja #FFA82E
Ús:  python eines/colors_sistema.py <paquet> [<paquet>...]   (el telèfon ha d'estar connectat)
Sortida: cache/sistema/<paquet>/theme_values.xml
"""
import os
import re
import subprocess
import sys

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADB = r"C:\Users\Xorigu3r\android-tools\sdk\platform-tools\adb.exe"
AAPT2 = r"C:\Users\Xorigu3r\android-tools\sdk\build-tools\37.0.0\aapt2.exe"
CACHE = os.path.join(ARREL, "cache", "sistema")

FONS = "#ff1e2a3b"
TARGETA = "#ff27354a"
TARONJA = "#ffffa82e"

NEGRES = {"#ff000000", "#ff0c0c0c", "#ff0d0d0d", "#ff121212", "#ff141414", "#ff171717"}
GRISOS = {"#ff1a1a1a", "#ff1f1f1f", "#ff202020", "#ff222222", "#ff242424", "#ff262626", "#ff2b2b2b", "#ff2e2e2e"}
BLAUS = {"#ff0d84ff", "#ff3482ff", "#ff277af7", "#ff1f8bff"}

# noms que indiquen que el color és un fons (no un text)
ES_FONS = re.compile(r"(_bg|background|primary_color|window|surface|card|panel|dialog|floating|popup|list_item|"
                     r"action_bar|navigation|status_bar|split|immersion|sheet)", re.I)
ES_TEXT = re.compile(r"(text|title|summary|hint|icon|stroke|divider|line|shadow|mask|indicator|ripple|"
                     r"pressed|disable|on_|black$|white$)", re.I)


def baixa_apk(paquet):
    os.makedirs(CACHE, exist_ok=True)
    desti = os.path.join(CACHE, paquet + ".apk")
    if not os.path.exists(desti):
        cami = subprocess.check_output([ADB, "shell", "pm", "path", paquet], text=True).split("\n")[0]
        subprocess.check_call([ADB, "pull", cami.replace("package:", "").strip(), desti],
                              stdout=subprocess.DEVNULL)
    return desti


def colors_apk(apk):
    """{nom: [valors]} de tots els recursos color/ de l'APK."""
    out = subprocess.run([AAPT2, "dump", "resources", apk], capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stdout
    colors, actual = {}, None
    for linia in out.splitlines():
        m = re.match(r"\s*resource 0x\w+ (\w+)/(\S+)", linia)
        if m:
            actual = m.group(2) if m.group(1) == "color" else None
            if actual:
                colors[actual] = []
            continue
        if actual:
            v = re.search(r"\(([^)]*)\)\s+(#[0-9a-fA-F]{8}|@color/\S+)", linia)
            if v:
                colors[actual].append((v.group(1), v.group(2).lower()))
    return colors


def tria(nom, valors):
    """Retorna el color nou, o None si no cal tocar-lo."""
    vals = {v for _, v in valors}
    if vals & BLAUS:
        return TARONJA
    fosc = nom.endswith("_dark") or any(cfg.startswith("night") for cfg, _ in valors)
    if not fosc or ES_TEXT.search(nom) or not ES_FONS.search(nom):
        return None
    nocturns = {v for cfg, v in valors if nom.endswith("_dark") or cfg.startswith("night")}
    if nocturns & NEGRES or "@color/miuix_appcompat_black" in nocturns:
        return FONS
    if nocturns & GRISOS:
        return TARGETA
    return None


def resol(valor, colors, prof=0):
    """#aarrggbb d'un valor (resolent @color/...), preferint el de nit."""
    if valor.startswith("#"):
        return valor.lower()
    if prof > 5 or not valor.startswith("@color/"):
        return None
    vals = colors.get(valor[7:], [])
    nit = [v for cfg, v in vals if cfg.startswith("night")]
    for v in nit + [v for _, v in vals]:
        r = resol(v, colors, prof + 1)
        if r:
            return r
    return None


def drawables_foscos(apk, colors):
    """Fons foscos d'un sol color (shape amb solid, sense cantonades ni vora) -> {nom: color nou}.
    En mode fosc MIUI agafa aquests fitxers, no els colors amb nom."""
    out = subprocess.run([AAPT2, "dump", "resources", apk], capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stdout
    candidats = re.findall(r"drawable/(\S+_dark)\s*\n\s*\(\)\s*\(file\)\s*(res/\S+\.xml)", out)
    res = {}
    for nom, fitxer in candidats:
        if not re.search(r"(window|background|_bg)", nom) or re.search(r"(btn|button|icon|ic_|shadow|stroke)", nom):
            continue
        xml = subprocess.run([AAPT2, "dump", "xmltree", "--file", fitxer, apk], capture_output=True,
                             text=True, encoding="utf-8", errors="replace").stdout
        elements = re.findall(r"E: (\w[\w.-]*)", xml)
        if not elements or elements[0] not in ("shape", "color") or \
                any(e in elements for e in ("corners", "stroke", "gradient", "item", "padding")):
            continue
        m = re.search(r"android:color\(0x010101a5\)=(#[0-9a-fA-F]{8}|@0x[0-9a-f]+|@color/\S+)", xml)
        if not m:
            continue
        v = m.group(1)
        c = {"@0x0106000c": "#ff000000"}.get(v) if v.startswith("@0x") else resol(v, colors)
        if c in NEGRES:
            res[nom] = FONS
        elif c in GRISOS:
            res[nom] = TARGETA
    return res


def png_ple(color_argb):
    from PIL import Image
    import io
    rgb = tuple(int(color_argb[i:i + 2], 16) for i in (3, 5, 7))
    b = io.BytesIO()
    Image.new("RGB", (16, 16), rgb).save(b, "PNG")
    return b.getvalue()


def fes(paquet):
    apk = baixa_apk(paquet)
    colors = colors_apk(apk)
    canvis = {n: c for n, v in colors.items() if (c := tria(n, v))}
    d = os.path.join(CACHE, paquet)
    os.makedirs(d, exist_ok=True)
    fons = drawables_foscos(apk, colors)
    dd = os.path.join(d, "res", "drawable-xxhdpi")
    os.makedirs(dd, exist_ok=True)
    for f in os.listdir(dd):
        os.remove(os.path.join(dd, f))
    for nom, c in fons.items():
        with open(os.path.join(dd, nom + ".png"), "wb") as f:
            f.write(png_ple(c))
    print(f"{paquet}: {len(fons)} fons foscos -> {', '.join(sorted(fons)) or '(cap)'}")
    xml = ['<?xml version="1.0" encoding="utf-8"?>', "<MIUI_Theme_Values>"]
    xml += [f'    <color name="{n}">{c}</color>' for n, c in sorted(canvis.items())]
    xml.append("</MIUI_Theme_Values>\n")
    with open(os.path.join(d, "theme_values.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(xml))
    n_fons = sum(1 for c in canvis.values() if c == FONS)
    n_targ = sum(1 for c in canvis.values() if c == TARGETA)
    n_tar = sum(1 for c in canvis.values() if c == TARONJA)
    print(f"{paquet}: {len(canvis)} colors (fons {n_fons}, targetes {n_targ}, accent {n_tar})")


if __name__ == "__main__":
    for p in sys.argv[1:] or ["com.android.settings"]:
        fes(p)
