# -*- coding: utf-8 -*-
"""Genera els temes MIUI Xoriguer (.mtz) en tres versions: Pissarra, Taronja i Crema.

Requisit previ:  node eines/glifs.mjs   (rasteritza els glifs a cache/glifs/)
Ús:              python eines/fes_temes.py
Sortida:         temes/Xoriguer-<Versio>.mtz  i  temes/previes/*.png
"""
import io
import json
import os
import zipfile
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageChops

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGOS = r"D:/Projectes Xoriguer/LOGOS-XORIGUER"
MOTIUS = os.path.join(LOGOS, "_eines", "motius")
SIMBOL = os.path.join(LOGOS, "Xoriguer", "2_simbol_icona", "xoriguer_simbol_transparent.png")
SORTIDA = os.path.join(ARREL, "temes")

S = 192            # mida de la icona (drawable-xxhdpi)
K = 4              # supermostreig
W, H = 1080, 2400  # pantalla del Mi 10T Lite

# Paleta Xoriguer «Blau pissarra»
FONS = (0x1E, 0x2A, 0x3B)
FONS_A, FONS_B = (0x24, 0x34, 0x4A), (0x1A, 0x25, 0x33)
TARGETA = (0x27, 0x35, 0x4A)
FONS3 = (0x31, 0x40, 0x5A)
LINIA = (0x41, 0x50, 0x6A)
CREMA = (0xF6, 0xEF, 0xE2)
TAR_A, TAR_B = (0xFF, 0xA8, 0x2E), (0xF2, 0x65, 0x0F)

with open(os.path.join(ARREL, "eines", "apps.json"), encoding="utf-8-sig") as f:
    APPS = {k: v for k, v in json.load(f).items() if not k.startswith("_")}
with open(os.path.join(ARREL, "eines", "colors.json"), encoding="utf-8-sig") as f:
    COLORS = json.load(f)


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def barreja(c1, c2, t):
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))


def aclareix(c, t):
    return barreja(c, (255, 255, 255), t)


def enfosqueix(c, t):
    return barreja(c, (0, 0, 0), t)


