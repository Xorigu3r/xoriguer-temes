/* Xoriguer Temes — motor de dibuix (Canvas 2D). Traducció de eines/fes_temes.py.
 * Fa les icones (6 estils), els fons (8), les pantalles del sistema i empaqueta el .mtz de MIUI.
 * Depèn de window.CATALEG, window.SISTEMA (dades/) i de zip.js (window.Zip). */
'use strict';
(function (g) {
  const S = 192;          // mida de la icona a drawable-xxhdpi
  const K = 2;            // supermostreig
  const P = {
    FONS: '#1E2A3B', FONS_A: '#24344A', FONS_B: '#1A2533', TARGETA: '#27354A', FONS3: '#31405A',
    LINIA: '#41506A', CREMA: '#F6EFE2', TAR_A: '#FFA82E', TAR_B: '#F2650F',
  };

  // ------------------------------------------------------------ colors
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 8) h = h.slice(2); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const barreja = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const aclareix = (c, t) => barreja(c, [255, 255, 255], t);
  const enfosqueix = (c, t) => barreja(c, [0, 0, 0], t);
  const lluminositat = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const enfosqueixHex = (h) => hex(enfosqueix(hex2rgb(h), 0.25));

  // ------------------------------------------------------------ canvas
  function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  const ctx2 = (c) => c.getContext('2d', { willReadFrequently: true });

  function camiForma(ctx, n, tipus, inset) {
    const a = inset, b = n - inset;
    ctx.beginPath();
    if (tipus === 'cercle') ctx.arc(n / 2, n / 2, (b - a) / 2, 0, Math.PI * 2);
    else ctx.roundRect(a, a, b - a, b - a, (b - a) * (tipus === 'quadrat' ? 0.14 : 0.30));
  }
  /** Canvas amb la forma plena (blanca) */
  function forma(n, tipus, inset) {
    const c = tela(n), x = ctx2(c);
    camiForma(x, n, tipus, inset); x.fillStyle = '#fff'; x.fill();
    return c;
  }
  function degradat(ctx, w, h, c1, c2, diagonal) {
    const gr = diagonal ? ctx.createLinearGradient(0, 0, w, h) : ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, typeof c1 === 'string' ? c1 : rgb(c1));
    gr.addColorStop(1, typeof c2 === 'string' ? c2 : rgb(c2));
    return gr;
  }
  /** Pinta la silueta (alfa) de `font` amb `emplenat` (color o funció ctx=>fillStyle) */
  function pinta(font, emplenat) {
    const c = tela(font.width, font.height), x = ctx2(c);
    x.drawImage(font, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = typeof emplenat === 'function' ? emplenat(x, c.width, c.height) : emplenat;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function ombra(font, blur, opac, dy) {
    const s = pinta(font, `rgba(10,16,26,${opac})`);
    const c = tela(font.width, font.height), x = ctx2(c);
    x.filter = `blur(${blur}px)`;
    x.drawImage(s, 0, dy);
    return c;
  }
  function vora(n, tipus, inset, gruix) {
    const c = forma(n, tipus, inset), x = ctx2(c);
    x.globalCompositeOperation = 'destination-out';
    camiForma(x, n, tipus, inset + gruix); x.fill();
    return c;
  }
  /** Retalla el marge transparent i escala perquè hi càpiga en un quadrat `caixa` */
  function encaixa(img, caixa) {
    const w = img.width, h = img.height;
    const c0 = tela(w, h), x0 = ctx2(c0); x0.drawImage(img, 0, 0);
    const d = x0.getImageData(0, 0, w, h).data;
    let x1 = w, y1 = h, x2 = -1, y2 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) {
      if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y;
    }
    if (x2 < 0) { x1 = 0; y1 = 0; x2 = w - 1; y2 = h - 1; }
    const bw = x2 - x1 + 1, bh = y2 - y1 + 1, r = caixa / Math.max(bw, bh);
    const c = tela(Math.max(1, Math.round(bw * r)), Math.max(1, Math.round(bh * r))), x = ctx2(c);
    x.imageSmoothingQuality = 'high';
    x.drawImage(c0, x1, y1, bw, bh, 0, 0, c.width, c.height);
    return c;
  }
  function centra(base, capa, dy) {
    ctx2(base).drawImage(capa, Math.round((base.width - capa.width) / 2), Math.round((base.height - capa.height) / 2 + (dy || 0)));
  }

  /** Els motius Xoriguer: la part amb color -> cColor, la neutra (crema, blanc, negre) -> cNeutre.
   *  Cada c és un color [r,g,b] o 'grad' (degradat taronja). */
  function recolora(img, cColor, cNeutre) {
    const w = img.width, h = img.height;
    const base = tela(w, h), xb = ctx2(base); xb.drawImage(img, 0, 0);
    const d = xb.getImageData(0, 0, w, h);
    const mA = new ImageData(w, h), mB = new ImageData(w, h);
    for (let i = 0; i < d.data.length; i += 4) {
      const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2], a = d.data[i + 3];
      if (!a) continue;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      const s = mx ? (mx - mn) * 255 / mx : 0;
      const t = (s >= 80 && mx >= 90) ? mA : mB;
      t.data[i] = t.data[i + 1] = t.data[i + 2] = 255; t.data[i + 3] = a;
    }
    const out = tela(w, h), xo = ctx2(out);
    for (const [m, col] of [[mA, cColor], [mB, cNeutre]]) {
      const c = tela(w, h); ctx2(c).putImageData(m, 0, 0);
      xo.drawImage(pinta(c, col === 'grad' ? (x, W, H) => degradat(x, W, H, P.TAR_A, P.TAR_B, true) : rgb(col)), 0, 0);
    }
    return out;
  }

  // ------------------------------------------------------------ glifs
  const memoria = new Map();
  function carregaImatge(src) {
    if (memoria.has(src)) return memoria.get(src);
    const p = new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error(src)); i.src = src; });
    memoria.set(src, p);
    return p;
  }
  const svgURL = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  /** Imatge del glif d'una app: {tipus:'motiu'|'glif'|'marca'|'original', img} o null */
  async function glif(paquet, gruix, original) {
    const e = (g.CATALEG || {})[paquet];
    if (!e) {
      if (original) return { tipus: 'original', img: await carregaImatge(original) };
      return null;
    }
    if (e.m) return { tipus: 'motiu', img: await carregaImatge(`img/motius/${e.m}.png`) };
    if (e.t) return {
      tipus: 'glif', img: await carregaImatge(svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="${gruix}" stroke-linecap="round" stroke-linejoin="round">${e.t}</svg>`)),
    };
    return { tipus: 'marca', img: await carregaImatge(svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-3 -3 30 30"><path fill="#fff" d="${e.s}"/></svg>`)) };
  }
  function colorApp(paquet) {
    const e = (g.CATALEG || {})[paquet];
    const c = hex2rgb((e && e.c) || g.COLOR_DEFECTE || '#4A6085');
    return [aclareix(c, 0.10), enfosqueix(c, 0.12)];
  }

  // ------------------------------------------------------------ estils d'icona
  const ESTILS = {
    Pissarra: { nom: 'Pissarra', forma: 'squircle', gruix: 1.6, color: false, fons: 'Pissarra' },
    Taronja: { nom: 'Taronja', forma: 'squircle', gruix: 2.3, color: false, fons: 'Taronja' },
    Crema: { nom: 'Crema', forma: 'cercle', gruix: 1.6, color: false, fons: 'Crema' },
    Color: { nom: 'Color', forma: 'squircle', gruix: 2.3, color: true, fons: 'Falco' },
    Color3D: { nom: 'Color 3D', forma: 'squircle', gruix: 2.3, color: true, fons: 'LogotipOrTaronja' },
    PissarraColor: { nom: 'Pissarra Color', forma: 'squircle', gruix: 1.6, color: true, fons: 'LogotipOr' },
    MarcOr: { nom: 'Marc daurat', forma: 'squircle', gruix: 2.3, color: true, fons: 'LogotipOr', marc: 'or' },
    MarcPlata: { nom: 'Marc platejat', forma: 'squircle', gruix: 2.3, color: true, fons: 'Logotip', marc: 'plata' },
    // marc de bronze prim, sense brillantor de vidre (com el tema que l'usuari tenia al mòbil)
    MarcBronze: { nom: 'Marc de bronze', forma: 'squircle', gruix: 2.3, color: true, fons: 'Logotip', marc: 'bronze', prim: true },
  };

  function fonsXoriguer(estil, n) {
    const c = tela(n), x = ctx2(c);
    if (estil === 'Pissarra') {
      camiForma(x, n, 'squircle', n * 0.04); x.fillStyle = degradat(x, n, n, P.FONS3, P.FONS); x.fill();
      x.drawImage(pinta(vora(n, 'squircle', n * 0.04, K * 2), P.LINIA), 0, 0);
    } else if (estil === 'Taronja') {
      camiForma(x, n, 'squircle', n * 0.04); x.fillStyle = degradat(x, n, n, P.TAR_A, P.TAR_B, true); x.fill();
      x.save(); camiForma(x, n, 'squircle', n * 0.04); x.clip();
      x.fillStyle = 'rgba(246,239,226,0.12)'; x.fillRect(0, 0, n, n / 2); x.restore();
    } else {
      camiForma(x, n, 'cercle', n * 0.05); x.fillStyle = degradat(x, n, n, P.CREMA, '#EADFCB'); x.fill();
      x.drawImage(pinta(vora(n, 'cercle', n * 0.11, K * 3), (xx, w, h) => degradat(xx, w, h, P.TAR_A, P.TAR_B, true)), 0, 0);
    }
    return c;
  }

  async function iconaXoriguer(estil, paquet, original) {
    const n = S * K, out = tela(n), xo = ctx2(out);
    const cos = fonsXoriguer(estil, n);
    xo.drawImage(ombra(cos, K * 3, 0.35, K * 2), 0, 0);
    xo.drawImage(cos, 0, 0);
    const gl = await glif(paquet, ESTILS[estil].gruix, original);
    if (gl) {
      let img;
      if (gl.tipus === 'original') {
        img = encaixa(gl.img, n * (estil === 'Crema' ? 0.52 : 0.62));
      } else if (gl.tipus === 'motiu') {
        img = encaixa(gl.img, n * (estil === 'Crema' ? 0.50 : 0.56));
        img = estil === 'Pissarra' ? recolora(img, 'grad', hex2rgb(P.CREMA))
          : estil === 'Taronja' ? recolora(img, hex2rgb(P.CREMA), hex2rgb(P.FONS)) : recolora(img, 'grad', hex2rgb(P.FONS));
      } else {
        img = encaixa(gl.img, n * (estil === 'Crema' ? 0.52 : 0.58) * (gl.tipus === 'marca' ? 0.92 : 1));
        img = pinta(img, estil === 'Pissarra' ? (x, w, h) => degradat(x, w, h, P.TAR_A, P.TAR_B, true)
          : estil === 'Taronja' ? P.CREMA : P.FONS);
      }
      const capa = tela(n); centra(capa, img);
      if (estil === 'Taronja' && gl.tipus !== 'original') xo.drawImage(ombra(capa, K * 2, 0.35, K * 2), 0, 0);
      xo.drawImage(capa, 0, 0);
    }
    return redueix(out);
  }

  async function iconaColor(estil, paquet, original) {
    const n = S * K, out = tela(n), xo = ctx2(out);
    const [c1, c2] = colorApp(paquet);
    const base = barreja(c1, c2, 0.5);
    const gl = await glif(paquet, ESTILS[estil].gruix, original);
    let img = null;
    if (gl) {
      img = gl.tipus === 'original' ? encaixa(gl.img, n * 0.62)
        : encaixa(gl.img, n * 0.54 * (gl.tipus === 'marca' ? 0.92 : 1));
    }

    if (estil === 'PissarraColor') {
      const m = forma(n, 'squircle', n * 0.04);
      const cos = pinta(m, (x, w, h) => degradat(x, w, h, P.FONS3, P.FONS));
      xo.drawImage(ombra(cos, K * 3, 0.35, K * 2), 0, 0);
      xo.drawImage(cos, 0, 0);
      // resplendor del color al centre (retallada a la forma)
      const r = tela(n), xr = ctx2(r);
      const gr = xr.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n * 0.42);
      gr.addColorStop(0, rgba(base, 0.30)); gr.addColorStop(1, rgba(base, 0));
      xr.fillStyle = gr; xr.fillRect(0, 0, n, n);
      xr.globalCompositeOperation = 'destination-in'; xr.drawImage(m, 0, 0);
      xo.drawImage(r, 0, 0);
      xo.drawImage(pinta(vora(n, 'squircle', n * 0.04, K * 3), rgba(aclareix(base, 0.15), 0.9)), 0, 0);
      const clar = lluminositat(base) > 110 ? base : aclareix(base, 0.35);
      if (img) {
        if (gl.tipus === 'motiu') img = recolora(img, clar, hex2rgb(P.CREMA));
        else if (gl.tipus !== 'original') img = pinta(img, (x, w, h) => degradat(x, w, h, aclareix(clar, 0.15), clar, true));
        const capa = tela(n); centra(capa, img); xo.drawImage(capa, 0, 0);
      }
      return redueix(out);
    }

    const tresD = estil === 'Color3D';
    const inset = n * (tresD ? 0.06 : 0.04);
    const m = forma(n, 'squircle', inset);
    const cos = pinta(m, tresD ? (x, w, h) => degradat(x, w, h, aclareix(base, 0.12), enfosqueix(base, 0.18), true)
      : (x, w, h) => degradat(x, w, h, c1, c2, true));
    xo.drawImage(ombra(cos, K * (tresD ? 6 : 3), tresD ? 0.55 : 0.35, K * (tresD ? 5 : 2)), 0, 0);
    xo.drawImage(cos, 0, 0);
    if (tresD) {
      // bisell: vora clara a dalt i fosca a baix
      for (const [dy, col, op] of [[K * 4, [255, 255, 255], 0.55], [-K * 4, enfosqueix(base, 0.55), 0.6]]) {
        const r = tela(n), xr = ctx2(r);
        xr.drawImage(m, 0, 0);
        xr.globalCompositeOperation = 'destination-out'; xr.drawImage(m, 0, dy);
        const b = tela(n), xb = ctx2(b);
        xb.filter = `blur(${K}px)`; xb.drawImage(r, 0, 0); xb.filter = 'none';
        xb.globalCompositeOperation = 'destination-in'; xb.drawImage(m, 0, 0);
        xo.drawImage(pinta(b, rgba(col, op)), 0, 0);
      }
      // brillantor de vidre a la meitat de dalt
      const br = tela(n), xbr = ctx2(br);
      const gr = xbr.createLinearGradient(0, 0, 0, n);
      gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.47, 'rgba(255,255,255,0)');
      xbr.fillStyle = gr; xbr.fillRect(0, 0, n, n);
      xbr.globalCompositeOperation = 'destination-in'; xbr.drawImage(forma(n, 'squircle', inset + K * 5), 0, 0);
      xo.drawImage(br, 0, 0);
    }
    if (img) {
      if (gl.tipus === 'motiu') img = recolora(img, hex2rgb(P.CREMA), hex2rgb(P.FONS));
      else if (gl.tipus !== 'original') img = pinta(img, tresD ? (x, w, h) => degradat(x, w, h, '#FFFFFF', '#EEEAE2') : '#FFFFFF');
      const capa = tela(n); centra(capa, img);
      xo.drawImage(ombra(capa, K * (tresD ? 3 : 2), tresD ? 0.55 : 0.18, K * (tresD ? 4 : 2)), 0, 0);
      xo.drawImage(capa, 0, 0);
    }
    return redueix(out);
  }

  function redueix(c) {
    const o = tela(S), x = ctx2(o);
    x.imageSmoothingQuality = 'high';
    x.drawImage(c, 0, 0, S, S);
    return o;
  }

  /** Estil fet per l'usuari. cfg: {forma:'squircle'|'cercle'|'quadrat', fons:'app'|'color'|'degradat', c1, c2,
   *  glif:'blanc'|'color'|'app', cg, vora:bool, relleu:bool, mida:0.4–0.7} */
  async function iconaPersonal(cfg, paquet, original) {
    const n = S * K, out = tela(n), xo = ctx2(out);
    const [a1, a2] = colorApp(paquet);
    const base = barreja(a1, a2, 0.5);
    const relleu = !!cfg.relleu;
    const inset = n * (relleu ? 0.06 : 0.04);
    const m = forma(n, cfg.forma, inset);
    let f1, f2;
    if (cfg.fons === 'app') { f1 = relleu ? aclareix(base, 0.12) : a1; f2 = relleu ? enfosqueix(base, 0.18) : a2; }
    else if (cfg.fons === 'degradat') { f1 = hex2rgb(cfg.c1); f2 = hex2rgb(cfg.c2); }
    else { f1 = hex2rgb(cfg.c1); f2 = relleu ? enfosqueix(f1, 0.15) : f1; }
    const cos = pinta(m, (x, w, h) => degradat(x, w, h, f1, f2, true));
    xo.drawImage(ombra(cos, K * (relleu ? 6 : 3), relleu ? 0.55 : 0.35, K * (relleu ? 5 : 2)), 0, 0);
    xo.drawImage(cos, 0, 0);
    const mig = barreja(f1, f2, 0.5);
    if (relleu) {
      for (const [dy, col, op] of [[K * 4, [255, 255, 255], 0.5], [-K * 4, enfosqueix(mig, 0.55), 0.6]]) {
        const r = tela(n), xr = ctx2(r);
        xr.drawImage(m, 0, 0); xr.globalCompositeOperation = 'destination-out'; xr.drawImage(m, 0, dy);
        const b = tela(n), xb = ctx2(b);
        xb.filter = `blur(${K}px)`; xb.drawImage(r, 0, 0); xb.filter = 'none';
        xb.globalCompositeOperation = 'destination-in'; xb.drawImage(m, 0, 0);
        xo.drawImage(pinta(b, rgba(col, op)), 0, 0);
      }
      const br = tela(n), xbr = ctx2(br);
      const gr = xbr.createLinearGradient(0, 0, 0, n);
      gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.47, 'rgba(255,255,255,0)');
      xbr.fillStyle = gr; xbr.fillRect(0, 0, n, n);
      xbr.globalCompositeOperation = 'destination-in'; xbr.drawImage(forma(n, cfg.forma, inset + K * 5), 0, 0);
      xo.drawImage(br, 0, 0);
    }
    // color del dibuix
    const clarApp = lluminositat(base) > 110 ? base : aclareix(base, 0.35);
    const cg = cfg.glif === 'app' ? clarApp : cfg.glif === 'color' ? hex2rgb(cfg.cg) : [255, 255, 255];
    if (cfg.vora) xo.drawImage(pinta(vora(n, cfg.forma, inset, K * 3), rgba(cfg.glif === 'blanc' ? aclareix(mig, 0.35) : cg, 0.9)), 0, 0);
    const gl = await glif(paquet, 2, original);
    if (gl) {
      let img = encaixa(gl.img, n * (cfg.mida || 0.54) * (gl.tipus === 'marca' ? 0.92 : 1) * (gl.tipus === 'original' ? 1.12 : 1));
      if (gl.tipus === 'motiu') img = recolora(img, cg, lluminositat(cg) > 140 ? enfosqueix(mig, 0.45) : hex2rgb(P.CREMA));
      else if (gl.tipus !== 'original') img = pinta(img, relleu ? (x, w, h) => degradat(x, w, h, cg, enfosqueix(cg, 0.06)) : rgb(cg));
      const capa = tela(n); centra(capa, img);
      xo.drawImage(ombra(capa, K * (relleu ? 3 : 2), relleu ? 0.5 : 0.18, K * (relleu ? 4 : 2)), 0, 0);
      xo.drawImage(capa, 0, 0);
    }
    return redueix(out);
  }

  // ------------------------------------------------------------ icones amb marc metàl·lic
  const METALLS = {
    or: [[0, [0x7A, 0x55, 0x1C]], [0.18, [0xE8, 0xC9, 0x8A]], [0.36, [0xFF, 0xF3, 0xD6]], [0.52, [0xB8, 0x8A, 0x45]],
      [0.72, [0xF0, 0xD9, 0xA8]], [0.88, [0xA0, 0x74, 0x34]], [1, [0x6E, 0x4A, 0x18]]],
    plata: [[0, [0x5E, 0x64, 0x6E]], [0.18, [0xD8, 0xDD, 0xE4]], [0.36, [0xFF, 0xFF, 0xFF]], [0.52, [0x96, 0x9E, 0xAA]],
      [0.72, [0xE6, 0xEA, 0xEF]], [0.88, [0x82, 0x8A, 0x96]], [1, [0x4E, 0x54, 0x5E]]],
    bronze: [[0, [0x4A, 0x2E, 0x14]], [0.18, [0xC8, 0x92, 0x5A]], [0.36, [0xF4, 0xD4, 0xA4]], [0.52, [0x8E, 0x5E, 0x30]],
      [0.72, [0xDA, 0xAA, 0x72]], [0.88, [0x6E, 0x46, 0x22]], [1, [0x3E, 0x26, 0x10]]],
  };
  const mides = (n, o) => ({ inset: n * 0.045, gruix: n * (o.prim ? 0.042 : 0.065) });
  /** Només l'anell metàl·lic (transparent per dins), per a les icones i per a icon_border de MIUI */
  function anellMarc(n, fo, o) {
    const { inset, gruix } = mides(n, o);
    const ext = forma(n, fo, inset), int = forma(n, fo, inset + gruix);
    const out = tela(n), xo = ctx2(out);
    xo.drawImage(ombra(ext, K * 6, 0.6, K * 5), 0, 0);
    xo.drawImage(pinta(ext, (x) => gradMetall(x, n, o.metall)), 0, 0);
    bisell(xo, ext, n, K * 3, 'rgba(255,255,255,0.7)', 'rgba(40,25,5,0.55)');
    xo.globalCompositeOperation = 'destination-out'; xo.drawImage(int, 0, 0); xo.globalCompositeOperation = 'source-over';
    xo.drawImage(pinta(vora(n, fo, inset + gruix - K, K * 1.5), 'rgba(40,25,5,0.55)'), 0, 0);
    return { anell: out, int };
  }
  function gradMetall(x, n, tipus) {
    const gr = x.createLinearGradient(0, 0, n, n);
    for (const [t, c] of METALLS[tipus] || METALLS.or) gr.addColorStop(t, rgb(c));
    return gr;
  }
  /** Bisell dins d'una forma: vora clara a dalt i fosca a baix */
  function bisell(xo, m, n, dy, clar, fosc) {
    for (const [d, col] of [[dy, clar], [-dy, fosc]]) {
      const r = tela(n), xr = ctx2(r);
      xr.drawImage(m, 0, 0); xr.globalCompositeOperation = 'destination-out'; xr.drawImage(m, 0, d);
      const b = tela(n), xb = ctx2(b);
      xb.filter = `blur(${K}px)`; xb.drawImage(r, 0, 0); xb.filter = 'none';
      xb.globalCompositeOperation = 'destination-in'; xb.drawImage(m, 0, 0);
      xo.drawImage(pinta(b, col), 0, 0);
    }
  }
  /**
   * Icona emmarcada (com els temes «de luxe»): marc metàl·lic bisellat + interior brillant.
   * o: {forma, metall:'or'|'plata', f1, f2 (null = color de l'app), cg (color del dibuix, null = blanc), mida,
   *     plena (fes servir la icona original de l'app omplint l'interior)}
   */
  async function iconaMarc(paquet, original, o) {
    const n = S * K, out = tela(n), xo = ctx2(out);
    const fo = o.forma || 'squircle';
    const { inset, gruix } = mides(n, o);
    const ext = forma(n, fo, inset), int = forma(n, fo, inset + gruix);
    // ombra i marc
    const marc = pinta(ext, (x) => gradMetall(x, n, o.metall));
    xo.drawImage(ombra(ext, K * 6, 0.6, K * 5), 0, 0);
    xo.drawImage(marc, 0, 0);
    bisell(xo, ext, n, K * 3, 'rgba(255,255,255,0.7)', 'rgba(40,25,5,0.55)');
    // interior
    const dins = tela(n), xd = ctx2(dins);
    const gl = await glif(paquet, 2.3, original);
    const [a1, a2] = colorApp(paquet);
    const base = barreja(a1, a2, 0.5);
    if (o.plena && original) {
      const img = await carregaImatge(original);
      const c = n - 2 * (inset + gruix), z = c * 1.22;   // una mica més gran: amaga la forma pròpia de la icona
      xd.fillStyle = '#F4F1EA'; xd.fillRect(0, 0, n, n);
      xd.imageSmoothingQuality = 'high';
      xd.drawImage(img, (n - z) / 2, (n - z) / 2, z, z);
    } else {
      const f1 = o.f1 ? hex2rgb(o.f1) : aclareix(base, 0.22), f2 = o.f2 ? hex2rgb(o.f2) : enfosqueix(base, 0.28);
      xd.fillStyle = degradat(xd, n, n, f1, f2); xd.fillRect(0, 0, n, n);
      if (gl) {
        const cg = o.cg ? hex2rgb(o.cg) : [255, 255, 255];
        let img = encaixa(gl.img, n * (o.mida || 0.50) * (gl.tipus === 'marca' ? 0.92 : 1) * (gl.tipus === 'original' ? 1.15 : 1));
        if (gl.tipus === 'motiu') img = recolora(img, cg, lluminositat(cg) > 140 ? enfosqueix(base, 0.45) : hex2rgb(P.CREMA));
        else if (gl.tipus !== 'original') img = pinta(img, (x, w, h) => degradat(x, w, h, cg, enfosqueix(cg, 0.08)));
        const capa = tela(n); centra(capa, img);
        xd.drawImage(ombra(capa, K * 3, 0.5, K * 4), 0, 0);
        xd.drawImage(capa, 0, 0);
      }
    }
    xd.globalCompositeOperation = 'destination-in'; xd.drawImage(int, 0, 0);
    xo.drawImage(dins, 0, 0);
    // ombra interior sota el marc (fondària) i línia fosca de separació
    const om = tela(n), xm = ctx2(om);
    xm.drawImage(int, 0, 0); xm.globalCompositeOperation = 'destination-out'; xm.drawImage(int, 0, K * 5);
    const omb = tela(n), xob = ctx2(omb); xob.filter = `blur(${K * 3}px)`; xob.drawImage(om, 0, 0); xob.filter = 'none';
    xob.globalCompositeOperation = 'destination-in'; xob.drawImage(int, 0, 0);
    xo.drawImage(pinta(omb, 'rgba(0,0,0,0.45)'), 0, 0);
    xo.drawImage(pinta(vora(n, fo, inset + gruix - K, K * 1.5), 'rgba(40,25,5,0.45)'), 0, 0);
    // brillantor de vidre (el·lipse a la part de dalt)
    const br = tela(n), xbr = ctx2(br);
    const gr = xbr.createLinearGradient(0, n * 0.1, 0, n * 0.55);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0.02)');
    xbr.fillStyle = gr;
    xbr.beginPath(); xbr.ellipse(n / 2, n * 0.27, n * 0.36, n * 0.21, 0, 0, Math.PI * 2); xbr.fill();
    xbr.globalCompositeOperation = 'destination-in'; xbr.drawImage(int, 0, 0);
    if (!o.prim) { xo.globalAlpha = 0.85; xo.drawImage(br, 0, 0); xo.globalAlpha = 1; }
    return redueix(out);
  }

  function icona(estil, paquet, original, plena) {
    const e = ESTILS[estil];
    if (e.marc) return iconaMarc(paquet, original, { forma: e.forma, metall: e.marc, plena, prim: e.prim });
    if (e.personal && e.personal.marc && e.personal.marc !== 'cap') {
      const c = e.personal;
      return iconaMarc(paquet, original, {
        forma: c.forma, metall: c.marc, plena, mida: c.mida, prim: c.marc === 'bronze',
        f1: c.fons === 'app' ? null : c.c1, f2: c.fons === 'app' ? null : (c.fons === 'degradat' ? c.c2 : enfosqueixHex(c.c1)),
        cg: c.glif === 'color' ? c.cg : c.glif === 'app' ? hex(aclareix(barreja(...colorApp(paquet), 0.5), 0.35)) : null,
      });
    }
    if (e.personal) return iconaPersonal(e.personal, paquet, original);
    return e.color ? iconaColor(estil, paquet, original) : iconaXoriguer(estil, paquet, original);
  }
  // ------------------------------------------------------------ memòria d'icones
  // Dibuixar les 172 icones és el que fa lent crear el tema: es preparen d'amagat mentre l'usuari tria la resta
  // (app.js crida preparaIcones) i es guarden (PNG) a la memòria i a IndexedDB per a la vegada següent.
  const VER_IC = 'ic2';   // canvia-ho si canvia el dibuix de les icones (així no es reaprofiten les velles)
  const memIc = new Map();
  let magatzem = null;    // {agafa(k), posa(k, v)}: el posa app.js (IndexedDB)
  const posaMagatzem = (m) => { magatzem = m; };
  function hashText(t) { let h = 5381; const pas = Math.max(1, Math.floor(t.length / 4000)); for (let i = 0; i < t.length; i += pas) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36) + '.' + t.length; }
  function clauIcona(estil, paquet, original, plena) {
    const e = ESTILS[estil];
    const ek = e && e.personal ? 'P' + hashText(JSON.stringify(e.personal)) : estil;
    return `${VER_IC}|${ek}|${paquet}|${plena ? 1 : 0}|${original ? hashText(original) : ''}`;
  }
  function iconaBytes(estil, paquet, original, plena) {
    const k = clauIcona(estil, paquet, original, plena);
    let pr = memIc.get(k);   // es guarda la promesa: si ja s'està fent (d'amagat), s'espera la mateixa feina
    if (pr) return pr;
    pr = (async () => {
      let b = null;
      if (magatzem) { try { b = await magatzem.agafa(k); } catch { b = null; } }
      if (b) return b;
      b = await aBytes(await icona(estil, paquet, original, plena));
      if (magatzem) Promise.resolve(magatzem.posa(k, b)).catch(() => {});
      return b;
    })();
    memIc.set(k, pr);
    pr.catch(() => memIc.delete(k));
    return pr;
  }
  /** Les icones que porta el tema: les del catàleg i (si cal) les originals de les apps del telèfon */
  function iconesAFer(o) {
    const r = [];
    for (const a of o.apps || []) {
      const plena = !!(o.plenes && a.icona);
      if (!g.CATALEG[a.paquet] && !(o.originals && a.icona) && !plena) continue;
      r.push({ paquet: a.paquet, original: (o.originals || plena) ? a.icona : null, plena });
    }
    return r;
  }
  /** Prepara les icones d'amagat. o: {estil, apps, originals, plenes}; atura() → true per parar (l'usuari ha canviat d'estil) */
  async function preparaIcones(o, atura) {
    let n = 0;
    for (const a of iconesAFer(o)) {
      if (atura && atura()) return n;
      const k = clauIcona(o.estil, a.paquet, a.original, a.plena);
      if (!memIc.has(k)) { await iconaBytes(o.estil, a.paquet, a.original, a.plena); await new Promise((r) => setTimeout(r)); }
      n++;
    }
    return n;
  }

  /** Afegeix (o substitueix) un estil fet per l'usuari */
  function registraEstil(id, nom, cfg) {
    ESTILS[id] = { nom, forma: cfg.forma, gruix: 2.3, color: true, fons: 'Falco', personal: cfg };
  }
  function treuEstil(id) { delete ESTILS[id]; }

  /** Icones per a apps sense icona al tema (MIUI posa fons + icona retallada + vora) */
  function iconesFallback(estil) {
    const n = S * K, e = ESTILS[estil];
    const metall = e.marc || (e.personal && e.personal.marc !== 'cap' && e.personal.marc);
    if (metall) {   // estils amb marc: MIUI posa l'anell (icon_border) damunt de la icona original retallada (icon_mask)
      const { anell, int } = anellMarc(n, e.forma, { metall, prim: e.prim || metall === 'bronze' });
      const fonsM = pinta(int, (x, w, h) => degradat(x, w, h, P.FONS3, P.FONS));
      const buit = tela(n);
      return { 'icon_background.png': redueix(fonsM), 'icon_mask.png': redueix(int), 'icon_border.png': redueix(anell), 'icon_pattern.png': redueix(buit) };
    }
    let fons;
    if (e.personal) {
      const c = e.personal.fons === 'app' ? '#4A6085' : e.personal.c1;
      fons = pinta(forma(n, e.forma, n * 0.04), (x, w, h) => degradat(x, w, h, c, e.personal.fons === 'degradat' ? e.personal.c2 : c, true));
    } else fons = fonsXoriguer(e.color ? 'Pissarra' : estil, n);
    const masc = forma(n, e.forma, n * 0.20);
    const buit = tela(n);
    return { 'icon_background.png': redueix(fons), 'icon_mask.png': redueix(masc), 'icon_border.png': redueix(buit), 'icon_pattern.png': redueix(buit) };
  }

  // ------------------------------------------------------------ fons de pantalla
  function resplendor(x, cx, cy, r, col, forca) {
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
    gr.addColorStop(0, rgba(col, forca)); gr.addColorStop(0.45, rgba(col, forca * 0.6)); gr.addColorStop(1, rgba(col, 0));
    x.fillStyle = gr; x.fillRect(0, 0, x.canvas.width, x.canvas.height);
  }
  const OR = [[0, [0xA8, 0x72, 0x0E]], [0.18, [0xF0, 0xB8, 0x2A]], [0.34, [0xFF, 0xF2, 0xA8]], [0.48, [0xFF, 0xC8, 0x3C]],
    [0.62, [0xC8, 0x8E, 0x14]], [0.78, [0xFF, 0xD8, 0x5A]], [0.90, [0xFF, 0xF6, 0xC8]], [1, [0xD0, 0x96, 0x1E]]];
  function colorOr(t) {
    for (let i = 0; i < OR.length - 1; i++) if (t <= OR[i + 1][0]) return barreja(OR[i][1], OR[i + 1][1], (t - OR[i][0]) / (OR[i + 1][0] - OR[i][0]));
    return OR[OR.length - 1][1];
  }
  /** Converteix un logo en or polit amb relleu, conservant el detall */
  function daurat(img) {
    const w = img.width, h = img.height;
    const c = tela(w, h), x = ctx2(c); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h), px = d.data;
    const lut = []; for (let i = 0; i < 256; i++) lut.push(colorOr(i / 255));
    const ang = 35 * Math.PI / 180, cs = Math.cos(ang), sn = Math.sin(ang);
    const mn = Math.min(0, w * cs, h * sn, w * cs + h * sn), mx = Math.max(0, w * cs, h * sn, w * cs + h * sn);
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const i = (y * w + xx) * 4; if (!px[i + 3]) continue;
      const l = 185 + (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) * 70 / 255;
      const col = lut[Math.round(((xx * cs + y * sn) - mn) / (mx - mn) * 255)];
      px[i] = col[0] * l / 255; px[i + 1] = col[1] * l / 255; px[i + 2] = col[2] * l / 255;
    }
    x.putImageData(d, 0, 0);
    // bisell
    const r = Math.max(2, Math.round(w / 260));
    const sil = pinta(img, '#fff');
    const suau = tela(w, h), xs = ctx2(suau); xs.filter = `blur(${r}px)`; xs.drawImage(sil, 0, 0);
    for (const [dx, col, op] of [[r, [255, 250, 225], 0.85], [-r, [70, 45, 5], 0.7]]) {
      const b = tela(w, h), xb = ctx2(b);
      xb.drawImage(suau, 0, 0);
      xb.globalCompositeOperation = 'destination-out'; xb.drawImage(suau, dx, dx);
      xb.globalCompositeOperation = 'destination-in'; xb.drawImage(sil, 0, 0);
      const pb = pinta(b, rgb(col)); const xp = ctx2(pb);
      x.globalAlpha = op; x.globalCompositeOperation = 'source-atop'; x.drawImage(pb, 0, 0);
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; void xp;
    }
    return c;
  }
  function dauratITaronja(img) {
    const out = daurat(img);
    const w = img.width, h = img.height;
    const c = tela(w, h), x = ctx2(c); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]);
      const s = mx ? (mx - mn) * 255 / mx : 0;
      if (!(s >= 80 && mx >= 90)) px[i + 3] = 0;
    }
    x.putImageData(d, 0, 0);
    ctx2(out).drawImage(c, 0, 0);
    return out;
  }

  const FONS = {
    Pissarra: 'Pissarra', Taronja: 'Posta de sol', Crema: 'Corbes', Falco: 'Xoriguer',
    Logotip: 'Logotip', FalcoOr: "Xoriguer d'or", LogotipOr: "Logotip d'or", LogotipOrTaronja: 'Or i taronja',
  };
  const LOGOS = {
    Falco: 'Xoriguer', Logotip: 'Logotip', Simbol: 'Xoriguer amb roda', FalcoOr: "Xoriguer d'or",
    LogotipOr: "Logotip d'or", LogotipOrTaronja: 'Or i taronja',
  };
  /** Fons fets per l'usuari: id -> {base:'degradat'|'foto', c1, c2, foto (Image), logo: clau de LOGOS o 'cap', aura} */
  const PERSONALS = {};
  /** Fons de sèrie que es poden fer servir de base (sense logo) amb un logo a triar */
  const BASES = ['Falco', 'FalcoOr', 'Pissarra', 'Taronja', 'Crema'];
  function registraFons(id, nom, cfg) { PERSONALS[id] = cfg; FONS[id] = nom; }
  function treuFons(id) { delete PERSONALS[id]; delete FONS[id]; }

  /** Dibuixa el logo (amb aura i ombra). o: {dyInici, dyBloq, escala} = posició (fracció de l'alçada) i mida. */
  async function dibuixaLogo(x, variant, W, H, bloqueig, o, aura) {
    const u = W / 1080;
    const falco = variant.startsWith('Falco'), simbol = variant === 'Simbol';
    const src = simbol ? 'img/logos/simbol.png' : falco ? 'img/logos/falco.png' : 'img/logos/logotip.png';
    const esc = Math.max(0.3, Math.min(1.6, (o && o.escala) || 1));
    let logo = encaixa(await carregaImatge(src), W * (falco ? 0.86 : simbol ? 0.80 : 0.78) * esc);
    const or_ = variant.includes('Or');
    if (variant === 'LogotipOrTaronja') logo = dauratITaronja(logo);
    else if (or_) logo = daurat(logo);
    else {   // colors més vius
      const v = tela(logo.width, logo.height), xv = ctx2(v);
      xv.filter = 'saturate(1.3) contrast(1.08)'; xv.drawImage(logo, 0, 0); logo = v;
    }
    const dy = (bloqueig ? 0.08 + ((o && o.dyBloq) || 0) : -0.06 + ((o && o.dyInici) || 0));
    const capa = tela(W, H); centra(capa, logo, H * dy);
    if (aura !== false) {   // aura de llum darrere el logo perquè ressalti
      x.save(); x.globalAlpha = 0.55; x.filter = `blur(${Math.round(W / 30)}px)`;
      x.drawImage(pinta(capa, or_ ? '#FFC84A' : '#FF8A00'), 0, 0); x.restore();
    }
    x.drawImage(ombra(capa, 18 * u, 0.55, 12 * u), 0, 0);
    x.drawImage(capa, 0, 0);
  }

  /** o: {dyInici, dyBloq, escala} (posició i mida del logo) */
  async function fons(estil, W, H, bloqueig, o) {
    o = o || {};
    const c = tela(W, H), x = ctx2(c), u = W / 1080;
    const pers = PERSONALS[estil];
    if (pers) {
      // la pantalla de bloqueig pot tenir el seu fons (baseB/fotoB, 'igual' = el de l'inici) i el seu logo (logoB)
      const propi = bloqueig && pers.baseB && pers.baseB !== 'igual';
      const base = propi ? pers.baseB : pers.base, foto = propi ? pers.fotoB : pers.foto;
      const logo = bloqueig && pers.logoB !== undefined ? pers.logoB : (bloqueig && pers.logoBloq === false ? 'cap' : pers.logo);
      if (BASES.includes(base)) {   // un fons de sèrie, sense el seu logo
        x.drawImage(await fons(base, W, H, bloqueig, { ...o, senseLogo: true }), 0, 0);
      } else if (base === 'foto' && foto) {   // la foto omple la pantalla (retallada al centre)
        const r = Math.max(W / foto.width, H / foto.height);
        x.imageSmoothingQuality = 'high';
        x.drawImage(foto, (W - foto.width * r) / 2, (H - foto.height * r) / 2, foto.width * r, foto.height * r);
      } else {
        x.fillStyle = degradat(x, W, H, pers.c1 || P.FONS_A, pers.c2 || P.FONS_B); x.fillRect(0, 0, W, H);
      }
      if (!o.senseLogo && logo && logo !== 'cap') await dibuixaLogo(x, logo, W, H, bloqueig, o, pers.aura !== false);
      return c;
    }
    if (estil.startsWith('Falco') || estil.startsWith('Logotip')) {
      x.fillStyle = degradat(x, W, H, P.FONS_A, P.FONS_B); x.fillRect(0, 0, W, H);
      const or_ = estil.includes('Or');
      resplendor(x, W / 2, H * 0.52, 650 * u, or_ ? [0xE8, 0xB8, 0x4A] : hex2rgb(P.TAR_B), or_ ? 0.10 : 0.18);
      resplendor(x, W * 0.1, H * 0.08, 600 * u, [0x3A, 0x55, 0x7A], 0.35);
      if (!o.senseLogo) await dibuixaLogo(x, estil, W, H, bloqueig, o);
      return c;
    }
    const simbol = await carregaImatge('img/logos/simbol.png');
    const esc = Math.max(0.3, Math.min(1.6, o.escala || 1));
    const dB = H * (o.dyBloq || 0), dI = H * (o.dyInici || 0);
    if (estil === 'Pissarra') {
      x.fillStyle = degradat(x, W, H, P.FONS_A, P.FONS_B); x.fillRect(0, 0, W, H);
      resplendor(x, W * 0.95, H * 0.95, 700 * u, hex2rgb(P.TAR_B), 0.14);
      resplendor(x, W * 0.1, H * 0.15, 700 * u, [0x3A, 0x55, 0x7A], 0.35);
      if (o.senseLogo) { /* sense logo */ } else if (bloqueig) centra(c, encaixa(simbol, W * 0.78 * esc), H * 0.17 + dB);
      else { x.globalAlpha = 0.16; x.drawImage(encaixa(simbol, W * 1.25 * esc), W * 0.05, H * 0.60 + dI); x.globalAlpha = 1; }
    } else if (estil === 'Taronja') {
      x.fillStyle = degradat(x, W, H, '#223146', '#2C3448'); x.fillRect(0, 0, W, H);
      if (bloqueig) {
        resplendor(x, W / 2, H * 1.02, 1500 * u, hex2rgb(P.TAR_B), 0.95);
        resplendor(x, W / 2, H * 0.95, 900 * u, hex2rgb(P.TAR_A), 0.75);
      } else {
        resplendor(x, W / 2, H * 1.10, 900 * u, hex2rgb(P.TAR_B), 0.45);
        resplendor(x, W * 0.1, -H * 0.05, 600 * u, hex2rgb(P.TAR_A), 0.18);
      }
      if (!o.senseLogo) {
        const sil = pinta(encaixa(simbol, W * (bloqueig ? 0.80 : 0.95) * esc), P.CREMA);
        x.globalAlpha = bloqueig ? 0.92 : 0.22;
        if (bloqueig) centra(c, sil, H * 0.10 + dB); else x.drawImage(sil, (W - sil.width) / 2, H * 0.30 + dI);
        x.globalAlpha = 1;
      }
    } else {  // Crema: corbes
      x.fillStyle = degradat(x, W, H, P.FONS3, P.FONS_B); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) {
        const r = (350 + i * 75) * u;
        x.beginPath(); x.arc(W + 100 * u, H - 150 * u, r, 0, Math.PI * 2);
        x.strokeStyle = i % 4 ? 'rgba(246,239,226,0.16)' : 'rgba(255,168,46,0.47)';
        x.lineWidth = 2.5 * u; x.stroke();
      }
      const s = encaixa(simbol, W * (bloqueig ? 0.70 : 0.55) * esc);
      if (o.senseLogo) { /* sense logo */ } else if (bloqueig) centra(c, s, H * 0.15 + dB);
      else { x.globalAlpha = 0.18; x.drawImage(pinta(s, P.CREMA), W * 0.08, H * 0.08 + dI); x.globalAlpha = 1; }
    }
    return c;
  }

  // ------------------------------------------------------------ previsualització
  const MOSTRA = ['com.whatsapp', 'org.telegram.messenger', 'com.google.android.gm', 'com.google.android.youtube',
    'com.google.android.apps.maps', 'com.android.chrome', 'com.google.android.dialer', 'com.android.camera',
    'com.miui.gallery', 'com.android.settings', 'com.miui.calculator', 'com.miui.notes',
    'cat.xoriguer.aparcament', 'cat.xoriguer.trucades', 'cat.xoriguer.temps', 'cat.xoriguer.pdf'];

  async function previa(fonsCanvas, icones) {   // icones: paquet -> PNG (bytes)
    const W = fonsCanvas.width, H = fonsCanvas.height;
    const c = tela(W, H), x = ctx2(c); x.drawImage(fonsCanvas, 0, 0);
    const noms = MOSTRA.filter((p) => icones[p]).concat(Object.keys(icones).filter((p) => !MOSTRA.includes(p))).slice(0, 20);
    const col = 4, mida = W * 0.178, marge = (W - col * mida) / (col + 1);
    const imgs = await Promise.all(noms.map((p) => createImageBitmap(new Blob([icones[p]], { type: 'image/png' }))));
    imgs.forEach((im, i) => x.drawImage(im, marge + (i % col) * (mida + marge), H * 0.11 + Math.floor(i / col) * (mida + marge * 1.6), mida, mida));
    return c;
  }

  // ------------------------------------------------------------ sistema
  function themeValues(colors, pal) {
    const v = { f: pal.fons, t: pal.targeta, a: pal.accent };
    const l = ['<?xml version="1.0" encoding="utf-8"?>', '<MIUI_Theme_Values>'];
    for (const [n, r] of Object.entries(colors)) {
      const c = v[r] || r;
      l.push(`    <color name="${n}">#ff${c.replace('#', '').slice(-6).toLowerCase()}</color>`);
    }
    l.push('</MIUI_Theme_Values>', '');
    return l.join('\n');
  }

  // ------------------------------------------------------------ Centre de control
  /** c: {on, segon, off ('com_ara'|color), icona, barra, rellotge} (colors #RRGGBB) -> {nom_recurs: '#aarrggbb'} */
  const argb = (h, a) => '#' + (a || 'ff') + h.replace('#', '').slice(-6).toLowerCase();
  function colorsCentre(c) {
    const r = {
      qs_card_enabled_color: argb(c.on), qs_enabled_color: argb(c.on), control_center_universal_enabled_color: argb(c.on),
      qs_card_cellular_color: argb(c.segon), qs_card_flashlight_color: argb(c.segon),
      qs_icon_enabled_color: argb(c.icona), qs_tile_icon_enabled_color: argb(c.icona), control_center_universal_icon_color: argb(c.icona),
      toggle_slider_progress_color: argb(c.barra),
      header_clock_text_color: argb(c.rellotge), header_date_text_color: argb(c.rellotge, 'bb'),
    };
    if (c.off && c.off !== 'com_ara') {
      for (const n of ['qs_card_disabled_color', 'qs_disabled_color', 'control_center_universal_disabled_color']) r[n] = argb(c.off, 'cc');
    }
    if (lluminositat(hex2rgb(c.on)) > 170) {   // botons clars: text fosc perquè es llegeixi
      r.qs_card_primary_text_enabled_color = argb(P.FONS); r.qs_card_secondary_text_enabled_color = argb(P.FONS, 'cc');
    }
    return r;
  }
  function themeValuesDirectes(colors) {
    return ['<?xml version="1.0" encoding="utf-8"?>', '<MIUI_Theme_Values>',
      ...Object.entries(colors).map(([n, c]) => `    <color name="${n}">${c}</color>`), '</MIUI_Theme_Values>', ''].join('\n');
  }
  /** Dibuix aproximat del Centre de control amb aquests colors (vista prèvia) */
  function previaCentre(c, w, h, fonsCanvas) {
    const cv = tela(w, h), x = ctx2(cv), u = w / 432;
    if (fonsCanvas) { x.filter = `blur(${Math.round(14 * u)}px)`; x.drawImage(fonsCanvas, 0, 0, w, h); x.filter = 'none'; }
    else { x.fillStyle = degradat(x, w, h, P.FONS_A, P.FONS_B); x.fillRect(0, 0, w, h); }
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(0, 0, w, h);
    x.fillStyle = c.rellotge; x.font = `300 ${54 * u}px Roboto, "Segoe UI", sans-serif`; x.fillText('8:03', 34 * u, 150 * u);
    x.globalAlpha = 0.75; x.font = `${17 * u}px Roboto, "Segoe UI", sans-serif`; x.fillText('Dg, 22 nov', 150 * u, 142 * u); x.globalAlpha = 1;
    const offCol = c.off && c.off !== 'com_ara' ? rgba(hex2rgb(c.off), 0.8) : 'rgba(255,255,255,0.15)';
    const card = (y, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(34 * u, y * u, 174 * u, 96 * u, 22 * u); x.fill(); };
    card(178, c.on); card(292, c.segon);
    const tx = lluminositat(hex2rgb(c.on)) > 170 ? P.FONS : '#FFFFFF';
    x.fillStyle = tx; x.font = `600 ${16 * u}px Roboto, "Segoe UI", sans-serif`; x.fillText('Wi‑Fi', 96 * u, 222 * u);
    x.fillStyle = lluminositat(hex2rgb(c.segon)) > 170 ? P.FONS : '#FFFFFF'; x.fillText('Dades', 96 * u, 336 * u);
    for (const [cx, p] of [[224, 0.55], [320, 0.12]]) {   // barres verticals
      x.fillStyle = 'rgba(255,255,255,0.15)'; x.beginPath(); x.roundRect(cx * u, 178 * u, 78 * u, 210 * u, 22 * u); x.fill();
      x.save(); x.beginPath(); x.roundRect(cx * u, 178 * u, 78 * u, 210 * u, 22 * u); x.clip();
      x.fillStyle = c.barra; x.fillRect(cx * u, (178 + 210 * (1 - p)) * u, 78 * u, 210 * p * u); x.restore();
    }
    const on = [1, 0, 1, 0, 0, 0, 0, 1];
    for (let i = 0; i < 8; i++) {
      const cx = (70 + (i % 4) * 96) * u, cy = (446 + Math.floor(i / 4) * 116) * u;
      x.fillStyle = on[i] ? c.on : offCol; x.beginPath(); x.arc(cx, cy, 36 * u, 0, Math.PI * 2); x.fill();
      x.fillStyle = on[i] ? c.icona : '#FFFFFF'; x.beginPath(); x.arc(cx, cy, 11 * u, 0, Math.PI * 2); x.fill();
    }
    return cv;
  }

  // ------------------------------------------------------------ pantalla de bloqueig pròpia (MAML) amb rellotge
  // Provat al Mi 10T Lite: component «lockscreen» amb advance/manifest.xml; el rellotge són imatges num_0..9 + num_dot.
  const RELLOTGES = { taronja: 'Taronja', crema: 'Crema', or: 'Or', contorn: 'Contorn', fi: 'Fi', luxeOr: 'Luxe daurat', luxePlata: 'Luxe platejat' };
  /** Com és cada rellotge. lletra: gruixuda|normal|fina|classica|maquina; ompli: color|degradat|or|plata|contorn;
   *  c1, c2 (degradat), sep (':' '·' ''), cp (color del separador, '' = com els números), vora + cv, cd (color de la data) */
  const RL_CFG = {
    taronja: { lletra: 'gruixuda', ompli: 'degradat', c1: P.TAR_A, c2: P.TAR_B, sep: ':', cp: '', cd: P.CREMA },
    crema: { lletra: 'gruixuda', ompli: 'color', c1: P.CREMA, sep: ':', cp: P.TAR_A, cd: P.CREMA },
    or: { lletra: 'gruixuda', ompli: 'or', sep: ':', cp: '', cd: P.CREMA },
    contorn: { lletra: 'gruixuda', ompli: 'contorn', c1: P.CREMA, sep: ':', cp: P.TAR_A, cd: P.CREMA },
    fi: { lletra: 'fina', ompli: 'color', c1: P.CREMA, sep: ':', cp: P.TAR_A, cd: P.CREMA },
    // rellotges d'agulles «de luxe»: esfera metàl·lica amb centre de carboni; les agulles giren (MAML rotation)
    luxeOr: { tipus: 'agulles', metall: 'or', cd: '#F4E3B5' },
    luxePlata: { tipus: 'agulles', metall: 'plata', cd: '#E8ECF0' },
  };
  const esAgulles = (estil) => cfgRellotge(estil).tipus === 'agulles';
  const PROPIS_RL = {};
  function registraRellotge(id, nom, cfg) { RELLOTGES[id] = nom; RL_CFG[id] = cfg; PROPIS_RL[id] = true; }
  function treuRellotge(id) { delete RELLOTGES[id]; delete RL_CFG[id]; delete PROPIS_RL[id]; }
  const cfgRellotge = (estil) => RL_CFG[estil] || RL_CFG.taronja;
  const LLETRES = {
    gruixuda: (m) => `${m}px XtMontserrat, "Montserrat", sans-serif`,
    normal: (m) => `500 ${m}px Roboto, "Segoe UI", sans-serif`,
    fina: (m) => `200 ${m}px "Segoe UI Light", "Roboto Light", "Roboto", sans-serif`,
    classica: (m) => `700 ${m}px Georgia, "Noto Serif", serif`,
    maquina: (m) => `500 ${m}px "Roboto Mono", Consolas, "Droid Sans Mono", monospace`,
  };
  let fontRellotge = null;
  async function carregaFont() {
    if (fontRellotge) return fontRellotge;
    try { const f = new FontFace('XtMontserrat', "url('marca/Montserrat-ExtraBold.ttf')"); await f.load(); document.fonts.add(f); } catch { /* de reserva */ }
    fontRellotge = true; return true;
  }
  /** Imatges dels números (1080 d'amplada de referència). r: {estil, escala} -> {dig:[canvas x10], dos:canvas, w, h, wd} */
  async function xifres(r) {
    await carregaFont();
    const cfg = cfgRellotge(r.estil);
    const mida = Math.round(300 * (r.escala || 1));
    const font = (LLETRES[cfg.lletra] || LLETRES.gruixuda)(mida);
    const mesura = tela(10).getContext('2d'); mesura.font = font;
    const wd = Math.ceil(Math.max(...[...'0123456789'].map((d) => mesura.measureText(d).width))) + Math.round(mida * 0.08);
    const sep = cfg.sep == null ? ':' : cfg.sep;
    const h = Math.round(mida * 1.12), wc = Math.round(mida * (sep ? 0.36 : 0.14));
    const gruix = Math.max(3, mida / 45);
    const fa = (t, w) => {
      const c = tela(w, h), x = ctx2(c);
      if (!t) return c;
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      const y = Math.round(mida * 0.98);
      const propi = t === sep && cfg.cp;   // el separador amb un color seu
      if (cfg.ompli === 'contorn') {
        x.lineWidth = gruix; x.strokeStyle = propi ? cfg.cp : (cfg.c1 || P.CREMA); x.strokeText(t, w / 2, y);
        return c;
      }
      x.fillStyle = '#fff'; x.fillText(t, w / 2, y);
      let o;
      if (propi) o = pinta(c, cfg.cp);
      else if (cfg.ompli === 'degradat') o = pinta(c, (xx, W2, H2) => degradat(xx, W2, H2, cfg.c1 || P.TAR_A, cfg.c2 || P.TAR_B));
      else if (cfg.ompli === 'or') o = daurat(c);
      else if (cfg.ompli === 'plata') o = pinta(c, (xx, W2, H2) => { const g = xx.createLinearGradient(0, 0, W2 * 0.5, H2); for (const [s, col] of METALLS.plata) g.addColorStop(s, rgb(col)); return g; });
      else o = pinta(c, cfg.c1 || P.CREMA);
      if (cfg.vora) {   // vora per fora: el traç gruixut a sota i els números a sobre
        const v = tela(w, h), xv = ctx2(v);
        xv.font = font; xv.textAlign = 'center'; xv.lineJoin = 'round'; xv.lineWidth = gruix * 2.4; xv.strokeStyle = cfg.cv || P.TAR_B;
        xv.strokeText(t, w / 2, y); xv.drawImage(o, 0, 0);
        return v;
      }
      return o;
    };
    const dig = [...'0123456789'].map((d) => fa(d, wd));
    return { dig, dos: fa(sep, wc), wd, wc, h, cd: cfg.cd || P.CREMA };
  }
  // ---------- rellotge d'agulles de luxe
  const aMetall = (x, x0, y0, x1, y1, metall) => { const g = x.createLinearGradient(x0, y0, x1, y1); for (const [t, c] of METALLS[metall] || METALLS.or) g.addColorStop(t, rgb(c)); return g; };
  const memoAgulles = new Map();
  /** Esfera (D×D) i agulles (imatges apuntant amunt, amb el punt de gir px,py). r: {estil, escala, data} */
  async function agulles(r) {
    const cfg = cfgRellotge(r.estil), D = Math.max(200, Math.round(760 * (r.escala || 1)));
    const clau = `${r.estil}|${D}|${r.data ? 1 : 0}|${cfg.metall}`;
    if (memoAgulles.has(clau)) return memoAgulles.get(clau);
    const m = cfg.metall || 'or', c = D / 2, R = D * 0.47;
    const dial = tela(D), x = ctx2(dial);
    const cercle = (rr, fill) => { x.beginPath(); x.arc(c, c, rr, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
    // ombra i bisell exterior
    x.save(); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = D * 0.03; x.shadowOffsetY = D * 0.012; cercle(R, '#000'); x.restore();
    cercle(R, aMetall(x, c - R, c - R, c + R, c + R, m));
    cercle(R * 0.955, aMetall(x, c + R, c + R, c - R, c - R, m));   // segon bisell (llum al revés)
    // anell negre amb les marques dels minuts
    cercle(R * 0.90, '#121418');
    x.save(); x.translate(c, c);
    for (let i = 0; i < 60; i++) {
      const gran = i % 5 === 0;
      x.save(); x.rotate(i * Math.PI / 30);
      x.fillStyle = gran ? aMetall(x, 0, -R * 0.9, 0, -R * 0.8, m) : 'rgba(230,215,180,0.55)';
      if (gran) x.fillRect(-R * 0.018, -R * 0.885, R * 0.036, R * 0.07); else x.fillRect(-R * 0.005, -R * 0.875, R * 0.01, R * 0.04);
      x.restore();
    }
    x.restore();
    // esfera de carboni (quadrets) amb vinyeta
    x.save(); x.beginPath(); x.arc(c, c, R * 0.80, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#1B1F26'; x.fillRect(0, 0, D, D);
    const q = Math.max(4, Math.round(D / 90));
    for (let yy = 0; yy < D; yy += q) for (let xx = 0; xx < D; xx += q) {
      if (((xx / q) + (yy / q)) % 2 === 0) { x.fillStyle = 'rgba(255,255,255,0.035)'; x.fillRect(xx, yy, q, q / 2); }
      else { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(xx, yy + q / 2, q, q / 2); }
    }
    const vg = x.createRadialGradient(c, c - R * 0.3, R * 0.1, c, c, R * 0.8);
    vg.addColorStop(0, 'rgba(70,90,120,0.28)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    x.fillStyle = vg; x.fillRect(0, 0, D, D);
    x.restore();
    x.beginPath(); x.arc(c, c, R * 0.80, 0, Math.PI * 2); x.lineWidth = R * 0.02; x.strokeStyle = aMetall(x, c - R, c - R, c + R, c + R, m); x.stroke();
    // índexs aplicats (barres metàl·liques); a les 3 i les 9 hi ha les finestres de la data
    x.save(); x.translate(c, c);
    for (let h = 0; h < 12; h++) {
      if (r.data && (h === 3 || h === 9)) continue;
      x.save(); x.rotate(h * Math.PI / 6);
      const w = R * (h === 0 ? 0.05 : 0.035), l = R * (h === 0 ? 0.17 : 0.13);
      x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = R * 0.02; x.shadowOffsetY = R * 0.01;
      x.fillStyle = aMetall(x, -w, -R * 0.75, w, -R * 0.6, m);
      if (h === 0) { x.fillRect(-w * 1.3, -R * 0.75, w, l); x.fillRect(w * 0.3, -R * 0.75, w, l); } else x.fillRect(-w / 2, -R * 0.75, w, l);
      x.restore();
    }
    x.restore();
    // anell interior i logo Xoriguer
    x.beginPath(); x.arc(c, c, R * 0.42, 0, Math.PI * 2); x.lineWidth = R * 0.008; x.strokeStyle = 'rgba(230,200,140,0.35)'; x.stroke();
    try {
      const lg = encaixa(await carregaImatge('img/logos/falco.png'), R * 0.42);
      const ld = m === 'or' ? daurat(lg) : pinta(lg, (xx, w, h) => aMetall(xx, 0, 0, w, h, 'plata'));
      x.drawImage(ld, c - ld.width / 2, c - R * 0.43 - ld.height / 2);
    } catch { /* sense logo */ }
    // finestres de la data (el text el posa MAML)
    const caixes = [];
    if (r.data) {
      for (const cx of [c - R * 0.47, c + R * 0.47]) {
        const w = R * 0.34, h = R * 0.15, bx = cx - w / 2, by = c - h / 2;
        x.beginPath(); x.roundRect(bx, by, w, h, h * 0.2); x.fillStyle = '#0D0F12'; x.fill();
        x.lineWidth = R * 0.012; x.strokeStyle = aMetall(x, bx, by, bx + w, by + h, m); x.stroke();
        caixes.push({ cx, cy: c, w, h });
      }
    }
    // agulles
    const agulla = (llarg, cua, ample, fes) => {
      const p = Math.ceil(R * 0.04), w = Math.ceil(ample + 2 * p), h = Math.ceil(llarg + cua + 2 * p);
      const t = tela(w, h), xt = ctx2(t), px = w / 2, py = p + llarg;
      xt.save(); xt.shadowColor = 'rgba(0,0,0,0.55)'; xt.shadowBlur = p * 0.8; xt.shadowOffsetY = p * 0.4;
      fes(xt, px, py); xt.restore();
      return { img: t, px, py };
    };
    const baton = (llarg, cua, ample) => agulla(llarg, cua, ample, (xt, px, py) => {
      xt.beginPath(); xt.moveTo(px, py - llarg); xt.lineTo(px + ample / 2, py - llarg * 0.82); xt.lineTo(px + ample / 2, py + cua);
      xt.lineTo(px - ample / 2, py + cua); xt.lineTo(px - ample / 2, py - llarg * 0.82); xt.closePath();
      xt.fillStyle = aMetall(xt, px - ample, py - llarg, px + ample, py, m); xt.fill();
      xt.shadowColor = 'transparent';
      xt.fillStyle = 'rgba(15,18,22,0.85)'; xt.fillRect(px - ample * 0.18, py - llarg * 0.78, ample * 0.36, llarg * 0.62);
      xt.fillStyle = 'rgba(246,239,226,0.9)'; xt.fillRect(px - ample * 0.1, py - llarg * 0.74, ample * 0.2, llarg * 0.5);
    });
    const hora = baton(R * 0.46, R * 0.1, R * 0.085), minut = baton(R * 0.68, R * 0.12, R * 0.065);
    const segon = agulla(R * 0.74, R * 0.22, R * 0.11, (xt, px, py) => {
      xt.fillStyle = P.TAR_B; xt.fillRect(px - R * 0.007, py - R * 0.74, R * 0.014, R * 0.96);
      xt.beginPath(); xt.arc(px, py + R * 0.16, R * 0.035, 0, Math.PI * 2); xt.fill();
      xt.beginPath(); xt.arc(px, py, R * 0.05, 0, Math.PI * 2); xt.fillStyle = aMetall(xt, px - R * 0.05, py - R * 0.05, px + R * 0.05, py + R * 0.05, m); xt.fill();
      xt.beginPath(); xt.arc(px, py, R * 0.02, 0, Math.PI * 2); xt.fillStyle = P.TAR_B; xt.fill();
    });
    const o = { tipus: 'agulles', D, dial, hora, minut, segon, caixes, R, cd: cfg.cd || P.CREMA };
    memoAgulles.set(clau, o);
    return o;
  }
  /** Peces del rellotge: xifres (digital) o esfera i agulles. Retorna també l'amplada T i l'alçada h del rellotge. */
  async function peces(r) {
    if (esAgulles(r.estil)) { const a = await agulles(r); return { ...a, T: a.D, h: a.D }; }
    const xf = await xifres(r); return { ...xf, T: 4 * xf.wd + xf.wc };
  }
  /** Posicions (en coordenades de 1080 d'amplada). alinea 'lliure' fa servir r.cx (centre, 0..1). */
  function lloc(r, xf) {
    const T = xf.T;
    const x0 = r.alinea === 'esquerra' ? 70 : r.alinea === 'dreta' ? 1010 - T
      : r.alinea === 'lliure' ? Math.round(Math.max(0, Math.min(1080 - T, 1080 * (r.cx == null ? 0.5 : r.cx) - T / 2))) : Math.round(540 - T / 2);
    if (xf.tipus === 'agulles') return { T, x0 };
    return { T, x0, xs: [x0, x0 + xf.wd, x0 + 2 * xf.wd + xf.wc, x0 + 3 * xf.wd + xf.wc], xd: x0 + 2 * xf.wd };
  }
  const xData = (r, L) => (r.alinea === 'esquerra' ? L.x0 + 10 : r.alinea === 'dreta' ? L.x0 + L.T - 10 : L.x0 + L.T / 2);
  const alinData = (r) => (r.alinea === 'esquerra' ? 'left' : r.alinea === 'dreta' ? 'right' : 'center');
  /** Caixa del rellotge en coordenades de 1080 d'amplada (per arrossegar-lo a la vista prèvia) */
  async function caixaRellotge(r) { const xf = await peces(r), L = lloc(r, xf); return { x: L.x0, w: L.T, h: xf.h + (xf.tipus !== 'agulles' && r.data ? 80 : 0) }; }
  /** Dibuixa l'esfera i les agulles a (x0,y0) amb escala k a l'hora donada */
  function pintaAgulles(x, a, x0, y0, k, ara) {
    x.drawImage(a.dial, x0, y0, a.D * k, a.D * k);
    const c = a.D / 2, h = ara.getHours() % 12, mi = ara.getMinutes(), s = ara.getSeconds();
    if (a.caixes.length) {
      x.fillStyle = a.cd; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `600 ${a.R * 0.095 * k}px Roboto, "Segoe UI", sans-serif`;
      x.fillText(String(ara.getDate()), x0 + a.caixes[0].cx * k, y0 + a.caixes[0].cy * k);
      x.fillText(ara.toLocaleDateString(undefined, { weekday: 'short' }).replace('.', ''), x0 + a.caixes[1].cx * k, y0 + a.caixes[1].cy * k);
      x.textBaseline = 'alphabetic';
    }
    for (const [ag, graus] of [[a.hora, h * 30 + mi / 2], [a.minut, mi * 6 + s / 10], [a.segon, s * 6]]) {
      x.save(); x.translate(x0 + c * k, y0 + c * k); x.rotate(graus * Math.PI / 180);
      x.drawImage(ag.img, -ag.px * k, -ag.py * k, ag.img.width * k, ag.img.height * k); x.restore();
    }
  }
  /** Dibuixa el rellotge (hora actual) a sobre d'un fons de bloqueig, per a les vistes prèvies */
  async function dibuixaRellotge(canvas, r) {
    const xf = await peces(r), L = lloc(r, xf), k = canvas.width / 1080, x = ctx2(canvas);
    const ara = new Date(), hh = String(ara.getHours()).padStart(2, '0'), mm = String(ara.getMinutes()).padStart(2, '0');
    const y = canvas.height * (r.posy / 100);
    if (xf.tipus === 'agulles') { pintaAgulles(x, xf, L.x0 * k, y, k, ara); return; }
    const ds = [hh[0], hh[1], mm[0], mm[1]];
    x.save(); x.shadowColor = 'rgba(0,0,0,0.35)'; x.shadowBlur = 12 * k; x.shadowOffsetY = 4 * k;
    ds.forEach((d, i) => x.drawImage(xf.dig[+d], L.xs[i] * k, y, xf.wd * k, xf.h * k));
    x.drawImage(xf.dos, L.xd * k, y, xf.wc * k, xf.h * k);
    x.restore();
    if (r.data) {
      x.fillStyle = xf.cd; x.font = `${46 * k}px Roboto, "Segoe UI", sans-serif`;
      x.textAlign = alinData(r);
      x.fillText(ara.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }), xData(r, L) * k, y + (xf.h + 60) * k);
    }
  }
  /** Mostra petita d'un estil de rellotge («12:45» i la data) sobre fons pissarra */
  async function mostraRellotge(canvas, estil, ambData) {
    const x = ctx2(canvas), W = canvas.width, H = canvas.height;
    x.fillStyle = degradat(x, W, H, P.FONS_A, P.FONS_B); x.fillRect(0, 0, W, H);
    if (esAgulles(estil)) {   // esfera petita a les 10:10
      const a = await agulles({ estil, escala: 0.5, data: true }), k = (H * 0.92) / a.D;
      pintaAgulles(x, a, (W - a.D * k) / 2, H * 0.04, k, new Date(2026, 0, 1, 10, 10, 32));
      return;
    }
    const xf = await xifres({ estil, escala: 1 });
    const T = 4 * xf.wd + xf.wc, alt = ambData ? H * 0.62 : H * 0.8;
    const k = Math.min(W * 0.9 / T, alt / xf.h);
    let x0 = (W - T * k) / 2;
    const y0 = ambData ? H * 0.1 : (H - xf.h * k) / 2;
    for (const [i, d] of [1, 2, 4, 5].entries()) {
      x.drawImage(xf.dig[d], x0, y0, xf.wd * k, xf.h * k); x0 += xf.wd * k;
      if (i === 1) { x.drawImage(xf.dos, x0, y0, xf.wc * k, xf.h * k); x0 += xf.wc * k; }
    }
    if (ambData) {
      x.fillStyle = xf.cd; x.textAlign = 'center'; x.font = `${Math.round(H * 0.11)}px Roboto, "Segoe UI", sans-serif`;
      x.fillText(new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }), W / 2, H * 0.88);
    }
  }
  const escX = (s) => String(s).replace(/[<>&"']/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[m]));
  /** Component «lockscreen». r: {estil, escala, posy, alinea, data, llisca (text), notificacions} */
  async function componentBloqueig(r) {
    const xf = await peces(r), L = lloc(r, xf);
    const ya = '#screen_height*#posy/100';
    const alin = alinData(r), dx = xData(r, L);
    let rellotgeXml, notiY;
    if (xf.tipus === 'agulles') {
      const c = xf.D / 2, cx = L.x0 + c;
      const ag = (nom, a, graus) => `    <Image src="rellotge/${nom}.png" x="${Math.round(cx - a.px)}" y="${ya}+${Math.round(c - a.py)}" pivotX="${Math.round(a.px)}" pivotY="${Math.round(a.py)}" rotation="${graus}"/>`;
      const fd = Math.round(xf.R * 0.095);
      rellotgeXml = [
        `    <Image src="rellotge/esfera.png" x="${L.x0}" y="${ya}"/>`,
        ...xf.caixes.map((b, i) => `    <DateTime align="center" alignV="center" color="${xf.cd}" format="${i ? 'EEE' : 'd'}" size="${fd}" bold="true" x="${Math.round(L.x0 + b.cx)}" y="${ya}+${Math.round(b.cy)}"/>`),
        ag('agulla_h', xf.hora, '(#hour24%12)*30+#minute*0.5'),
        ag('agulla_m', xf.minut, '#minute*6+#second*0.1'),
        ag('agulla_s', xf.segon, '#second*6'),
      ].join('\n');
      notiY = xf.D + 40;
    } else {
      rellotgeXml = `    <Image src="time/num.png" srcid="#hora/10" x="${L.xs[0]}" y="${ya}"/>
    <Image src="time/num.png" srcid="#hora%10" x="${L.xs[1]}" y="${ya}"/>
    <Image src="time/num_dot.png" x="${L.xd}" y="${ya}"/>
    <Image src="time/num.png" srcid="#minute/10" x="${L.xs[2]}" y="${ya}"/>
    <Image src="time/num.png" srcid="#minute%10" x="${L.xs[3]}" y="${ya}"/>
    <DateTime align="${alin}" color="${xf.cd}" format="EEEE, d MMMM" size="46" visibility="#data" x="${dx}" y="${ya}+${xf.h + 20}"/>`;
      notiY = xf.h + 130;
    }
    const man = `<?xml version="1.0" encoding="utf-8"?>
<!-- Xoriguer Temes: pantalla de bloqueig amb rellotge propi -->
<Lockscreen displayDesktop="false" frameRate="60" screenWidth="1080" version="2">
  <VariableBinders>
    <ContentProviderBinder columns="icon,title,content,time,info,subtext,key" countName="hasnotifications" name="data" uri="content://keyguard.notification/notifications">
      <List name="notification_list"/>
    </ContentProviderBinder>
  </VariableBinders>
  <Var name="hora" expression="ifelse(#time_format,#hour24,#hour12,#hour12,12)"/>
  <Wallpaper/>
  <Group x="0" y="#defaultScreen_y">
${rellotgeXml}
    <Group visibility="#hasnotifications" x="0" y="${ya}+${notiY}">
      <List align="center" data="icon:bitmap,title:string,content:string,time:string,info:string,subtext:string,key:int" maxHeight="${220 * 3}" name="notification_list" visibility="#hasnotifications" w="#screen_width" x="540" y="0">
        <Item align="center" h="220" w="940" x="540" y="0">
          <Button alignChildren="true" h="220" w="940" x="0" y="0">
            <Normal><Rectangle alignV="center" cornerRadius="44" fillColor="#E627354A" h="196" w="940" y="98"/></Normal>
            <Pressed><Rectangle alignV="center" cornerRadius="44" fillColor="#FF31405A" h="196" w="940" y="98"/></Pressed>
            <Image align="center" alignV="center" h="64" name="notification_icon" w="64" x="80" y="62"/>
            <Text alignV="center" color="#F6EFE2" h="54" marqueeSpeed="30" name="notification_title" size="42" w="600" x="134" y="62"/>
            <Text alignV="center" color="#B9B2A5" h="48" marqueeSpeed="30" name="notification_content" size="36" w="820" x="50" y="134"/>
            <Text align="right" alignV="center" color="#B9B2A5" name="notification_time" size="34" x="890" y="62"/>
            <Triggers>
              <Trigger action="up">
                <IntentCommand action="com.miui.app.ExtraStatusBarManager.action_remove_keyguard_notification" broadcast="true">
                  <Extra expression="#notification_list.key" name="com.miui.app.ExtraStatusBarManager.extra_notification_key" type="int"/>
                  <Extra expression="#touch_begin_x { 900" name="com.miui.app.ExtraStatusBarManager.extra_notification_click" type="int"/>
                </IntentCommand>
              </Trigger>
            </Triggers>
          </Button>
        </Item>
        <AttrDataBinders>
          <AttrDataBinder attr="bitmap" data="icon" target="notification_icon"/>
          <AttrDataBinder attr="text" data="title" target="notification_title"/>
          <AttrDataBinder attr="text" data="content" target="notification_content"/>
          <AttrDataBinder attr="text" data="time" target="notification_time"/>
        </AttrDataBinders>
      </List>
    </Group>
  </Group>
  <Text align="center" alignV="center" category="Charging" color="#FFA82E" format="%d%%" paras="#battery_level" size="40" x="540" y="#screen_height-200+#defaultScreen_y"/>
  <Text align="center" alignV="center" color="#F6EFE2" size="40" textExp="'${escX(r.llisca || '')}'" x="540" y="#screen_height-120+#defaultScreen_y"/>
  <Var expression="min(#touch_y-#touch_begin_y+50,0)*#desbloq+#tornada" name="defaultScreen_y"/>
  <Var name="tornada">
    <VariableAnimation initPause="true" loop="false">
      <Item time="0" value="0"/>
      <Item easeType="CubicEaseOut" time="100" value="min(#touch_y-#touch_begin_y+50,0)"/>
      <Item time="400" value="0"/>
    </VariableAnimation>
  </Var>
  <Button h="#screen_height" w="1080">
    <Triggers>
      <Trigger action="down"><VariableCommand expression="1" name="desbloq"/></Trigger>
      <Trigger action="up,cancel">
        <VariableCommand expression="0" name="desbloq"/>
        <AnimationCommand command="play" target="tornada" condition="lt(#touch_begin_y-#touch_y,300)"/>
        <ExternCommand command="unlock" condition="ge(#touch_begin_y-#touch_y,300)"/>
      </Trigger>
    </Triggers>
  </Button>
  <!-- botó per ajustar la posició des del mòbil (config.xml) -->
  <Group x="110" y="#screen_height-120+#defaultScreen_y">
    <Image align="center" alignV="center" src="lock/ajust.png"/>
    <Button align="center" alignV="center" h="110" w="110">
      <Triggers>
        <Trigger action="up">
          <IntentCommand action="android.intent.action.MAIN" class="miui.maml.MamlConfigSettings" package="com.android.thememanager">
            <Extra expression="'lockstyle'" name="maml_code" type="string"/>
          </IntentCommand>
          <ExternCommand command="unlock" delay="300"/>
        </Trigger>
      </Triggers>
    </Button>
  </Group>
</Lockscreen>
`;
    const config = `<Config>
  <Group text="${escX(r.textos.grup)}">
    <NumberInput text="${escX(r.textos.posicio)}" summary="${escX(r.textos.resum)}" id="posy" default="${Math.round(r.posy)}"/>
    <CheckBox text="${escX(r.textos.data)}" id="data" default="${r.data ? 1 : 0}"/>
  </Group>
</Config>
`;
    const zl = new g.Zip();
    zl.afegeix('advance/manifest.xml', man);
    zl.afegeix('advance/config.xml', config);
    if (xf.tipus === 'agulles') {
      zl.afegeix('advance/rellotge/esfera.png', await aBytes(xf.dial));
      for (const [n, a] of [['agulla_h', xf.hora], ['agulla_m', xf.minut], ['agulla_s', xf.segon]]) zl.afegeix(`advance/rellotge/${n}.png`, await aBytes(a.img));
    } else {
      for (let d = 0; d < 10; d++) zl.afegeix(`advance/time/num_${d}.png`, await aBytes(xf.dig[d]));
      zl.afegeix('advance/time/num_dot.png', await aBytes(xf.dos));
    }
    // icona d'ajustos (Tabler «adjustments») en crema
    const aj = await carregaImatge(svgURL('<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#F6EFE2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M6 4v4"/><path d="M6 12v8"/><path d="M10 16a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M12 4v10"/><path d="M12 18v2"/><path d="M16 7a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M18 4v1"/><path d="M18 9v11"/></svg>'));
    const ca = tela(72); ctx2(ca).drawImage(aj, 0, 0);
    zl.afegeix('advance/lock/ajust.png', await aBytes(ca));
    return zl.bytes();
  }

  // ------------------------------------------------------------ empaquetar
  // Al WebView d'Android, canvas.toBlob triga ~4 s per imatge (provat al Mi 10T Lite); toDataURL, uns 2 ms.
  const aBytes = async (c, tipus, q) => {
    const u = c.toDataURL(tipus || 'image/png', q);
    const b = atob(u.slice(u.indexOf(',') + 1)), out = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  };
  const esc = (s) => String(s).replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));

  /**
   * Crea el tema. opcions: {estil, fons, W, H, nom, apps:[{paquet, icona?}], sistema:bool,
   *   paleta:{fons, targeta, accent}, progres(f, text)}
   * Retorna {bytes: Uint8Array (.mtz), previa: canvas, bloqueig: canvas}
   */
  /**
   * Indicadors del gestor de temes de MIUI (theme_apply_flags) per aplicar només una part (provat al Mi 10T Lite, MIUI 14):
   * icons 8 · lockstyle 4096 + fons de bloqueig 4 = 4100 (sense el 4, MIUI esborra el fons de bloqueig). -1 = tot el tema.
   * NO: barreges amb el bit 1 (framework, camí del tema sencer): esborren el fons d'inici encara que no hi sigui.
   */
  /** Fons de Configuració: la foto omple la pantalla i s'enfosqueix amb el color de fons (foscor 0..1) perquè el text es llegeixi */
  function imatgeConfiguracio(foto, W, H, foscor, color) {
    const c = tela(W, H), x = ctx2(c), r = Math.max(W / foto.width, H / foto.height);
    x.imageSmoothingQuality = 'high';
    x.drawImage(foto, (W - foto.width * r) / 2, (H - foto.height * r) / 2, foto.width * r, foto.height * r);
    x.globalAlpha = Math.max(0, Math.min(0.9, foscor == null ? 0.55 : foscor)); x.fillStyle = color || P.FONS; x.fillRect(0, 0, W, H);
    return c;
  }

  function flagsParts(p) {
    const n = ['icones', 'fons', 'bloqueig', 'colors'].filter((k) => p[k]);
    if (n.length === 1 && p.icones) return 8;
    if (n.length === 1 && p.bloqueig) return 4100;
    // fons + bloqueig (conserva les icones): el bloqueig amb el tema (4100) i el fons d'inici amb WallpaperManager (TemesPont)
    if (n.length === 2 && p.fons && p.bloqueig) return 4100;
    return -1;
  }

  async function creaTema(o) {
    const prog = o.progres || (() => {});
    const icones = {};
    const parts = Object.assign({ icones: true, fons: true, bloqueig: true, colors: true }, o.parts || {});
    // plenes: a les icones amb marc, la icona original de cada app (si la tenim) omple l'interior
    // iconesPropies: el component «icons» del tema que l'usuari ja té al telèfon (Windows, adb): no se'n dibuixa cap
    const llista = parts.icones && !o.iconesPropies ? iconesAFer(o) : [];
    for (let i = 0; i < llista.length; i++) {   // les ja preparades surten de la memòria a l'instant
      const a = llista[i];
      icones[a.paquet] = await iconaBytes(o.estil, a.paquet, a.original, a.plena);
      if (i % 8 === 0) { prog(0.05 + 0.6 * i / llista.length, 'icones'); await new Promise((r) => setTimeout(r)); }
    }
    prog(0.68, 'fons');
    const inici = await fons(o.fons, o.W, o.H, false, o.fonsOpcions);
    const bloq = await fons(o.fons, o.W, o.H, true, o.fonsOpcions);
    const prev = await previa(inici, icones);
    let bloqPrevia = bloq;   // la vista prèvia porta el rellotge; el fons de pantalla, no
    if (o.rellotge) { bloqPrevia = tela(bloq.width, bloq.height); ctx2(bloqPrevia).drawImage(bloq, 0, 0); await dibuixaRellotge(bloqPrevia, o.rellotge); }
    prog(0.85, 'paquet');

    const zi = new g.Zip();
    zi.afegeix('transform_config.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<IconTransform>\n    <Config name="SupportLayerIcon" value="false" />\n    <Config name="UseDynamicIcon" value="false" />\n</IconTransform>\n');
    for (const [p, b] of Object.entries(icones)) zi.afegeix(`res/drawable-xxhdpi/${p}.png`, b);
    for (const [n, c] of Object.entries(iconesFallback(o.estil))) zi.afegeix(`res/drawable-xxhdpi/${n}`, await aBytes(c));

    const z = new g.Zip();
    z.afegeix('description.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<theme>\n    <title>${esc(o.nom)}</title>\n    <designer>Xoriguer</designer>\n    <author>Xoriguer Temes</author>\n    <version>1.0</version>\n    <uiVersion>14</uiVersion>\n    <description>${esc(o.descripcio || '')}</description>\n</theme>\n`);
    if (parts.icones) z.afegeix('icons', o.iconesPropies || zi.bytes());
    if (parts.colors && o.sistema && g.SISTEMA) {
      const pal = o.paleta;
      const quadrat = {};
      for (const [rol, col] of [['f', pal.fons], ['t', pal.targeta]]) {
        const q = tela(16), xq = ctx2(q); xq.fillStyle = col; xq.fillRect(0, 0, 16, 16);
        quadrat[rol] = await aBytes(q);
      }
      // imatge de fons a Configuració (totes les pantalles: Wi‑Fi, Bluetooth...): substitueix el fons de la finestra
      const imgConf = o.config && o.config.foto ? await aBytes(imatgeConfiguracio(o.config.foto, o.W, o.H, o.config.foscor, pal.fons)) : null;
      for (const [paq, d] of Object.entries(g.SISTEMA)) {
        const zc = new g.Zip();
        const tv = themeValues(d.c, pal);
        for (const pre of ['', 'nightmode/']) {
          zc.afegeix(pre + 'theme_values.xml', tv);
          for (const [nom, rol] of Object.entries(d.d)) zc.afegeix(`${pre}res/drawable-xxhdpi/${nom}.png`, imgConf && paq === 'com.android.settings' && rol === 'f' ? imgConf : quadrat[rol]);
        }
        z.afegeix(paq, zc.bytes());
      }
    }
    if (parts.colors && o.centre) {   // Centre de control de MIUI 14 (miui.systemui.plugin): provat al Mi 10T Lite
      const zc = new g.Zip(), tv = themeValuesDirectes(colorsCentre(o.centre));
      zc.afegeix('theme_values.xml', tv); zc.afegeix('nightmode/theme_values.xml', tv);
      z.afegeix('miui.systemui.plugin', zc.bytes());
    }
    if (parts.bloqueig && o.rellotge) {   // pantalla de bloqueig pròpia amb el rellotge Xoriguer
      z.afegeix('lockscreen', await componentBloqueig(o.rellotge));
      z.afegeix('plugin_config.xml', '<?xml version="1.0" encoding="utf-8"?>\n<PluginConfig>\n  <lockscreen/>\n</PluginConfig>\n');
    }
    if (parts.fons) z.afegeix('wallpaper/default_wallpaper.jpg', await aBytes(inici, 'image/jpeg', 0.9));
    // la pantalla de bloqueig pròpia necessita el seu fons (si no, MIUI el treu en aplicar-la)
    if (parts.fons || parts.bloqueig) z.afegeix('wallpaper/default_lock_wallpaper.jpg', await aBytes(bloq, 'image/jpeg', 0.9));
    const mitja = (c) => { const m = tela(Math.round(c.width / 2), Math.round(c.height / 2)); ctx2(m).drawImage(c, 0, 0, m.width, m.height); return m; };
    z.afegeix('preview/preview_icons_0.jpg', await aBytes(mitja(prev), 'image/jpeg', 0.85));
    z.afegeix('preview/preview_launcher_0.jpg', await aBytes(mitja(prev), 'image/jpeg', 0.85));
    z.afegeix('preview/preview_lockscreen_0.jpg', await aBytes(mitja(bloqPrevia), 'image/jpeg', 0.85));
    prog(1, 'fet');
    const fonsInici = parts.fons ? await aBytes(inici, 'image/jpeg', 0.92) : null;   // per posar-lo a part (WallpaperManager)
    return { bytes: z.bytes(), previa: prev, bloqueig: bloqPrevia, icones: Object.keys(icones).length, fonsInici };
  }

  g.Motor = { ESTILS, FONS, LOGOS, BASES, flagsParts, imatgeConfiguracio, preparaIcones, posaMagatzem, VER_IC, P, S, icona, fons, creaTema, carregaImatge, colorApp, registraEstil, treuEstil, registraFons, treuFons, previaCentre, RELLOTGES, dibuixaRellotge,
    registraRellotge, treuRellotge, mostraRellotge, PROPIS_RL, caixaRellotge, esAgulles };
})(window);
