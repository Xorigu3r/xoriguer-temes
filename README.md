# Xoriguer Temes

Creador de temes per a telèfons **Xiaomi, Redmi i POCO (MIUI 12–14)**. Gratuït, sense anuncis i tot local.

- **Icones** en sis estils: Pissarra, Taronja, Crema, Color, Color 3D i Pissarra Color (cada app amb el color de la seva marca).
- **Fons de pantalla** d'inici i de bloqueig amb el xoriguer: en color, en or o en or i taronja, a la mida exacta de cada model.
- **Pantalles del sistema** (Configuració, Seguretat, Notes, Calculadora…) amb el color de fons i d'accent que triïs, en mode fosc.
- Detecta el model i les apps instal·lades i **aplica el tema**: des de Windows per USB (adb) o des del mateix mòbil.
- En català, castellà, francès i anglès.

## Baixades
- Windows: `XoriguerTemes-Instalador.exe` · Android: `XoriguerTemes.apk` — a les [Releases](../../releases) i a https://xoriguer.dev/

## Com està fet
Una sola web (`www/`) empaquetada com a **APK** (Capacitor 8, connector natiu `TemesPont.java`) i com a **.exe** (Electron 33).
El motor de dibuix (`www/js/motor.js`) fa les icones i els fons amb Canvas i empaqueta el `.mtz`.
Les eines de Python (`eines/`) generen el catàleg d'apps i els colors del sistema.

```
npm install
npm run dades      # catàleg d'apps, motius i colors del sistema -> www/dades
npm run serve      # prova la web a http://localhost:8811
npm run apk        # dist/XoriguerTemes.apk
npm run exe        # dist/XoriguerTemes-Instalador.exe
```

Icones de les apps: [Tabler Icons](https://tabler.io/icons) (MIT) i [Simple Icons](https://simpleicons.org/) (CC0).
Les marques són dels seus propietaris. Xoriguer no té relació amb Xiaomi.
