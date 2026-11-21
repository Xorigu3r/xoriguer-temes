/* Xoriguer Temes — pont amb cada plataforma.
 *   Android (Capacitor): connector natiu «Temes» (android/.../TemesPont.java): el mateix mòbil.
 *   Windows (Electron): window.xtEscriptori (escriptori/preload.js): el telèfon connectat per USB amb adb.
 *   Web: només crea i descarrega el .mtz. */
'use strict';
(function (g) {
  const natiu = !!(g.Capacitor && g.Capacitor.isNativePlatform && g.Capacitor.isNativePlatform());
  const cap = natiu ? (g.Capacitor.registerPlugin ? g.Capacitor.registerPlugin('Temes') : g.Capacitor.Plugins.Temes) : null;
  const esc = g.xtEscriptori || null;
  const tipus = cap ? 'android' : esc ? 'windows' : 'web';

  function aBase64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }

  const Plat = {
    tipus,
    /** {connectat, model, nom, W, H, miui, sensAdb, missatge} */
    async info() {
      if (cap) { const r = await cap.info(); return { connectat: true, ...r }; }
      if (esc) return esc.info();
      return { connectat: false };
    },
    /** [{paquet, nom, icona (dataURL, només Android)}] o null si no es pot saber */
    async apps() {
      if (cap) return (await cap.apps()).apps;
      if (esc) return esc.apps();
      return null;
    },
    async desa(bytes, nom) {
      if (cap) return cap.desa({ nom, dades: aBase64(bytes) });
      if (esc) return esc.desa({ nom, dades: bytes });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
      a.download = nom; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { ok: true };
    },
    /** Android: {ok, possible} = si tenim (o podem demanar) permís a la carpeta del gestor de temes */
    async carpeta() { return cap ? cap.carpeta() : { ok: false, possible: false }; },
    async demanaCarpeta() { return cap ? cap.demanaCarpeta() : { ok: false }; },
    /** Retorna {ok, tria (cal triar el fitxer al selector), missatge} */
    async aplica(bytes, nom) {
      if (cap) {
        const c = await cap.carpeta();
        if (c.ok) {   // directe: a la carpeta del gestor de temes, que l'aplica sol
          try {
            const d = await cap.desaATemes({ nom, dades: aBase64(bytes) });
            return cap.aplica({ cami: d.cami });
          } catch (e) { console.warn('carpeta del gestor:', e); }
        }
        const d = await cap.desa({ nom, dades: aBase64(bytes) });
        return cap.aplica({ cami: d.cami });
      }
      if (esc) return esc.aplica({ nom, dades: bytes });
      return { ok: false, missatge: 'web' };
    },
    potAplicar: tipus !== 'web',
    descarregaAdb: () => (esc ? esc.descarregaAdb() : null),
    /** Text d'una adreça de xoriguer.dev (actualitzacions) */
    async busca(url) {
      if (esc) return esc.busca(url);
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    },
    obreUrl(url) {
      if (cap) return cap.obreUrl({ url });
      if (esc) return esc.obreExtern(url);
      window.open(url, '_blank', 'noopener');
    },
  };
  g.Plat = Plat;
})(window);
