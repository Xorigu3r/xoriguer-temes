/* Xoriguer Temes — escriptor de ZIP mínim (sense compressió, noms UTF-8). MIUI llegeix bé els .mtz «stored». */
'use strict';
(function (g) {
  const TAULA = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = TAULA[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  const enc = new TextEncoder();

  class Zip {
    constructor() { this.entrades = []; }
    afegeix(nom, dades) {
      const b = typeof dades === 'string' ? enc.encode(dades) : dades;
      this.entrades.push({ nom: enc.encode(nom), b, crc: crc32(b) });
    }
    bytes() {
      const parts = [], central = [];
      let off = 0;
      const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5);
      for (const e of this.entrades) {
        const h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
        h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, e.crc, true);
        h.setUint32(18, e.b.length, true); h.setUint32(22, e.b.length, true); h.setUint16(26, e.nom.length, true); h.setUint16(28, 0, true);
        parts.push(new Uint8Array(h.buffer), e.nom, e.b);
        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
        c.setUint16(10, 0, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true); c.setUint32(16, e.crc, true);
        c.setUint32(20, e.b.length, true); c.setUint32(24, e.b.length, true); c.setUint16(28, e.nom.length, true);
        c.setUint32(42, off, true);
        central.push(new Uint8Array(c.buffer), e.nom);
        off += 30 + e.nom.length + e.b.length;
      }
      const midaC = central.reduce((s, p) => s + p.length, 0);
      const f = new DataView(new ArrayBuffer(22));
      f.setUint32(0, 0x06054b50, true); f.setUint16(8, this.entrades.length, true); f.setUint16(10, this.entrades.length, true);
      f.setUint32(12, midaC, true); f.setUint32(16, off, true);
      const tot = [...parts, ...central, new Uint8Array(f.buffer)];
      const out = new Uint8Array(tot.reduce((s, p) => s + p.length, 0));
      let p = 0; for (const t of tot) { out.set(t, p); p += t.length; }
      return out;
    }
  }
  g.Zip = Zip;
})(window);