def lluminositat(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def color_app(paquet):
    """(c1, c2) del degradat de fons de l'app als models de color."""
    v = COLORS.get(paquet)
    if v is None and paquet.startswith("cat.xoriguer."):
        v = COLORS.get("cat.xoriguer.*")
    if v is None:
        v = COLORS["_defecte"]
    if v == "xoriguer":
        return TAR_A, TAR_B
    c = hex2rgb(v)
    return aclareix(c, 0.10), enfosqueix(c, 0.12)


# ---------------------------------------------------------------- utilitats
def degradat(mida, c1, c2, diagonal=False):
    w, h = mida
    g = Image.new("RGB", (256, 1))
    for x in range(256):
        t = x / 255
        g.putpixel((x, 0), tuple(round(a + (b - a) * t) for a, b in zip(c1, c2)))
    if diagonal:
        n = int((w * w + h * h) ** 0.5) + 2
        g = g.resize((n, n)).rotate(-45, resample=Image.BICUBIC)
        return g.crop(((n - w) // 2, (n - h) // 2, (n - w) // 2 + w, (n - h) // 2 + h))
    return g.rotate(-90, expand=True).resize((w, h))


def color_ple(mida, color):
    return Image.new("RGB", mida, color)


def forma(mida, tipus, inset):
    """Màscara L de la forma: 'squircle' o 'cercle'."""
    m = Image.new("L", (mida, mida), 0)
    d = ImageDraw.Draw(m)
    a, b = inset, mida - inset - 1
    if tipus == "cercle":
        d.ellipse((a, b - (b - a), b, b), fill=255)
    else:
        d.rounded_rectangle((a, a, b, b), radius=int((b - a) * 0.30), fill=255)
    return m


def encaixa(img, caixa):
    """Escala una imatge RGBA perquè hi càpiga dins d'un quadrat de costat `caixa`."""
    bb = img.getbbox()
    if bb:
        img = img.crop(bb)
    r = caixa / max(img.size)
    return img.resize((max(1, round(img.width * r)), max(1, round(img.height * r))), Image.LANCZOS)


def enganxa_centre(base, capa, dy=0):
    x = (base.width - capa.width) // 2
    y = (base.height - capa.height) // 2 + dy
    base.alpha_composite(capa, (x, y))


def pinta(mascara_rgba, emplenat):
    """Pinta la màscara (alfa) amb una imatge RGB o un color."""
    alfa = mascara_rgba.getchannel("A")
    if isinstance(emplenat, tuple):
        emplenat = color_ple(alfa.size, emplenat)
    out = emplenat.resize(alfa.size).convert("RGBA")
    out.putalpha(alfa)
    return out


def recolora_motiu(img, c_color, c_neutre):
    """Els motius Xoriguer són sobretot taronja + crema (alguns porten altres colors o negre).
    Tot el que té color -> c_color; crema, blanc, gris i negre -> c_neutre.
    Cada c_* és un color (r,g,b) o 'grad' (degradat taronja)."""
    img = img.convert("RGBA")
    hsv = img.convert("RGB").convert("HSV")
    sat, val = hsv.getchannel("S"), hsv.getchannel("V")
    te_color = ImageChops.multiply(sat.point(lambda s: 255 if s >= 80 else 0),
                                   val.point(lambda v: 255 if v >= 90 else 0))
    neutre = ImageChops.invert(te_color)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    for mask, color in ((te_color, c_color), (neutre, c_neutre)):
        if color == "grad":
            capa = degradat(img.size, TAR_A, TAR_B, diagonal=True).convert("RGBA")
        else:
            capa = Image.new("RGBA", img.size, color + (255,))
        a = ImageChops.multiply(img.getchannel("A"), mask)
        capa.putalpha(a)
        out.alpha_composite(capa)
    return out


def ombra(capa, radi, opacitat, dy):
    a = capa.getchannel("A").filter(ImageFilter.GaussianBlur(radi)).point(lambda v: int(v * opacitat))
    o = Image.new("RGBA", capa.size, (10, 16, 26, 0))
    o.putalpha(a)
    base = Image.new("RGBA", capa.size, (0, 0, 0, 0))
    base.alpha_composite(o, (0, dy))
    return base


# ---------------------------------------------------------------- estils
ESTILS = {
    "Pissarra": dict(
        titol="Xoriguer Pissarra",
        desc="Blau pissarra amb glifs taronja. Fons amb el xoriguer.",
        forma="squircle", gruix="prim",
    ),
    "Taronja": dict(
        titol="Xoriguer Taronja",
        desc="Icones taronja amb glifs crema. Fons de posta de sol.",
        forma="squircle", gruix="gruixut",
    ),
    "Crema": dict(
        titol="Xoriguer Crema",
        desc="Icones rodones crema amb glifs pissarra i taronja.",
        forma="cercle", gruix="prim",
    ),
    # --- models de color: cada app amb el color de la seva marca
    "Color": dict(
        titol="Xoriguer Color",
        desc="Cada app amb el seu color de marca, icones planes.",
        forma="squircle", gruix="gruixut", fons="Falco", color=True,
    ),
    "Color3D": dict(
        titol="Xoriguer Color 3D",
        desc="Cada app amb el seu color, amb relleu, brillantor i ombra.",
        forma="squircle", gruix="gruixut", fons="LogotipOrTaronja", color=True,
    ),
    "PissarraColor": dict(
        titol="Xoriguer Pissarra Color",
        desc="Fons pissarra amb el dibuix i la vora del color de cada app.",
        forma="squircle", gruix="prim", fons="LogotipOr", color=True,
    ),
}
for _e in ESTILS.values():
    _e.setdefault("color", False)
for _n, _e in ESTILS.items():
    _e.setdefault("fons", _n)


def desplaca(mascara, dx, dy):
    out = Image.new("L", mascara.size, 0)
    out.paste(mascara, (dx, dy))
    return out


def capa_color(mascara_l, color, opacitat=1.0):
    c = Image.new("RGBA", mascara_l.size, color + (0,))
    c.putalpha(mascara_l.point(lambda v: int(v * opacitat)))
    return c


def glif_blanc(estil, paquet, caixa_rel):
    """Glif o motiu, a punt per pintar, encaixat a `caixa_rel` de la icona."""
    n = S * K
    g = APPS.get(paquet)
    if g is None:
        return None
    if g.startswith("m:"):
        img = Image.open(os.path.join(MOTIUS, g[2:] + ".png")).convert("RGBA")
        return "motiu", encaixa(img, int(n * caixa_rel))
    mask = Image.open(os.path.join(ARREL, "cache", "glifs", ESTILS[estil]["gruix"], paquet + ".png")).convert("RGBA")
    marca = g.startswith("s:")
    return "glif", encaixa(mask, int(n * caixa_rel * (0.92 if marca else 1)))


def fes_icona_color(estil, paquet):
    n = S * K
    c1, c2 = color_app(paquet)
    base = barreja(c1, c2, 0.5)
    lienzo = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    g = glif_blanc(estil, paquet, 0.54)

    if estil == "PissarraColor":
        m = forma(n, "squircle", int(n * 0.04))
        cos = degradat((n, n), FONS3, FONS).convert("RGBA")
        cos.putalpha(m)
        lienzo.alpha_composite(ombra(cos, K * 3, 0.35, K * 2))
        lienzo.alpha_composite(cos)
        # resplendor del color al centre i vora de color
        lienzo.alpha_composite(capa_color(ImageChops.multiply(
            forma(n, "cercle", int(n * 0.22)).filter(ImageFilter.GaussianBlur(n * 0.10)), m), base, 0.30))
        vora = ImageChops.subtract(m, forma(n, "squircle", int(n * 0.04) + K * 3))
        lienzo.alpha_composite(capa_color(vora, aclareix(base, 0.15), 0.9))
        clar = base if lluminositat(base) > 110 else aclareix(base, 0.35)
        if g:
            tipus, img = g
            if tipus == "motiu":
                img = recolora_motiu(img, clar, CREMA)
            else:
                img = pinta(img, degradat(img.size, aclareix(clar, 0.15), clar, diagonal=True))
            capa = Image.new("RGBA", (n, n), (0, 0, 0, 0))
            enganxa_centre(capa, img)
            lienzo.alpha_composite(capa)
        return lienzo.resize((S, S), Image.LANCZOS)

    tres_d = estil == "Color3D"
    inset = int(n * (0.06 if tres_d else 0.04))
    m = forma(n, "squircle", inset)
    if tres_d:
        cos = degradat((n, n), aclareix(base, 0.12), enfosqueix(base, 0.18), diagonal=True).convert("RGBA")
    else:
        cos = degradat((n, n), c1, c2, diagonal=True).convert("RGBA")
    cos.putalpha(m)
    lienzo.alpha_composite(ombra(cos, K * (6 if tres_d else 3), 0.55 if tres_d else 0.35, K * (5 if tres_d else 2)))
    lienzo.alpha_composite(cos)

    if tres_d:
        # bisell: vora clara a dalt, fosca a baix
        llum = ImageChops.subtract(m, desplaca(m, 0, K * 4)).filter(ImageFilter.GaussianBlur(K))
        fosc = ImageChops.subtract(m, desplaca(m, 0, -K * 4)).filter(ImageFilter.GaussianBlur(K))
        lienzo.alpha_composite(capa_color(ImageChops.multiply(llum, m), (255, 255, 255), 0.55))
        lienzo.alpha_composite(capa_color(ImageChops.multiply(fosc, m), enfosqueix(base, 0.55), 0.6))
        # brillantor de vidre a la meitat de dalt
        grad = Image.linear_gradient("L").resize((n, n)).point(lambda v: int(max(0, 255 - v * 2.1) * 0.22))
        brill = ImageChops.multiply(grad, forma(n, "squircle", inset + K * 5))
        lienzo.alpha_composite(capa_color(brill, (255, 255, 255)))

    if g:
        tipus, img = g
        if tipus == "motiu":
            img = recolora_motiu(img, CREMA, FONS)
        else:
            cara = degradat(img.size, (255, 255, 255), (0xEE, 0xEA, 0xE2)) if tres_d else (255, 255, 255)
            img = pinta(img, cara)
        capa = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        enganxa_centre(capa, img)
        if tres_d:
            lienzo.alpha_composite(ombra(capa, K * 3, 0.55, K * 4))
        else:
            lienzo.alpha_composite(ombra(capa, K * 2, 0.18, K * 2))
        lienzo.alpha_composite(capa)
    return lienzo.resize((S, S), Image.LANCZOS)


def fons_icona(estil):
    n = S * K
    if estil == "Pissarra":
        m = forma(n, "squircle", int(n * 0.04))
        cos = degradat((n, n), FONS3, FONS).convert("RGBA")
        cos.putalpha(m)
        # vora fina + llum a dalt
        vora = ImageChops.subtract(m, forma(n, "squircle", int(n * 0.04) + K * 2))
        cos.alpha_composite(pinta(Image.merge("RGBA", [vora] * 4), LINIA))
        return cos, m
    if estil == "Taronja":
        m = forma(n, "squircle", int(n * 0.04))
        cos = degradat((n, n), TAR_A, TAR_B, diagonal=True).convert("RGBA")
        cos.putalpha(m)
        brill = forma(n, "squircle", int(n * 0.04)).crop((0, 0, n, n // 2)).point(lambda v: v * 0.12)
        b = Image.new("RGBA", (n, n), CREMA + (0,))
        b.paste(Image.new("RGBA", (n, n // 2), CREMA + (255,)), (0, 0), brill)
        cos.alpha_composite(b)
        return cos, m
    # Crema: cercle crema amb anell taronja
    m = forma(n, "cercle", int(n * 0.05))
    cos = degradat((n, n), CREMA, (0xEA, 0xDF, 0xCB)).convert("RGBA")
    cos.putalpha(m)
    anell = ImageChops.subtract(forma(n, "cercle", int(n * 0.11)), forma(n, "cercle", int(n * 0.11) + K * 3))
    cos.alpha_composite(pinta(Image.merge("RGBA", [anell] * 4), degradat((n, n), TAR_A, TAR_B, True)))
    return cos, m


def glif_capa(estil, paquet):
    n = S * K
    g = APPS.get(paquet)
    if g is None:
        return None
    if g.startswith("m:"):
        f = os.path.join(MOTIUS, g[2:] + ".png")
        img = Image.open(f).convert("RGBA")
        caixa = int(n * (0.56 if estil != "Crema" else 0.50))
        if estil == "Pissarra":
            img = recolora_motiu(img, "grad", CREMA)
        elif estil == "Taronja":
            img = recolora_motiu(img, CREMA, FONS)
        else:
            img = recolora_motiu(img, "grad", FONS)
        return encaixa(img, caixa)
    mask = Image.open(os.path.join(ARREL, "cache", "glifs", ESTILS[estil]["gruix"], paquet + ".png")).convert("RGBA")
    marca = g.startswith("s:")
    caixa = int(n * (0.58 if estil != "Crema" else 0.52) * (0.92 if marca else 1))
    mask = encaixa(mask, caixa)
    if estil == "Pissarra":
        return pinta(mask, degradat(mask.size, TAR_A, TAR_B, diagonal=True))
    if estil == "Taronja":
        return pinta(mask, CREMA)
    return pinta(mask, FONS)


def fes_icona(estil, paquet):
    if ESTILS[estil]["color"]:
        return fes_icona_color(estil, paquet)
    n = S * K
    cos, _ = fons_icona(estil)
    capa = glif_capa(estil, paquet)
    lienzo = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    lienzo.alpha_composite(ombra(cos, K * 3, 0.35, K * 2))
    lienzo.alpha_composite(cos)
    if capa is not None:
        g = Image.new("RGBA", (n, n), (0, 0, 0, 0))
        enganxa_centre(g, capa)
        if estil == "Taronja":
            lienzo.alpha_composite(ombra(g, K * 2, 0.35, K * 2))
        lienzo.alpha_composite(g)
    return lienzo.resize((S, S), Image.LANCZOS)


def icones_fallback(estil):
    """Per a apps sense icona al tema: MIUI posa fons + icona retallada + vora."""
    n = S * K
    cos, m = fons_icona(ESTILS[estil]["fons"] if ESTILS[estil]["color"] else estil)
    fons = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    fons.alpha_composite(cos)
    mascara = Image.new("RGBA", (n, n), (255, 255, 255, 0))
    mascara.putalpha(forma(n, ESTILS[estil]["forma"], int(n * 0.20)))
    vora = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    r = lambda im: im.resize((S, S), Image.LANCZOS)
    return {"icon_background.png": r(fons), "icon_mask.png": r(mascara),
            "icon_border.png": r(vora), "icon_pattern.png": r(vora)}


# ---------------------------------------------------------------- fons de pantalla
def simbol():
    return Image.open(SIMBOL).convert("RGBA")


def resplendor(mida, centre, radi, color, forca):
    w, h = mida
    m = Image.new("L", (w // 4, h // 4), 0)
    d = ImageDraw.Draw(m)
    cx, cy, r = centre[0] // 4, centre[1] // 4, radi // 4
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=int(255 * forca))
    m = m.filter(ImageFilter.GaussianBlur(r * 0.6)).resize(mida, Image.BICUBIC)
    c = Image.new("RGBA", mida, color + (0,))
    c.putalpha(m)
    return c


FALCO = os.path.join(LOGOS, "XoriguerAparcament", "falco.png")  # ala + cap, sense roda ni corredor
LOGOTIP = os.path.join(LOGOS, "Xoriguer", "1_logotip_complet", "xoriguer_logotip_transparent_per_fons_fosc.png")


OR = [(0.00, (0xA8, 0x72, 0x0E)), (0.18, (0xF0, 0xB8, 0x2A)), (0.34, (0xFF, 0xF2, 0xA8)),
      (0.48, (0xFF, 0xC8, 0x3C)), (0.62, (0xC8, 0x8E, 0x14)), (0.78, (0xFF, 0xD8, 0x5A)),
      (0.90, (0xFF, 0xF6, 0xC8)), (1.00, (0xD0, 0x96, 0x1E))]


def degradat_or(mida):
    """Degradat diagonal amb bandes clares i fosques, com metall polit."""
    lut = Image.new("RGB", (256, 1))
    for x in range(256):
        t = x / 255
        for (t0, c0), (t1, c1) in zip(OR, OR[1:]):
            if t0 <= t <= t1:
                lut.putpixel((x, 0), barreja(c0, c1, (t - t0) / (t1 - t0)))
                break
    w, h = mida
    n = int((w * w + h * h) ** 0.5) + 2
    g = lut.resize((n, n), Image.BICUBIC).rotate(-35, resample=Image.BICUBIC)
    return g.crop(((n - w) // 2, (n - h) // 2, (n - w) // 2 + w, (n - h) // 2 + h))


def daurat(img):
    """Converteix un logo (RGBA) en or: metall amb relleu, conservant les formes i el detall."""
    a = img.getchannel("A")
    lum = img.convert("L").point(lambda v: 185 + v * 70 // 255)           # el detall original, suau
    metall = ImageChops.multiply(degradat_or(img.size), Image.merge("RGB", [lum] * 3))
    # bisell: llum a dalt-esquerra, ombra a baix-dreta
    r = max(2, img.width // 260)
    suau = a.filter(ImageFilter.GaussianBlur(r))
    llum = ImageChops.subtract(suau, desplaca(suau, r, r))
    fosc = ImageChops.subtract(suau, desplaca(suau, -r, -r))
    out = metall.convert("RGBA")
    out.alpha_composite(capa_color(ImageChops.multiply(llum, a), (255, 250, 225), 0.85))
    out.alpha_composite(capa_color(ImageChops.multiply(fosc, a), (70, 45, 5), 0.7))
    out.putalpha(a)
    return out


def daurat_i_taronja(img):
    """Les parts amb color (ales taronja) es queden; les crema/blanques passen a or."""
    hsv = img.convert("RGB").convert("HSV")
    te_color = ImageChops.multiply(hsv.getchannel("S").point(lambda s: 255 if s >= 80 else 0),
                                   hsv.getchannel("V").point(lambda v: 255 if v >= 90 else 0))
    out = daurat(img)
    original = img.copy()
    original.putalpha(ImageChops.multiply(img.getchannel("A"), te_color))
    out.alpha_composite(original)
    return out


def fes_fons(estil, bloqueig=False):
    if estil in ("Falco", "Logotip", "FalcoOr", "LogotipOr", "LogotipOrTaronja"):
        or_ = "Or" in estil
        img = degradat((W, H), FONS_A, FONS_B).convert("RGBA")
        brill = (0xE8, 0xB8, 0x4A) if or_ else TAR_B
        img.alpha_composite(resplendor((W, H), (W // 2, int(H * 0.52)), 650, brill, 0.10 if or_ else 0.18))
        img.alpha_composite(resplendor((W, H), (int(W * 0.1), int(H * 0.08)), 600, (0x3A, 0x55, 0x7A), 0.35))
        logo = Image.open(FALCO if estil.startswith("Falco") else LOGOTIP).convert("RGBA")
        logo = encaixa(logo, int(W * (0.86 if estil.startswith("Falco") else 0.78)))
        if estil == "LogotipOrTaronja":
            logo = daurat_i_taronja(logo)
        elif or_:
            logo = daurat(logo)
        else:
            logo = ImageEnhance.Contrast(ImageEnhance.Color(logo).enhance(1.3)).enhance(1.08)
        lienzo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        enganxa_centre(lienzo, logo, dy=int(H * (0.08 if bloqueig else -0.06)))
        # aura de llum darrere el logo perquè ressalti
        aura = pinta(lienzo, (0xFF, 0xC8, 0x4A) if or_ else (0xFF, 0x8A, 0x00))
        aura = aura.filter(ImageFilter.GaussianBlur(W // 30))
        aura.putalpha(aura.getchannel("A").point(lambda v: int(v * 0.55)))
        img.alpha_composite(aura)
        img.alpha_composite(ombra(lienzo, 18, 0.55, 12))
        img.alpha_composite(lienzo)
        return img.convert("RGB")
    if estil == "Pissarra":
        img = degradat((W, H), FONS_A, FONS_B).convert("RGBA")
        img.alpha_composite(resplendor((W, H), (W * 0.95, H * 0.95), 700, TAR_B, 0.14))
        img.alpha_composite(resplendor((W, H), (W * 0.1, H * 0.15), 700, (0x3A, 0x55, 0x7A), 0.35))
        s = simbol()
        if bloqueig:
            s = encaixa(s, int(W * 0.78))
            enganxa_centre(img, s, dy=int(H * 0.17))
        else:
            s = encaixa(s, int(W * 1.25))
            s.putalpha(s.getchannel("A").point(lambda v: int(v * 0.16)))
            img.alpha_composite(s, (int(W * 0.05), int(H * 0.60)))
    elif estil == "Taronja":
        img = degradat((W, H), (0x22, 0x31, 0x46), (0x2C, 0x34, 0x48)).convert("RGBA")
        if bloqueig:  # posta de sol plena només a la pantalla de bloqueig
            img.alpha_composite(resplendor((W, H), (W // 2, int(H * 1.02)), 1500, TAR_B, 0.95))
            img.alpha_composite(resplendor((W, H), (W // 2, int(H * 0.95)), 900, TAR_A, 0.75))
        else:         # a l'inici, només una franja al capdamunt i a baix perquè les icones taronja destaquin
            img.alpha_composite(resplendor((W, H), (W // 2, int(H * 1.10)), 900, TAR_B, 0.45))
            img.alpha_composite(resplendor((W, H), (int(W * 0.1), int(-H * 0.05)), 600, TAR_A, 0.18))
        s = encaixa(simbol(), int(W * (0.80 if bloqueig else 0.95)))
        sil = pinta(s, CREMA)
        sil.putalpha(s.getchannel("A").point(lambda v: int(v * (0.92 if bloqueig else 0.22))))
        if bloqueig:
            enganxa_centre(img, sil, dy=int(H * 0.10))
        else:
            img.alpha_composite(sil, ((W - sil.width) // 2, int(H * 0.30)))
    else:  # Crema: pissarra fosc amb línies corbes crema/taronja
        img = degradat((W, H), FONS3, FONS_B).convert("RGBA")
        d = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
        dr = ImageDraw.Draw(d)
        for i in range(14):
            r = 700 + i * 150
            col = (CREMA if i % 4 else TAR_A) + (int(40 if i % 4 else 120),)
            dr.ellipse((W * 2 + 200 - r, H * 2 - 300 - r, W * 2 + 200 + r, H * 2 - 300 + r), outline=col, width=5)
        img.alpha_composite(d.resize((W, H), Image.LANCZOS))
        s = encaixa(simbol(), int(W * (0.70 if bloqueig else 0.55)))
        if bloqueig:
            enganxa_centre(img, s, dy=int(H * 0.15))
        else:
            sil = pinta(s, CREMA)
            sil.putalpha(s.getchannel("A").point(lambda v: int(v * 0.18)))
            img.alpha_composite(sil, (int(W * 0.08), int(H * 0.08)))
    return img.convert("RGB")


# ---------------------------------------------------------------- previsualitzacions
def previa(estil, fons, icones):
    img = fons.copy().convert("RGBA")
    mostra = ["com.whatsapp", "org.telegram.messenger", "com.google.android.gm", "com.google.android.youtube",
              "com.google.android.apps.maps", "com.strava", "com.shazam.android", "com.android.chrome",
              "com.google.android.dialer", "com.android.camera", "com.miui.gallery", "com.android.settings",
              "com.miui.calculator", "com.miui.notes", "com.wallapop", "com.zhiliaoapp.musically"]
    xori = [p for p in icones if p.startswith("cat.xoriguer.")]
    noms = [p for p in mostra if p in icones] + xori[:8]
    col, mida = 4, 192
    marge = (W - col * mida) // (col + 1)
    for i, p in enumerate(noms):
        x = marge + (i % col) * (mida + marge)
        y = 260 + (i // col) * (mida + 120)
        img.alpha_composite(icones[p], (x, y))
    return img.convert("RGB")


def jpg(img, q=90):
    b = io.BytesIO()
    img.save(b, "JPEG", quality=q, optimize=True)
    return b.getvalue()


def png(img):
    b = io.BytesIO()
    img.save(b, "PNG", optimize=True)
    return b.getvalue()


TRANSFORM = """<?xml version="1.0" encoding="UTF-8"?>
<IconTransform>
    <Config name="SupportLayerIcon" value="false" />
    <Config name="UseDynamicIcon" value="false" />
</IconTransform>
"""


def description(e):
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<theme>
    <title>{e['titol']}</title>
    <designer>Xoriguer</designer>
    <author>Xoriguer</author>
    <version>1.0</version>
    <uiVersion>14</uiVersion>
    <description>{e['desc']}</description>
</theme>
"""


def fes_tema(estil):
    e = ESTILS[estil]
    print(f"· {e['titol']}: icones…", flush=True)
    icones = {p: fes_icona(estil, p) for p in APPS}

    # icons (zip intern, sense extensió)
    bi = io.BytesIO()
    with zipfile.ZipFile(bi, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("transform_config.xml", TRANSFORM)
        for p, im in icones.items():
            z.writestr(f"res/drawable-xxhdpi/{p}.png", png(im))
        for nom, im in icones_fallback(estil).items():
            z.writestr(f"res/drawable-xxhdpi/{nom}", png(im))

    print(f"· {e['titol']}: fons…", flush=True)
    inici, bloq = fes_fons(e["fons"]), fes_fons(e["fons"], True)
    prev = previa(estil, inici, icones)

    os.makedirs(os.path.join(SORTIDA, "previes"), exist_ok=True)
    prev.save(os.path.join(SORTIDA, "previes", f"{estil}_inici.png"))
    bloq.resize((W // 2, H // 2)).save(os.path.join(SORTIDA, "previes", f"{estil}_bloqueig.png"))

    desti = os.path.join(SORTIDA, f"Xoriguer-{estil}.mtz")
    with zipfile.ZipFile(desti, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("description.xml", description(e))
        z.writestr("icons", bi.getvalue())
        # apps del sistema tenyides (cache/sistema/<paquet>/theme_values.xml, fet per colors_sistema.py)
        sis = os.path.join(ARREL, "cache", "sistema")
        for paquet in (sorted(os.listdir(sis)) if os.path.isdir(sis) else []):
            arrel_p = os.path.join(sis, paquet)
            if not os.path.isdir(arrel_p):
                continue
            bc = io.BytesIO()
            with zipfile.ZipFile(bc, "w", zipfile.ZIP_DEFLATED) as zc:
                # theme_values.xml (colors) i res/drawable-xxhdpi/*.png (fons del mode fosc)
                for dirpath, _, fitxers in os.walk(arrel_p):
                    for nom in fitxers:
                        ple = os.path.join(dirpath, nom)
                        rel = os.path.relpath(ple, arrel_p).replace(os.sep, "/")
                        zc.write(ple, rel)
                        # en mode fosc MIUI només mira nightmode/ si existeix: hi va tot duplicat
                        zc.write(ple, "nightmode/" + rel)
            z.writestr(paquet, bc.getvalue())
        z.writestr("wallpaper/default_wallpaper.jpg", jpg(inici))
        z.writestr("wallpaper/default_lock_wallpaper.jpg", jpg(bloq))
        z.writestr("preview/preview_icons_0.jpg", jpg(prev.resize((W // 2, H // 2)), 85))
        z.writestr("preview/preview_launcher_0.jpg", jpg(prev.resize((W // 2, H // 2)), 85))
        z.writestr("preview/preview_lockscreen_0.jpg", jpg(bloq.resize((W // 2, H // 2)), 85))
    print(f"  -> {desti} ({os.path.getsize(desti) // 1024} KB)")


if __name__ == "__main__":
    import sys
    for nom in (sys.argv[1:] or ESTILS):
        fes_tema(nom)
