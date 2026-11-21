# -*- coding: utf-8 -*-
"""Exporta les dades del generador cap a la web (www/): catàleg d'apps (glif + color + nom),
motius i logos Xoriguer, i els colors de sistema de MIUI.

Ús: python eines/exporta_web.py
Sortida: www/dades/cataleg.js, www/dades/sistema.js, www/img/motius/*.png, www/img/logos/*.png
"""
import json
import os
import re
import shutil
import unicodedata

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGOS = r"D:/Projectes Xoriguer/LOGOS-XORIGUER"
WWW = os.path.join(ARREL, "www")
TABLER = os.path.join(ARREL, "node_modules", "@tabler", "icons", "icons", "outline")
SIMPLE = os.path.join(ARREL, "node_modules", "simple-icons", "icons")

# Apps populars que no són al telèfon de l'usuari (perquè el programa serveixi a altres mòbils).
# paquet: (glif, color, nom)
EXTRES = {
    "com.instagram.android": ("s:instagram", "#E4405F", "Instagram"),
    "com.facebook.katana": ("s:facebook", "#0866FF", "Facebook"),
    "com.facebook.orca": ("s:messenger", "#00B2FF", "Messenger"),
    "com.spotify.music": ("s:spotify", "#1DB954", "Spotify"),
    "com.netflix.mediaclient": ("s:netflix", "#E50914", "Netflix"),
    "com.twitter.android": ("s:x", "#2F3B4F", "X"),
    "com.amazon.mShop.android.shopping": ("t:shopping-cart", "#FF9900", "Amazon"),
    "com.microsoft.office.outlook": ("t:mail", "#0078D4", "Outlook"),
    "com.microsoft.teams": ("t:users-group", "#6264A7", "Teams"),
    "us.zoom.videomeetings": ("s:zoom", "#0B5CFF", "Zoom"),
    "com.ubercab": ("s:uber", "#2F3B4F", "Uber"),
    "ee.mtakso.client": ("t:bolt", "#34D186", "Bolt"),
    "com.waze": ("s:waze", "#33CCFF", "Waze"),
    "org.thoughtcrime.securesms": ("s:signal", "#3A76F0", "Signal"),
    "com.discord": ("s:discord", "#5865F2", "Discord"),
    "com.reddit.frontpage": ("s:reddit", "#FF4500", "Reddit"),
    "com.pinterest": ("s:pinterest", "#BD081C", "Pinterest"),
    "com.snapchat.android": ("s:snapchat", "#F7C600", "Snapchat"),
    "com.linkedin.android": ("t:brand-linkedin", "#0A66C2", "LinkedIn"),
    "tv.twitch.android.app": ("s:twitch", "#9146FF", "Twitch"),
    "com.paypal.android.p2pmobile": ("s:paypal", "#003087", "PayPal"),
    "com.revolut.revolut": ("s:revolut", "#0075EB", "Revolut"),
    "com.booking": ("s:bookingdotcom", "#003580", "Booking"),
    "com.airbnb.android": ("s:airbnb", "#FF5A5F", "Airbnb"),
    "com.duolingo": ("s:duolingo", "#58CC02", "Duolingo"),
    "com.google.android.apps.translate": ("s:googletranslate", "#4285F4", "Traductor"),
    "com.google.android.keep": ("s:googlekeep", "#F9AB00", "Keep"),
    "com.google.android.apps.docs.editors.docs": ("s:googledocs", "#4285F4", "Docs"),
    "com.google.android.apps.docs.editors.sheets": ("s:googlesheets", "#34A853", "Sheets"),
    "com.google.android.apps.docs.editors.slides": ("s:googleslides", "#F9AB00", "Slides"),
    "com.google.android.apps.fitness": ("t:activity", "#4285F4", "Fit"),
    "com.google.android.apps.chromecast.app": ("s:googlehome", "#4285F4", "Home"),
    "com.google.ar.lens": ("s:googlelens", "#4285F4", "Lens"),
    "com.google.android.apps.nbu.files": ("t:folder", "#1A73E8", "Files"),
    "com.google.android.deskclock": ("t:clock", "#3949AB", "Rellotge"),
    "com.google.android.calculator": ("t:calculator", "#FF7043", "Calculadora"),
    "com.google.android.GoogleCamera": ("t:camera", "#607D8B", "Càmera"),
    "com.google.android.apps.youtube.music": ("s:youtubemusic", "#FF0000", "YT Music"),
    "com.google.android.apps.authenticator2": ("t:shield-lock", "#4285F4", "Authenticator"),
    "com.android.contacts": ("t:address-book", "#1E88E5", "Contactes"),
    "com.android.mms": ("t:message", "#1A73E8", "Missatges"),
    "com.android.email": ("t:mail", "#1E88E5", "Correu"),
    "com.android.fileexplorer": ("t:folder", "#FFB300", "Fitxers"),
    "com.android.calendar": ("t:calendar", "#4285F4", "Calendari"),
    "com.xiaomi.calendar": ("t:calendar", "#4285F4", "Calendari"),
    "com.miui.cleaner": ("t:trash", "#43A047", "Netejador"),
    "com.miui.video": ("t:player-play", "#E53935", "Vídeo"),
    "com.mi.health": ("t:heart", "#FF6D00", "Mi Fitness"),
    "com.xiaomi.hm.health": ("t:run", "#FF6D00", "Zepp Life"),
    "com.xiaomi.smarthome": ("t:home", "#FF6900", "Mi Home"),
    "com.microsoft.office.word": ("t:file-text", "#2B579A", "Word"),
    "com.microsoft.office.excel": ("t:table", "#217346", "Excel"),
    "com.microsoft.office.powerpoint": ("t:presentation", "#D24726", "PowerPoint"),
    "com.microsoft.skydrive": ("t:cloud", "#0078D4", "OneDrive"),
    "com.dropbox.android": ("s:dropbox", "#0061FF", "Dropbox"),
    "org.mozilla.firefox": ("s:firefoxbrowser", "#FF7139", "Firefox"),
    "com.opera.browser": ("s:opera", "#FF1B2D", "Opera"),
    "com.brave.browser": ("s:brave", "#FB542B", "Brave"),
    "com.microsoft.emmx": ("t:world", "#0078D7", "Edge"),
    "fr.vinted": ("s:vinted", "#09B1BA", "Vinted"),
    "com.alibaba.aliexpresshd": ("s:aliexpress", "#FF4747", "AliExpress"),
    "com.glovo": ("s:glovo", "#FFC244", "Glovo"),
    "com.ubercab.eats": ("s:ubereats", "#06C167", "Uber Eats"),
    "es.lacaixa.mobile.android.newwapicon": ("t:building-bank", "#007EAE", "CaixaBank"),
    "com.bbva.bbvacontigo": ("t:building-bank", "#004481", "BBVA"),
    "es.bancosantander.apps": ("t:building-bank", "#EC0000", "Santander"),
    "com.whatsapp.w4b": ("s:whatsapp", "#128C7E", "WA Business"),
    "org.videolan.vlc": ("s:vlcmediaplayer", "#FF8800", "VLC"),
}

