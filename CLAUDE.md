# Xoriguer Temes – context per a Claude Code

## Preferències de l'usuari
- Respon en **català**. Mòbil: **Xiaomi Mi 10T Lite** (M2007J17G, MIUI 14 global EEA, Android 12, 1080×2400).
- Fons MAI negre: paleta «Blau pissarra». Nom sota la icona d'Android: «Temes» (sense «Xoriguer»).
- No és programador: vol coses acabades i provades. No facis captures del mòbil si no és una pantalla nostra
  (comprova `mResumedActivity` abans): una vegada va sortir un xat privat.

## Què és
Fet el 21/11/2026. Crea temes MIUI (.mtz) amb icones Xoriguer, fons i colors de les pantalles del sistema.
Dues parts:
1. **Generador Python** (`eines/`), el primer que es va fer: `fes_temes.py` fa els 6 temes de `temes/`,
   `posa_tema.ps1 <Versio>` els aplica al mòbil per USB.
2. **Programa Xoriguer Temes**: una sola web (`www/`) que és **APK (Capacitor 8)** i **.exe (Electron 33)**.
   El motor de dibuix és `www/js/motor.js` (traducció a Canvas de `fes_temes.py`: si canvies un, canvia l'altre).

## Com s'aplica un tema a MIUI (descobert aquí)
- `am start --activity-clear-task -f 0x10008000 -n com.android.thememanager/.ApplyThemeForScreenshot -e theme_file_path <camí> -e api_called_from x`
  (l'alias de l'arrel és l'exportat; cal `force-stop` del gestor abans, si no només el porta al davant).
- Per adb (Windows): el fitxer a `/sdcard/Android/data/com.android.thememanager/files/xoriguer/` → s'aplica sol.
- Des d'una app (APK): el fitxer a Descàrregues → el gestor no el pot llegir i obre un selector; quan l'usuari hi toca
  el fitxer, s'aplica (provat). Per això l'APK mostra l'ajuda «busca el fitxer i toca'l».
- Pantalles del sistema en mode fosc: el fons negre ve de drawables `*_dark` (p. ex. `miuix_appcompat_settings_window_bg_dark`);
  es substitueixen amb PNG a `res/drawable-xxhdpi/` **i** a `nightmode/res/...` dins del component (zip amb el nom del paquet).
  `eines/colors_sistema.py` ho treu de cada APK amb aapt2. Contactes/Telèfon/Missatges són de Google: no es tenyeixen.

## Fitxers
- `eines/apps.json` (paquet → glif), `eines/colors.json` (color de cada app als models de color).
- `eines/exporta_web.py` → `www/dades/cataleg.js` (172 apps: les del mòbil + populars), `sistema.js`, `www/img/`.
  **Torna'l a executar** (`npm run dades`) després de canviar apps.json, colors.json o els motius de LOGOS-XORIGUER.
- `www/dades/models.js` models Xiaomi/Redmi/POCO amb resolució. `www/js/zip.js` ZIP sense compressió.
- `www/js/plataforma.js` pont: Android `TemesPont.java` (info, apps amb icones, desa a Descàrregues, aplica),
  Windows `escriptori/main.js` (adb: el de l'ordinador o el que descarrega de dl.google.com a userData).
- Idiomes: `i18n.js` + `traduccions.js` (files [ca, es, fr, en], clau = text català exacte).

## Compilar
- `npm run apk` → `dist/XoriguerTemes.apk`. Clau: `~/android-tools/claus/xoriguer-temes.jks` + `temes.properties` (fora del projecte).
- `npm run exe` → `dist/XoriguerTemes-Instalador.exe` (sense firma: SmartScreen avisarà).
- Icona: `python eines/fes_icona.py` i després `npx capacitor-assets generate --android --iconBackgroundColor '#1E2A3B' ...`.
- Provar la web: `npm run serve` (port 8811).

## Proves fetes (21/11/2026)
- Web al navegador: tema sencer (172 icones) en 4,5 s.
- .exe (win-unpacked, controlat per CDP): detecta el Mi 10T Lite, llista 105 apps, crea i aplica el tema → comprovat al mòbil.
- APK: compilat; **no instal·lat encara** (MIUI demana confirmar «Instal·la via USB» al mòbil). Còpia a Descàrregues del mòbil.

## Publicat (21/11/2026, v1.0.0)
- xoriguer.dev: fitxa a `xorigu3r.github.io/productes.js` (id «temes», img/temes.png), `temes/versio.json` a
  `XoriguerMirall/munta.py` (VERSIONS). Exe a R2 (`npx wrangler@4 r2 object put xoriguer-baixades/XoriguerTemes-Instalador.exe ...`),
  APK a /baixades/. Després: `python -I munta.py`, `npx wrangler deploy`, `python -I avisa_indexnow.py`.
- GitHub: https://github.com/Xorigu3r/xoriguer-temes (Release v1.0.0 amb exe i APK). `gh` instal·lat i amb sessió.
- Versió nova: VERSIO a package.json i escriptori/package.json, versionCode/versionName a android/app/build.gradle,
  la línia de munta.py, recompilar, pujar l'exe a R2, munta + deploy, i `gh release create vX.Y.Z`.

## 1.1.0 (21/11/2026, publicada)
- APK: aplica sense selector desant el .mtz com a IMATGE (`Pictures/Xoriguer Temes/xoriguer-tema.jpg`): el gestor de temes
  pot llegir imatges públiques. S'esborra als 45 s (`TemesPont.aplicaDirecte`). Provat al Mi 10T Lite.
  NO van: SAF a Android/data (DocumentsUI actualitzat ho bloqueja, «No se puede usar esta carpeta») ni una carpeta oculta.
- Botó d'opcions: idioma, Quant a, Busca actualitzacions (`versions/temes/versio.json`; VERSIO a `www/js/app.js`).
- Estils d'icones propis (`Motor.registraEstil`, localStorage `xt-estils`) i fons propis amb foto (IndexedDB) o degradat
  (`Motor.registraFons`, `xt-fons`). Lliscadors de posició (inici/bloqueig) i mida del logo (`fonsOpcions`).
- Llistes pròpies (models, idioma) en lloc de `<select>` (el desplegable natiu d'Android sortia negre).
- XoriguerObliga i TriaAmbArxius (fotos amb Xoriguer Arxius) integrats.

## 1.2.0 (21/11/2026, compilada, no publicada)
- Estils «Marc daurat» i «Marc platejat» (`iconaMarc` a motor.js, només a la web/app, no a fes_temes.py): marc metàl·lic
  bisellat, interior brillant amb el color de l'app. Opció «plenes»: la icona original de cada app a dins (Android).
  Marc també a l'editor d'estils (`cfg.marc`).

## Pendent
- Provar l'APK al mòbil (llista d'apps amb icones, desar, selector del gestor de temes): **publicada sense provar** (decisió de l'usuari).
- Provar en altres models i HyperOS.
- L'APK no porta XoriguerObliga.java (munta.py posa "obliga": true a tots els versio.json amb APK).
