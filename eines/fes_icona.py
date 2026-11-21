# -*- coding: utf-8 -*-
"""Icona de Xoriguer Temes: fons «Blau nit» (#2C5282 -> #0A1628, com totes les icones Xoriguer)
amb quatre rajoles d'icona (taronja, crema, or, pissarra) = un tema.

Ús: python eines/fes_icona.py
Sortida: assets/ (per a capacitor-assets), www/img/icona.png, escriptori/icona.png i icona.ico
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ARREL, "eines"))
from fes_temes import degradat, barreja, ombra, forma  # noqa: E402

N = 1024


def rajoles(n, escala):
    """Quatre rajoles arrodonides centrades, ocupant `escala` de la icona."""
    capa = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    costat = int(n * escala)
    gap = int(costat * 0.10)
    r = (costat - gap) // 2
    x0 = (n - costat) // 2
    colors = [((0xFF, 0xA8, 0x2E), (0xF2, 0x65, 0x0F)), ((0xF6, 0xEF, 0xE2), (0xE4, 0xD8, 0xC2)),
              ((0xF2, 0xD0, 0x72), (0xB8, 0x86, 0x2B)), ((0x41, 0x50, 0x6A), (0x27, 0x35, 0x4A))]
    for i, (c1, c2) in enumerate(colors):
        x = x0 + (i % 2) * (r + gap)
        y = x0 + (i // 2) * (r + gap)
        m = Image.new("L", (r, r), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, r - 1, r - 1), radius=int(r * 0.28), fill=255)
        t = degradat((r, r), c1, c2, diagonal=True).convert("RGBA")
        t.putalpha(m)
        capa.alpha_composite(t, (x, y))
    # punt taronja a la rajola pissarra (una «icona» dins del tema)
    d = ImageDraw.Draw(capa)
    cx, cy, rr = x0 + r + gap + r // 2, x0 + r + gap + r // 2, r // 5
    d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=(0xFF, 0xA8, 0x2E, 255))
    out = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    out.alpha_composite(ombra(capa, n // 60, 0.45, n // 90))
    out.alpha_composite(capa)
    return out


def main():
    fons = degradat((N, N), (0x2C, 0x52, 0x82), (0x0A, 0x16, 0x28), diagonal=True).convert("RGBA")
    os.makedirs(os.path.join(ARREL, "assets"), exist_ok=True)
    fons.save(os.path.join(ARREL, "assets", "icon-background.png"))
    rajoles(N, 0.46).save(os.path.join(ARREL, "assets", "icon-foreground.png"))   # zona segura adaptativa
    plena = fons.copy()
    plena.alpha_composite(rajoles(N, 0.62))
    plena.convert("RGB").save(os.path.join(ARREL, "assets", "icon-only.png"))
    # arrodonida (web i escriptori)
    m = Image.new("L", (N, N), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, N - 1, N - 1), radius=int(N * 0.22), fill=255)
    arr = plena.copy()
    arr.putalpha(m)
    os.makedirs(os.path.join(ARREL, "www", "img"), exist_ok=True)
    arr.resize((512, 512), Image.LANCZOS).save(os.path.join(ARREL, "www", "img", "icona.png"))
    os.makedirs(os.path.join(ARREL, "escriptori"), exist_ok=True)
    arr.resize((512, 512), Image.LANCZOS).save(os.path.join(ARREL, "escriptori", "icona.png"))
    arr.save(os.path.join(ARREL, "escriptori", "icona.ico"), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("icones fetes")


if __name__ == "__main__":
    main()