# Noms visibles de les apps del telèfon de l'usuari (els de la pantalla d'inici)
NOMS = {
    "com.whatsapp": "WhatsApp", "org.telegram.messenger": "Telegram", "com.google.android.youtube": "YouTube",
    "com.google.android.gm": "Gmail", "com.android.chrome": "Chrome", "com.google.android.apps.maps": "Maps",
    "com.google.android.apps.photos": "Fotos", "com.android.vending": "Play Store", "com.strava": "Strava",
    "com.shazam.android": "Shazam", "com.zhiliaoapp.musically": "TikTok", "com.google.android.dialer": "Telèfon",
    "com.google.android.contacts": "Contactes", "com.google.android.apps.messaging": "Missatges",
    "com.android.camera": "Càmera", "com.miui.gallery": "Galeria", "com.android.settings": "Configuració",
    "com.miui.calculator": "Calculadora", "com.miui.notes": "Notes", "com.android.deskclock": "Rellotge",
    "com.miui.weather2": "Temps", "com.miui.securitycenter": "Seguretat", "com.android.thememanager": "Temes",
    "com.mi.android.globalFileexplorer": "Fitxers", "com.wallapop": "Wallapop", "com.google.android.calendar": "Calendar",
    "com.google.android.apps.docs": "Drive", "com.garmin.android.apps.connectmobile": "Garmin",
}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def tabler(nom):
    f = os.path.join(TABLER, nom + ".svg")
    if not os.path.exists(f):
        return None
    svg = open(f, encoding="utf-8").read()
    cos = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)
    return re.sub(r"\s+", " ", cos).strip()


def simple(nom):
    f = os.path.join(SIMPLE, nom + ".svg")
    if not os.path.exists(f):
        return None
    return re.search(r'<path d="([^"]+)"', open(f, encoding="utf-8").read()).group(1)


