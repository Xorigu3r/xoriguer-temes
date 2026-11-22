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

## 1.2.0 (21/11/2026, publicada dins la 1.4.0)
- Estils «Marc daurat» i «Marc platejat» (`iconaMarc` a motor.js, només a la web/app, no a fes_temes.py): marc metàl·lic
  bisellat, interior brillant amb el color de l'app. Opció «plenes»: la icona original de cada app a dins (Android).
  Marc també a l'editor d'estils (`cfg.marc`).

## 1.3.0 (22/11/2026, publicada dins la 1.4.0)
- Apartat «Centre de control» (MIUI 14, el nou, `miui.systemui.plugin`): provat amb colors exagerats al Mi 10T Lite.
  SÍ canvien: `qs_card_enabled_color` (targeta Wi-Fi), `qs_card_cellular_color` (dades), `qs_enabled_color`/`qs_disabled_color`
  (botons rodons), `qs_icon_enabled_color`, `toggle_slider_progress_color` (barres), `header_clock_text_color`/`header_date_text_color`.
  NO canvien: `control_center_background_dim`, `status_bar_clock_color` (rellotge de la barra d'estat) i el rellotge de
  bloqueig (`clock_text_color`; MIUI 14 en tria el color segons el fons: caldria una pantalla de bloqueig MAML pròpia).

## 1.4.0 (22/11/2026, publicada; inclou 1.2.0 i 1.3.0)
- Pantalla de bloqueig pròpia (MAML, component `lockscreen` + `plugin_config.xml`): rellotge d'imatges num_0..9/num_dot
  en 5 estils (taronja, crema, or, contorn, fi), posició (posy %), alineació, mida, data i notificacions (targetes pissarra).
  `config.xml` (posy, data) es pot canviar al mòbil amb el botó d'ajustos (MamlConfigSettings, maml_code=lockstyle).
  Provat al Mi 10T Lite: es veu bé i lliscar amunt porta al PIN. Exemple estudiat: BrS v9 (miuithemer.com).

## 1.5.0 (22/11/2026, publicada)
- Estils de rellotge propis (`Motor.registraRellotge`, `RL_CFG`, localStorage `xt-rellotges`): lletra, color (color/degradat/or/
  plata/contorn), separador (: · cap) i el seu color, vora, color de la data (també al DateTime del MAML). Galeria amb mostres.
- Casella «Posa el logo Xoriguer al fons» (`fonsOpcions.senseLogo`, desat a `xt-opcions`): cap fons porta logo.
- APK instal·lat al Mi 10T Lite i s'obre; l'editor només s'ha provat al navegador.

- Rellotge de la pantalla d'inici: provat i DESCARTAT (22/11/2026). El component `clock_2x4` del .mtz s'instal·la a
  /data/system/theme/, però al MIUI 14 global el giny «Classical clock» carrega sempre el seu propi mtz del sistema, i la
  llista de ginys només mostra rellotges de temes importats (BD del gestor; un .mrc/.mrm posat a mà a `.data/` no surt).

## 1.6.0 (22/11/2026, publicada)
- Estil «Marc de bronze» (`MarcBronze`, `METALLS.bronze`, `prim`: marc més prim i sense brillantor de vidre), copiat d'un tema
  que l'usuari tenia al mòbil. Als estils amb marc, les apps fora del catàleg porten l'anell com a `icon_border` (+ `icon_mask`).
  Provat al Mi 10T Lite amb el programa de Windows (icones originals a dins). «De bronze» també a l'editor d'estils.
- L'avís d'actualització en obrir l'APK ja hi és (`XoriguerObliga`, en obrir i en tornar-hi cada hora).

## 1.7.0 (22/11/2026, publicada; «Luxe daurat» provat després al Mi 10T Lite: es veu bé, agulles i data OK)
- Per provar només el rellotge sense tocar icones ni fons: mtz amb description.xml + lockscreen + plugin_config.xml +
  el fons de bloqueig actual, i `--el theme_apply_flags 4100 --el theme_remove_flags 0` (4096 sol esborra el fons de bloqueig).
- Rellotges analògics de luxe per a la pantalla de bloqueig: «Luxe daurat» i «Luxe platejat» (`RL_CFG.tipus:'agulles'`,
  `agulles()` a motor.js): esfera de carboni, índexs, falcó, caixetes de dia i dia de la setmana (DateTime `d` i `EEE`),
  agulles com a Image amb `rotation` + `pivotX/pivotY` (#hour24, #minute, #second): giren bé al mòbil.
- A la vista prèvia del bloqueig: arrossegar mou el rellotge (`alinea:'lliure'`, `cx`) i les cantonades el fan més gran o
  més petit (`lligaArrossega` a app.js). Mida per defecte del digital 0.55 (mitja pantalla; migració `rlMida`).

## 2.0.0 (22/11/2026, publicada)
- Assistent pas a pas (demanat per l'usuari: «més senzill, com MIUI»): 1 Icones, 2 Fons, 3 Bloqueig, 4 Colors, 5 Aplica
  (`vesA()` a app.js, barra fixa Enrere/Següent). Opcions avançades dins de `<details class="mes">`.
- Fons = base + logo per separat (`E.base`: FalcoOr/Falco/Pissarra/Taronja/Crema/foto, `E.logo`, `E.logoBloq`; `Motor.BASES`).
  La foto de l'usuari és a IndexedDB amb la clau 'foto'. Es registra com a fons '_tria'. L'editor de fons propis ja no hi és (migració de `xt-fons`).
- Pas 5: «Tot el tema» / «Només les icones» (flags 8, **sense provar al mòbil**) / «Només la pantalla de bloqueig» (4100, provat).
  `Motor.flagsParts`, TemesPont.posaParts, main.js. Les barreges amb el bit 1 (p. ex. 5 = 1|4) **esborren el fons d'inici**
  (provat 22/11/2026): per això no n'hi ha.
- Velocitat: les icones (el 85% del temps) es preparen d'amagat en triar l'estil (`Motor.preparaIcones`, cridat per
  `preparaIcones()` a app.js) i es guarden com a PNG a la memòria (promeses compartides) i a IndexedDB (magatzem 'icones',
  clau `VER_IC|estil|paquet|...`; **canvia `VER_IC` si canvies el dibuix de les icones**). Ordinador: 3,8 s → 0,6 s.
- **Al WebView d'Android `canvas.toBlob` triga ~4 s per imatge**: `aBytes` fa servir `toDataURL` (2 ms). Mi 10T Lite, 109 apps:
  >2 min → 6,7 s (creant de seguida) i 1 s (icones ja preparades).
- Mòbil apaïsat (`max-height: 520px`): la capçalera i els passos no són fixos.
- Provar l'app al mòbil des de l'ordinador: compilar amb `"webContentsDebuggingEnabled": true` (android de capacitor.config.json,
  NOMÉS per provar), `adb forward tcp:9444 localabstract:webview_devtools_remote_<pid>` i CDP. Tornar a instal·lar l'APK normal.
- Per què no es podia triar el rellotge de luxe al mòbil: la vista prèvia del bloqueig omplia la pantalla i amb `touch-action:none`
  no es podia fer lliscar fins a la galeria. Ara la galeria va abans i la vista prèvia és petita.

## 2.0.1 (22/11/2026, publicada)
- Fons d'inici i de bloqueig per separat (`E.baseB` 'igual'/base/foto, foto a IndexedDB 'foto-bloq', `E.logoB`), pestanyes al pas 2.
- Pas 5, opció «Els fons de pantalla i la pantalla de bloqueig (conserva les icones)» (només APK): fons d'inici amb
  WallpaperManager FLAG_SYSTEM (`TemesPont.posaFonsInici`), espera 7 s (Android reinicia finestres en recalcular colors) i
  després el bloqueig amb 4100. Provat al Mi 10T Lite: icones de bronze conservades, rellotge i fons posats.
- Errors de la 2.0.0 corregits: `call.getLong("flags")` donava -1 (arriba Integer) → ara `getData().optLong`; l'app és
  `screenOrientation="portrait"` (amb el mòbil apaïsat el gestor de temes es reiniciava a mitja feina i ho deixava tot buit).
- Idees pendents: imatge de fons a Configuració (drawable `miuix_appcompat_settings_window_bg_dark`, totes les pantalles,
  només amb «Tot el tema»); conservar les icones del tema actual des de Windows (`MIUI/theme/.data/content/icons/<uuid>.mrc`,
  mateixa mida que /data/system/theme/icons).

## Després de la 2.0.1 (23/11/2026, sense publicar)
- Llistes de Configuració semitransparents (provat al Mi 10T Lite, «es veu bé»): les llistes fan servir
  `miuix_preference_list_item_bg_color_dark` → `@color/miuix_appcompat_black`; amb imatge, NOMÉS a `nightmode/theme_values.xml`
  de com.android.settings: negre, llistes i fons (rol f) = pissarra amb alfa 8c.
- La mateixa imatge a altres apps miuix (`AMB_IMATGE` a motor.js): com.android.phone (SIM), com.xiaomi.account, com.miui.miservice,
  com.xiaomi.discover (actualitzador), com.miui.home (ajustos de l'escriptori). Només nightmode/ i a mitja resolució (tema 12,7 MB).
  Provat al Mi 10T Lite el 23/11/2026: es veu bé (també l'escriptori). Bienestar digital (Google) no es pot.
- Per tenir icones d'un tema descarregat + el nostre: aplicar «Tot el tema» i després, a «Temes» de MIUI, tornar a aplicar només
  les icones del tema descarregat (així conserva el seu .mra i la comprovació DRM no ho desfà).
- Pas 4: «Imatge de fons a Configuració» (cap / foto 'foto-config' / el fons d'inici, «Enfosqueix»): substitueix els drawables
  `f` de `com.android.settings` per la imatge enfosquida (`Motor.imatgeConfiguracio`). Només amb «Tot el tema».
- **TRET: copiar les icones del tema actual dins del nostre (.mrc de MIUI/theme/.data/content/icons).** Es va aplicar bé, però
  ~15 min després la comprovació DRM de MIUI (`drm` → /data/system/theme_magic/drm.log, `ThemeRuntimeManager.restore...`) va
  veure les icones d'un tema protegit sense el seu `.mra` a /data/system/theme/rights i **va tornar tot el telèfon al tema de sèrie**
  (23/11/2026 00:14). No ho tornis a fer ni intentis falsificar els permisos. Per conservar icones d'un tema descarregat: només
  «Fons i bloqueig» (4100 + WallpaperManager), que no toca `icons` ni `rights`.

## Pendent
- Provar l'APK al mòbil (llista d'apps amb icones, desar, selector del gestor de temes): **publicada sense provar** (decisió de l'usuari).
- Provar en altres models i HyperOS.
- L'APK no porta XoriguerObliga.java (munta.py posa "obliga": true a tots els versio.json amb APK).