def glif(g, avisos, paquet):
    tipus, nom = g.split(":", 1)
    if tipus == "m":
        return {"m": slug(nom)}
    if tipus == "t":
        d = tabler(nom)
        if d:
            return {"t": d}
    if tipus == "s":
        d = simple(nom)
        if d:
            return {"s": d}
    avisos.append(f"{paquet}: falta {g}, poso «apps»")
    return {"t": tabler("apps")}


def main():
    apps = json.load(open(os.path.join(ARREL, "eines", "apps.json"), encoding="utf-8-sig"))
    colors = json.load(open(os.path.join(ARREL, "eines", "colors.json"), encoding="utf-8-sig"))
    cat, avisos = {}, []
    for p, g in apps.items():
        if p.startswith("_"):
            continue
        e = glif(g, avisos, p)
        e["c"] = colors.get(p, colors["_defecte"])
        if p in NOMS:
            e["n"] = NOMS[p]
        cat[p] = e
    for p, (g, c, n) in EXTRES.items():
        if p in cat:
            continue
        e = glif(g, avisos, p)
        e.update(c=c, n=n)
        cat[p] = e

    os.makedirs(os.path.join(WWW, "dades"), exist_ok=True)
    with open(os.path.join(WWW, "dades", "cataleg.js"), "w", encoding="utf-8") as f:
        f.write("/* Generat per eines/exporta_web.py: paquet -> glif (t: Tabler, s: marca, m: motiu Xoriguer), color i nom. */\n")
        f.write("window.CATALEG = " + json.dumps(cat, ensure_ascii=False, separators=(",", ":")) + ";\n")
        f.write("window.COLOR_DEFECTE = " + json.dumps(colors["_defecte"]) + ";\n")

    # motius
    dm = os.path.join(WWW, "img", "motius")
    os.makedirs(dm, exist_ok=True)
    for nom in os.listdir(os.path.join(LOGOS, "_eines", "motius")):
        if nom.endswith(".png"):
            shutil.copy(os.path.join(LOGOS, "_eines", "motius", nom), os.path.join(dm, slug(nom[:-4]) + ".png"))
    # logos
    dl = os.path.join(WWW, "img", "logos")
    os.makedirs(dl, exist_ok=True)
    shutil.copy(os.path.join(LOGOS, "XoriguerAparcament", "falco.png"), os.path.join(dl, "falco.png"))
    shutil.copy(os.path.join(LOGOS, "Xoriguer", "1_logotip_complet", "xoriguer_logotip_transparent_per_fons_fosc.png"),
                os.path.join(dl, "logotip.png"))
    shutil.copy(os.path.join(LOGOS, "Xoriguer", "2_simbol_icona", "xoriguer_simbol_transparent.png"),
                os.path.join(dl, "simbol.png"))

    # colors de sistema (cache/sistema/<paquet>/, fet per colors_sistema.py)
    sis, out = os.path.join(ARREL, "cache", "sistema"), {}
    for p in sorted(os.listdir(sis)) if os.path.isdir(sis) else []:
        d = os.path.join(sis, p)
        if not os.path.isdir(d):
            continue
        tv = os.path.join(d, "theme_values.xml")
        cols = dict(re.findall(r'<color name="([^"]+)">(#[0-9a-f]{8})</color>', open(tv, encoding="utf-8").read())) \
            if os.path.exists(tv) else {}
        dd = os.path.join(d, "res", "drawable-xxhdpi")
        fons = {}
        if os.path.isdir(dd):
            from PIL import Image
            for f in os.listdir(dd):
                r, g, b = Image.open(os.path.join(dd, f)).convert("RGB").getpixel((0, 0))
                fons[f[:-4]] = "#%02x%02x%02x" % (r, g, b)
        # els colors es desen per «paper» (fons, targeta, accent) perquè el programa els pugui canviar
        rol = {"#ff1e2a3b": "f", "#ff27354a": "t", "#ffffa82e": "a"}
        out[p] = {"c": {n: rol.get(v, v) for n, v in cols.items()},
                  "d": {n: ("f" if v == "#1e2a3b" else "t") for n, v in fons.items()}}
    with open(os.path.join(WWW, "dades", "sistema.js"), "w", encoding="utf-8") as f:
        f.write("/* Generat per eines/exporta_web.py: colors (c) i fons del mode fosc (d) de les apps de MIUI.\n"
                "   Valors: f = fons, t = targeta, a = accent. */\n")
        f.write("window.SISTEMA = " + json.dumps(out, separators=(",", ":")) + ";\n")

    print(f"Catàleg: {len(cat)} apps · sistema: {len(out)} apps")
    for a in avisos:
        print("  ", a)


if __name__ == "__main__":
    main()
