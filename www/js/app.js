/* Xoriguer Temes — interfície. */
'use strict';
(function () {
  const VERSIO = '1.3.0';
  const URL_VERSIO = 'https://xoriguer.dev/versions/temes/versio.json';
  const $ = (s) => document.querySelector(s);
  const T_ = (s, v) => I18N.t(s, v);
  const M = window.Motor;
  const escH = (s) => String(s).replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));
  const llegeix = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const escriu = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* res */ } };

  const PAL_FONS = [
    { id: 'pissarra', nom: 'Pissarra', fons: '#1E2A3B', targeta: '#27354A' },
    { id: 'nit', nom: 'Blau nit', fons: '#172338', targeta: '#22314B' },
    { id: 'grafit', nom: 'Grafit', fons: '#262B33', targeta: '#323843' },
    { id: 'bosc', nom: 'Bosc', fons: '#1C2B28', targeta: '#263A35' },
    { id: 'pruna', nom: 'Pruna', fons: '#2A2236', targeta: '#372D46' },
  ];
  const PAL_ACCENT = [
    { id: 'taronja', nom: 'Taronja', c: '#FFA82E' }, { id: 'or', nom: 'Or', c: '#E0B34A' },
    { id: 'blau', nom: 'Blau', c: '#40AAE6' }, { id: 'verd', nom: 'Verd', c: '#4CC38A' },
    { id: 'rosa', nom: 'Rosa', c: '#EC6A9A' }, { id: 'lila', nom: 'Lila', c: '#9C7BEA' },
  ];
  const MOSTRES = ['#1E2A3B', '#27354A', '#41506A', '#F6EFE2', '#FFFFFF', '#FFA82E', '#F2650F', '#E0B34A', '#E53935',
    '#EC407A', '#8E24AA', '#3949AB', '#1E88E5', '#00ACC1', '#43A047', '#7CB342', '#6D4C41'];
  const LLENGUES = [['', 'Automàtic'], ['ca', 'Català'], ['es', 'Español'], ['fr', 'Français'], ['en', 'English']];

  const desat = llegeix('xt-opcions', {});
  const E = {
    estil: desat.estil || 'Color3D', fons: desat.fons || 'LogotipOrTaronja',
    palFons: desat.palFons || 'pissarra', accent: desat.accent || 'taronja',
    model: desat.model || 'M2007J17G',
    dyInici: desat.dyInici || 0, dyBloq: desat.dyBloq || 0, escala: desat.escala || 1,
    W: 1080, H: 2400, apps: null, info: null, resultat: null,
    cc: Object.assign({ on: '#FFA82E', segon: '#F2650F', off: 'com_ara', icona: '#FFFFFF', barra: '#FFA82E', rellotge: '#F6EFE2' }, desat.cc || {}),
  };
  function guarda() {
    escriu('xt-opcions', { estil: E.estil, fons: E.fons, palFons: E.palFons, accent: E.accent, model: E.model, cc: E.cc,
      dyInici: E.dyInici, dyBloq: E.dyBloq, escala: E.escala, llengua: desat.llengua || '', senseCarpeta: desat.senseCarpeta });
  }

  // ------------------------------------------------------------ Centre de control
  let ccGen = 0;
  async function pintaPreviaCentre() {
    const meu = ++ccGen;
    const f = await M.fons(M.FONS[E.fons] ? E.fons : 'LogotipOrTaronja', 216, Math.round(216 * E.H / E.W), false, opcionsFons());
    if (meu !== ccGen) return;
    const c = $('#previa-centre');
    c.getContext('2d').drawImage(M.previaCentre(E.cc, c.width, c.height, f), 0, 0);
  }
  function pintaCentre() {
    const canvia = (k) => (v) => { E.cc[k] = v; guarda(); pintaPreviaCentre(); };
    const posa = (sel, node) => { const d = $(sel); d.innerHTML = ''; d.append(node); };
    posa('#cc-on', mostres(E.cc.on, canvia('on')));
    posa('#cc-segon', mostres(E.cc.segon, canvia('segon')));
    posa('#cc-off', segment([['com_ara', 'Transparents (com ara)'], ['#31405A', 'Pissarra'], ['#1E2A3B', 'Pissarra fosc']], E.cc.off, canvia('off')));
    posa('#cc-icona', segment([['#FFFFFF', 'Blanc'], ['#F6EFE2', 'Crema'], ['#1E2A3B', 'Pissarra']], E.cc.icona, canvia('icona')));
    posa('#cc-barra', mostres(E.cc.barra, canvia('barra')));
    posa('#cc-rellotge', mostres(E.cc.rellotge, canvia('rellotge')));
    $('#centre').onchange = () => { $('#centre-opcions').hidden = !$('#centre').checked; };
    pintaPreviaCentre();
  }
  const opcionsFons = () => ({ dyInici: E.dyInici, dyBloq: E.dyBloq, escala: E.escala });

  // ------------------------------------------------------------ fotos dels fons propis (IndexedDB)
  const IDB = {
    db: null,
    obre() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((ok, ko) => {
        const r = indexedDB.open('xoriguer-temes', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('fotos');
        r.onsuccess = () => { this.db = r.result; ok(this.db); };
        r.onerror = () => ko(r.error);
      });
    },
    async op(mode, f) {
      const db = await this.obre();
      return new Promise((ok, ko) => { const t = db.transaction('fotos', mode); const r = f(t.objectStore('fotos')); t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error); });
    },
    posa(k, v) { return this.op('readwrite', (s) => s.put(v, k)); },
    agafa(k) { return this.op('readonly', (s) => s.get(k)); },
    treu(k) { return this.op('readwrite', (s) => s.delete(k)); },
  };
  const imatgeDe = (blob) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(blob); });

  // ------------------------------------------------------------ estils i fons propis
  let estilsPropis = llegeix('xt-estils', []);   // [{id, nom, cfg}]
  let fonsPropis = llegeix('xt-fons', []);        // [{id, nom, cfg}] (la foto és a IndexedDB amb la mateixa id)
  function registraEstils() { for (const e of estilsPropis) M.registraEstil(e.id, e.nom, e.cfg); }
  async function registraFonsPropis() {
    for (const f of fonsPropis) {
      let foto = null;
      if (f.cfg.base === 'foto') { try { const b = await IDB.agafa(f.id); if (b) foto = await imatgeDe(b); } catch { /* res */ } }
      M.registraFons(f.id, f.nom, { ...f.cfg, foto });
    }
  }

  // ------------------------------------------------------------ finestra
  function obreModal(titol, omple, botons) {
    $('#modal-titol').textContent = titol;
    const cos = $('#modal-cos'); cos.innerHTML = ''; omple(cos);
    const peu = $('#modal-peu'); peu.innerHTML = '';
    for (const b of botons || []) {
      const el = document.createElement('button');
      el.className = b.classe || 'sec'; el.textContent = b.text; el.onclick = b.fes;
      peu.append(el);
    }
    $('#modal').hidden = false;
  }
  const tancaModal = () => { $('#modal').hidden = true; };
  const el = (tag, attrs, fills) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) { if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v); }
    for (const f of fills || []) e.append(f);
    return e;
  };
  function segment(opcions, valor, canvia) {
    const d = el('div', { class: 'segment' });
    for (const [v, t] of opcions) {
      const b = el('button', { text: T_(t), class: v === valor ? 'sel' : '' });
      b.onclick = () => { d.querySelectorAll('button').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); canvia(v); };
      d.append(b);
    }
    return d;
  }
  function mostres(valor, canvia) {
    const d = el('div', { class: 'mostres' });
    const marca = (v) => d.querySelectorAll('.mostra').forEach((x) => x.classList.toggle('sel', x.dataset.c === v));
    for (const c of MOSTRES) {
      const b = el('button', { class: 'mostra', 'aria-label': c, 'data-c': c, style: `background:${c}` });
      b.onclick = () => { marca(c); canvia(c); };
      d.append(b);
    }
    const inp = el('input', { type: 'color', hidden: '' });
    const altre = el('button', { class: 'mostra altre', 'aria-label': T_('Un altre color') });
    altre.onclick = () => { inp.value = valor || '#FFA82E'; inp.click(); };
    inp.oninput = () => { marca(''); altre.style.background = inp.value; canvia(inp.value.toUpperCase()); };
    d.append(altre, inp);
    marca(valor);
    if (valor && !MOSTRES.includes(valor)) { altre.style.background = valor; altre.classList.add('sel'); }
    return d;
  }
  const bloc = (titol, ...fills) => el('div', { class: 'bloc' }, [el('h4', { text: T_(titol) }), ...fills]);

  // ------------------------------------------------------------ telèfon i model
  function nomModel() {
    if (E.model === 'detectat' && E.info && E.info.connectat) return `${E.info.nom || E.info.model} (${T_('aquest telèfon')})`;
    if (E.model === 'altre') return T_('Un altre (escriu la resolució)');
    const m = window.MODELS.find((x) => x.id === E.model);
    return m ? m.nom : window.MODELS[0].nom;
  }
  function aplicaModel() {
    if (E.model === 'detectat' && !(E.info && E.info.connectat)) E.model = window.MODELS[0].id;
    if (E.model === 'detectat') { E.W = E.info.W; E.H = E.info.H; }
    else if (E.model !== 'altre') { const m = window.MODELS.find((x) => x.id === E.model) || window.MODELS[0]; E.model = m.id; E.W = m.w; E.H = m.h; }
    $('#nom-model').textContent = nomModel();
    $('#amp').value = E.W; $('#alc').value = E.H;
    $('#amp').disabled = $('#alc').disabled = E.model !== 'altre';
    pintaFons();
  }
  function triaModel() {
    obreModal(T_('Model del telèfon'), (cos) => {
      const cerca = el('input', { type: 'text', class: 'cerca', placeholder: T_('Busca el model…') });
      const llista = el('div', { class: 'llista' });
      const items = [];
      if (E.info && E.info.connectat) items.push({ id: 'detectat', nom: `${E.info.nom || E.info.model}`, sub: `${T_('aquest telèfon')} · ${E.info.W}×${E.info.H}` });
      for (const m of window.MODELS) items.push({ id: m.id, nom: m.nom, sub: `${m.w}×${m.h}` });
      items.push({ id: 'altre', nom: T_('Un altre (escriu la resolució)'), sub: '' });
      const pinta = () => {
        const q = cerca.value.toLowerCase().trim();
        llista.innerHTML = '';
        for (const it of items.filter((i) => !q || i.nom.toLowerCase().includes(q))) {
          const b = el('button', { class: it.id === E.model ? 'sel' : '', html: `${escH(it.nom)}${it.sub ? `<small>${escH(it.sub)}</small>` : ''}` });
          b.onclick = () => { E.model = it.id; guarda(); tancaModal(); aplicaModel(); };
          llista.append(b);
        }
      };
      cerca.oninput = pinta; pinta();
      cos.append(cerca, llista);
    });
  }

  async function buscaTelefon() {
    const est = $('#estat-tlf');
    est.className = 'estat'; est.textContent = T_('Buscant el telèfon…');
    try { E.info = await Plat.info(); } catch (e) { E.info = { connectat: false, missatge: String(e.message || e) }; }
    const i = E.info;
    if (i.connectat) {
      est.className = 'estat ok';
      est.innerHTML = `<b>${escH(i.nom || i.model)}</b> · ${i.W}×${i.H}${i.miui ? ' · ' + escH(i.miui) : ''}`;
      $('#ajuda-usb').hidden = true;
      try { E.apps = await Plat.apps(); } catch { E.apps = null; }
      if (E.apps) est.innerHTML += ` · ${T_('{n} apps', { n: E.apps.length })}`;
      if (i.avis) est.innerHTML += `<br><span class="suau petit">${escH(T_(i.avis))}</span>`;
      if (!desat.model || desat.model === 'detectat') E.model = 'detectat';
    } else if (Plat.tipus === 'windows') {
      est.className = 'estat avis';
      est.textContent = i.sensAdb ? T_("No trobo les eines d'Android (adb) en aquest ordinador.")
        : i.noAutoritzat ? T_('El telèfon és connectat però no ha autoritzat aquest ordinador: mira el mòbil i accepta la depuració USB.')
          : T_('No hi ha cap telèfon connectat. Pots triar el model a mà i desar el tema.');
      $('#ajuda-usb').hidden = false;
      $('#b-adb').hidden = !i.sensAdb;
    } else {
      est.className = 'estat avis';
      est.textContent = T_('Tria el model del teu telèfon. El tema es descarregarà com a fitxer .mtz.');
    }
    $('#l-originals').hidden = !(E.apps && E.apps.some((a) => a.icona));
    $('#l-plenes').hidden = $('#l-originals').hidden;
    $('#b-aplica').hidden = !(Plat.potAplicar && i.connectat);
    aplicaModel();
  }

  // ------------------------------------------------------------ estils d'icones
  const MOSTRA = ['com.whatsapp', 'org.telegram.messenger', 'cat.xoriguer.aparcament', 'com.google.android.gm'];
  async function pintaMostra(c, estil) {
    const x = c.getContext('2d'); x.fillStyle = '#1E2A3B'; x.fillRect(0, 0, c.width, c.height);
    const m = (c.width - 16) / 4;
    await Promise.all(MOSTRA.map(async (p, i) => { const ic = await M.icona(estil, p); x.drawImage(ic, 8 + i * m, (c.height - (m - 8)) / 2, m - 8, m - 8); }));
  }
  function pintaEstils() {
    const cont = $('#estils');
    cont.innerHTML = '';
    for (const [id, e] of Object.entries(M.ESTILS)) {
      const b = el('div', { class: 'opcio' + (id === E.estil ? ' sel' : ''), role: 'button', tabindex: '0' });
      const c = el('canvas', { width: '400', height: '110' });
      b.append(c, el('span', { text: e.personal ? e.nom : T_(e.nom) }));
      b.onclick = () => {
        E.estil = id; if (!e.personal) E.fons = e.fons; guarda();
        cont.querySelectorAll('.opcio').forEach((o) => o.classList.remove('sel')); b.classList.add('sel'); pintaFons();
      };
      if (e.personal) {
        const ed = el('button', { class: 'edita', 'aria-label': T_('Edita'), text: '✎' });
        ed.onclick = (ev) => { ev.stopPropagation(); editaEstil(estilsPropis.find((x) => x.id === id)); };
        b.append(ed);
      }
      cont.append(b);
      pintaMostra(c, id);
    }
    const nou = el('button', { class: 'opcio nou' }, [el('b', { text: '+' }), el('span', { text: T_('Nou estil') })]);
    nou.onclick = () => editaEstil(null);
    cont.append(nou);
  }

  function editaEstil(existent) {
    const id = existent ? existent.id : 'P' + Date.now().toString(36);
    const cfg = existent ? { ...existent.cfg } : { forma: 'squircle', fons: 'app', c1: '#1E2A3B', c2: '#41506A', glif: 'blanc', cg: '#FFA82E', vora: false, relleu: true, marc: 'cap', mida: 0.54 };
    let nom = existent ? existent.nom : T_('El meu estil');
    const previa = el('canvas', { class: 'previa-editor', width: '400', height: '110' });
    const prova = 'P_prova';
    let pend = null;
    const refresca = () => { clearTimeout(pend); pend = setTimeout(() => { M.registraEstil(prova, nom, { ...cfg }); pintaMostra(previa, prova); }, 60); };
    obreModal(existent ? T_('Edita l’estil') : T_('Nou estil d’icones'), (cos) => {
      const nomInp = el('input', { type: 'text', value: nom, maxlength: '30' }); nomInp.oninput = () => { nom = nomInp.value; };
      const blocColorFons = el('div');
      const pintaColorsFons = () => {
        blocColorFons.innerHTML = '';
        if (cfg.fons === 'color' || cfg.fons === 'degradat') blocColorFons.append(mostres(cfg.c1, (c) => { cfg.c1 = c; refresca(); }));
        if (cfg.fons === 'degradat') { blocColorFons.append(el('div', { style: 'height:8px' })); blocColorFons.append(mostres(cfg.c2, (c) => { cfg.c2 = c; refresca(); })); }
      };
      const blocColorGlif = el('div');
      const pintaColorGlif = () => { blocColorGlif.innerHTML = ''; if (cfg.glif === 'color') blocColorGlif.append(mostres(cfg.cg, (c) => { cfg.cg = c; refresca(); })); };
      const chk = (txt, clau) => {
        const i = el('input', { type: 'checkbox' }); i.checked = !!cfg[clau]; i.onchange = () => { cfg[clau] = i.checked; refresca(); };
        return el('label', { class: 'check' }, [i, el('span', { text: T_(txt) })]);
      };
      const mida = el('input', { type: 'range', min: '40', max: '70', step: '1', value: String(Math.round(cfg.mida * 100)) });
      mida.oninput = () => { cfg.mida = +mida.value / 100; refresca(); };
      cos.append(previa,
        bloc('Nom', nomInp),
        bloc('Forma', segment([['squircle', 'Arrodonida'], ['cercle', 'Rodona'], ['quadrat', 'Quadrada']], cfg.forma, (v) => { cfg.forma = v; refresca(); })),
        bloc('Fons de la icona', segment([['app', 'Color de cada app'], ['color', 'Un color'], ['degradat', 'Degradat']], cfg.fons, (v) => { cfg.fons = v; pintaColorsFons(); refresca(); }), el('div', { style: 'height:8px' }), blocColorFons),
        bloc('Dibuix', segment([['blanc', 'Blanc'], ['app', 'Color de cada app'], ['color', 'Un color']], cfg.glif, (v) => { cfg.glif = v; pintaColorGlif(); refresca(); }), el('div', { style: 'height:8px' }), blocColorGlif),
        bloc('Marc metàl·lic', segment([['cap', 'Sense marc'], ['or', 'Daurat'], ['plata', 'Platejat']], cfg.marc || 'cap', (v) => { cfg.marc = v; refresca(); })),
        bloc('Acabat', chk('Relleu 3D (brillantor i ombra)', 'relleu'), chk('Vora de color', 'vora')),
        bloc('Mida del dibuix', mida));
      pintaColorsFons(); pintaColorGlif(); refresca();
    }, [
      { text: T_('Desa'), classe: 'princ', fes: () => {
        M.treuEstil(prova);
        const reg = { id, nom: nom.trim() || T_('El meu estil'), cfg };
        estilsPropis = estilsPropis.filter((x) => x.id !== id).concat(reg);
        escriu('xt-estils', estilsPropis);
        M.registraEstil(id, reg.nom, cfg); E.estil = id; guarda(); tancaModal(); pintaEstils();
      } },
      ...(existent ? [{ text: T_('Esborra'), fes: () => {
        estilsPropis = estilsPropis.filter((x) => x.id !== id); escriu('xt-estils', estilsPropis);
        M.treuEstil(id); M.treuEstil(prova); if (E.estil === id) E.estil = 'Color3D'; guarda(); tancaModal(); pintaEstils();
      } }] : []),
      { text: T_('Cancel·la'), fes: () => { M.treuEstil(prova); tancaModal(); } },
    ]);
  }

  // ------------------------------------------------------------ fons
  let fonsGen = 0, fonsTemps = null;
  function pintaFons() {
    clearTimeout(fonsTemps);
    fonsTemps = setTimeout(pintaFonsAra, 80);
  }
  async function pintaFonsAra() {
    const meu = ++fonsGen;
    const cont = $('#fons');
    cont.innerHTML = '';
    const w = 160, h = Math.round(160 * E.H / E.W);
    for (const [id, nom] of Object.entries(M.FONS)) {
      const propi = fonsPropis.find((x) => x.id === id);
      const b = el('div', { class: 'opcio' + (id === E.fons ? ' sel' : ''), role: 'button', tabindex: '0' });
      const c = el('canvas', { width: String(w), height: String(h) });
      b.append(c, el('span', { text: propi ? nom : T_(nom) }));
      b.onclick = () => { E.fons = id; guarda(); cont.querySelectorAll('.opcio').forEach((o) => o.classList.remove('sel')); b.classList.add('sel'); pintaPreviaFons(); };
      if (propi) {
        const ed = el('button', { class: 'edita', 'aria-label': T_('Edita'), text: '✎' });
        ed.onclick = (ev) => { ev.stopPropagation(); editaFons(propi); };
        b.append(ed);
      }
      cont.append(b);
      M.fons(id, w, h, true, opcionsFons()).then((f) => { if (meu === fonsGen) c.getContext('2d').drawImage(f, 0, 0); });
    }
    const nou = el('button', { class: 'opcio nou' }, [el('b', { text: '+' }), el('span', { text: T_('Nou fons') })]);
    nou.onclick = () => editaFons(null);
    cont.append(nou);
    pintaPreviaFons();
  }
  let previaGen = 0;
  async function pintaPreviaFons() {
    const meu = ++previaGen;
    if ($('#previa-centre')) pintaPreviaCentre();
    const cont = $('#previa-fons');
    const w = 150, h = Math.round(150 * E.H / E.W);
    const [a, b] = await Promise.all([M.fons(E.fons, w, h, false, opcionsFons()), M.fons(E.fons, w, h, true, opcionsFons())]);
    if (meu !== previaGen) return;
    cont.innerHTML = '';
    for (const [f, t] of [[a, 'Inici'], [b, 'Bloqueig']]) {
      const c = el('canvas', { width: String(w), height: String(h) }); c.getContext('2d').drawImage(f, 0, 0);
      cont.append(el('figure', {}, [c, el('figcaption', { text: T_(t) })]));
    }
  }
  function lligaLliscadors() {
    const pinta = () => {
      const t = (v) => { const n = -Math.round(v * 100); return (n > 0 ? '+' : '') + n; };   // + = amunt
      $('#o-inici').textContent = t(E.dyInici);
      $('#o-bloq').textContent = t(E.dyBloq);
      $('#o-escala').textContent = Math.round(E.escala * 100) + '%';
    };
    // amunt = valor positiu al lliscador (més natural), però el desplaçament a la imatge és negatiu
    $('#dy-inici').value = String(-Math.round(E.dyInici * 100));
    $('#dy-bloq').value = String(-Math.round(E.dyBloq * 100));
    $('#escala').value = String(Math.round(E.escala * 100));
    $('#dy-inici').oninput = () => { E.dyInici = -$('#dy-inici').value / 100; pinta(); guarda(); pintaFons(); };
    $('#dy-bloq').oninput = () => { E.dyBloq = -$('#dy-bloq').value / 100; pinta(); guarda(); pintaFons(); };
    $('#escala').oninput = () => { E.escala = $('#escala').value / 100; pinta(); guarda(); pintaFons(); };
    $('#b-reinicia').onclick = () => { E.dyInici = 0; E.dyBloq = 0; E.escala = 1; guarda(); lligaLliscadors(); pintaFons(); };
    pinta();
  }

  function editaFons(existent) {
    const id = existent ? existent.id : 'F' + Date.now().toString(36);
    const cfg = existent ? { ...existent.cfg } : { base: 'degradat', c1: '#24344A', c2: '#1A2533', logo: 'LogotipOrTaronja', aura: true };
    let nom = existent ? existent.nom : T_('El meu fons');
    let foto = null, fotoBlob = null;
    const prova = 'F_prova';
    const w = 150, h = Math.round(150 * E.H / E.W);
    const pv = el('div', { class: 'previes-mini' });
    let pend = null;
    const refresca = () => {
      clearTimeout(pend);
      pend = setTimeout(async () => {
        M.registraFons(prova, nom, { ...cfg, foto });
        const [a, b] = await Promise.all([M.fons(prova, w, h, false, opcionsFons()), M.fons(prova, w, h, true, opcionsFons())]);
        pv.innerHTML = '';
        for (const f of [a, b]) { const c = el('canvas', { width: String(w), height: String(h) }); c.getContext('2d').drawImage(f, 0, 0); pv.append(c); }
      }, 80);
    };
    const carregaFoto = async () => {
      if (existent && cfg.base === 'foto') { try { const bl = await IDB.agafa(id); if (bl) { fotoBlob = bl; foto = await imatgeDe(bl); } } catch { /* res */ } }
      refresca();
    };
    obreModal(existent ? T_('Edita el fons') : T_('Nou fons de pantalla'), (cos) => {
      const nomInp = el('input', { type: 'text', value: nom, maxlength: '30' }); nomInp.oninput = () => { nom = nomInp.value; };
      const blocBase = el('div');
      const pintaBase = () => {
        blocBase.innerHTML = '';
        if (cfg.base === 'foto') {
          const b = el('button', { class: 'sec', text: foto ? T_('Canvia la foto') : T_('Tria una foto') });
          b.onclick = () => {
            const inp = $('#tria-foto'); inp.value = '';
            inp.onchange = async () => {
              const f = inp.files && inp.files[0]; if (!f) return;
              fotoBlob = f; foto = await imatgeDe(f); pintaBase(); refresca();
            };
            inp.click();
          };
          blocBase.append(b);
        } else {
          blocBase.append(mostres(cfg.c1, (c) => { cfg.c1 = c; refresca(); }), el('div', { style: 'height:8px' }), mostres(cfg.c2, (c) => { cfg.c2 = c; refresca(); }));
        }
      };
      const aura = el('input', { type: 'checkbox' }); aura.checked = cfg.aura !== false; aura.onchange = () => { cfg.aura = aura.checked; refresca(); };
      cos.append(pv,
        bloc('Nom', nomInp),
        bloc('Fons', segment([['degradat', 'Degradat de dos colors'], ['foto', 'Una foto meva']], cfg.base, (v) => { cfg.base = v; pintaBase(); refresca(); }), el('div', { style: 'height:8px' }), blocBase),
        bloc('Logo', segment([['cap', 'Sense logo'], ...Object.entries(M.LOGOS)], cfg.logo, (v) => { cfg.logo = v; refresca(); }),
          el('label', { class: 'check' }, [aura, el('span', { text: T_('Aura de llum al voltant del logo') })])));
      pintaBase(); carregaFoto();
    }, [
      { text: T_('Desa'), classe: 'princ', fes: async () => {
        if (cfg.base === 'foto' && !foto) { alert(T_('Tria una foto')); return; }
        M.treuFons(prova);
        const reg = { id, nom: nom.trim() || T_('El meu fons'), cfg };
        if (cfg.base === 'foto' && fotoBlob) { try { await IDB.posa(id, fotoBlob); } catch (e) { alert(String(e)); return; } }
        fonsPropis = fonsPropis.filter((x) => x.id !== id).concat(reg);
        escriu('xt-fons', fonsPropis);
        M.registraFons(id, reg.nom, { ...cfg, foto });
        E.fons = id; guarda(); tancaModal(); pintaFons();
      } },
      ...(existent ? [{ text: T_('Esborra'), fes: async () => {
        fonsPropis = fonsPropis.filter((x) => x.id !== id); escriu('xt-fons', fonsPropis);
        try { await IDB.treu(id); } catch { /* res */ }
        M.treuFons(id); M.treuFons(prova); if (E.fons === id) E.fons = 'LogotipOrTaronja'; guarda(); tancaModal(); pintaFons();
      } }] : []),
      { text: T_('Cancel·la'), fes: () => { M.treuFons(prova); tancaModal(); } },
    ]);
  }

  // ------------------------------------------------------------ xips del sistema
  function pintaXips(sel, llista, clau, mostra) {
    const cont = $(sel);
    cont.innerHTML = '';
    for (const p of llista) {
      const b = el('button', { class: 'xip' + (p.id === E[clau] ? ' sel' : ''), html: `<i style="background:${mostra(p)}"></i><span>${escH(T_(p.nom))}</span>` });
      b.onclick = () => { E[clau] = p.id; guarda(); pintaXips(sel, llista, clau, mostra); };
      cont.append(b);
    }
  }

  // ------------------------------------------------------------ opcions: idioma, quant a, actualitzacions
  const mesNova = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  function opcions() {
    obreModal(T_('Opcions'), (cos) => {
      cos.append(bloc('Idioma', segment(LLENGUES, desat.llengua || '', (v) => { desat.llengua = v; guarda(); location.reload(); })));
      const estat = el('div', { class: 'estat', text: T_('Tens la versió {v}.', { v: VERSIO }) });
      const accions = el('div', { class: 'botons' });
      const busca = el('button', { class: 'princ', text: T_('Busca actualitzacions') });
      busca.onclick = async () => {
        busca.disabled = true; estat.className = 'estat'; estat.textContent = T_('Buscant…');
        try {
          const v = JSON.parse(await Plat.busca(URL_VERSIO));
          if (mesNova(v.versio, VERSIO)) {
            estat.className = 'estat avis';
            estat.textContent = T_('Hi ha una versió nova: {v}.', { v: v.versio });
            const url = Plat.tipus === 'android' ? v.apk : Plat.tipus === 'windows' ? v.url : 'https://xoriguer.dev/';
            const baixa = el('button', { class: 'princ', text: T_('Baixa la versió {v}', { v: v.versio }) });
            baixa.onclick = () => Plat.obreUrl(url);
            accions.innerHTML = ''; accions.append(baixa);
          } else { estat.className = 'estat ok'; estat.textContent = T_('Ja tens la darrera versió ({v}).', { v: VERSIO }); }
        } catch (e) { estat.className = 'estat avis'; estat.textContent = T_("No s'ha pogut comprovar: {e}", { e: e.message || e }); }
        busca.disabled = false;
      };
      accions.append(busca);
      cos.append(bloc('Actualitzacions', estat, accions));
      const web = el('button', { class: 'sec', text: 'xoriguer.dev' }); web.onclick = () => Plat.obreUrl('https://xoriguer.dev/');
      const codi = el('button', { class: 'sec', text: 'GitHub' }); codi.onclick = () => Plat.obreUrl('https://github.com/Xorigu3r/xoriguer-temes');
      cos.append(bloc('Quant a',
        el('div', { class: 'quant', html: `<img src="img/icona.png" alt="" width="56" height="56" style="float:left;margin:0 12px 6px 0;border-radius:14px">
          <b>Xoriguer Temes</b> <span class="versio">${escH(T_('versió {v}', { v: VERSIO }))}</span><br>
          <span class="suau petit">${escH(T_('Crea temes per al teu Xiaomi, Redmi o POCO (MIUI). Gratuït, sense anuncis i tot dins del teu aparell.'))}</span>` }),
        el('div', { class: 'botons' }, [web, codi]),
        el('p', { class: 'suau petit', text: T_('Icones de les apps: Tabler Icons (MIT) i Simple Icons (CC0). Les marques són dels seus propietaris. Xoriguer no té relació amb Xiaomi.') })));
    }, [{ text: T_('Tanca'), fes: tancaModal }]);
  }

  // ------------------------------------------------------------ crear i aplicar
  function nomFitxer() {
    const n = ($('#nom').value || 'Xoriguer').normalize('NFKD').replace(/[^\w -]/g, '').trim().replace(/\s+/g, '-');
    return (n || 'Xoriguer') + '.mtz';
  }
  async function crea() {
    const b = $('#b-crea'); b.disabled = true;
    $('#resultat').hidden = true; $('#missatge').textContent = ''; $('#ajuda-aplica').hidden = true;
    const pr = $('#progres'); pr.hidden = false; const barra = pr.firstElementChild;
    if (E.model === 'altre') { E.W = +$('#amp').value || 1080; E.H = +$('#alc').value || 2400; }
    const pf = PAL_FONS.find((p) => p.id === E.palFons) || PAL_FONS[0], pa = PAL_ACCENT.find((p) => p.id === E.accent) || PAL_ACCENT[0];
    const apps = E.apps ? E.apps.map((a) => ({ paquet: a.paquet, icona: a.icona })) : Object.keys(window.CATALEG).map((p) => ({ paquet: p }));
    const est = M.ESTILS[E.estil] || M.ESTILS.Color3D;
    try {
      const r = await M.creaTema({
        estil: M.ESTILS[E.estil] ? E.estil : 'Color3D', fons: M.FONS[E.fons] ? E.fons : 'LogotipOrTaronja', W: E.W, H: E.H,
        nom: $('#nom').value || 'Xoriguer', fonsOpcions: opcionsFons(),
        descripcio: `Xoriguer Temes · ${est.personal ? est.nom : T_(est.nom)} · ${T_(M.FONS[E.fons] || '')}`,
        apps, originals: !$('#l-originals').hidden && $('#originals').checked,
        plenes: !$('#l-plenes').hidden && $('#plenes').checked,
        sistema: $('#sistema').checked, paleta: { fons: pf.fons, targeta: pf.targeta, accent: pa.c },
        centre: $('#centre').checked ? { ...E.cc } : null,
        progres: (f) => { barra.style.width = Math.round(f * 100) + '%'; },
      });
      E.resultat = { ...r, nom: nomFitxer() };
      $('#img-inici').src = r.previa.toDataURL('image/jpeg', 0.85);
      $('#img-bloq').src = r.bloqueig.toDataURL('image/jpeg', 0.85);
      $('#res-text').textContent = T_('{n} icones · {w}×{h} · {mb} MB', { n: r.icones, w: E.W, h: E.H, mb: (r.bytes.length / 1048576).toFixed(1) });
      $('#nom-fitxer').textContent = E.resultat.nom;
      $('#resultat').hidden = false;
      $('#resultat').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error(e);
      $('#missatge').textContent = T_("No s'ha pogut crear el tema: {e}", { e: e.message || e });
      $('#resultat').hidden = false;
    } finally { b.disabled = false; setTimeout(() => { pr.hidden = true; barra.style.width = '0'; }, 600); }
  }
  async function desa() {
    const r = await Plat.desa(E.resultat.bytes, E.resultat.nom);
    if (r && r.cami) $('#missatge').textContent = T_('Desat a {c}', { c: r.cami });
    else if (r && r.ok) $('#missatge').textContent = T_('Desat.');
  }
  async function aplica() {
    const b = $('#b-aplica'); b.disabled = true;
    $('#missatge').textContent = T_('Aplicant el tema…'); $('#ajuda-aplica').hidden = true;
    try {
      const r = await Plat.aplica(E.resultat.bytes, E.resultat.nom);
      if (r.tria) { $('#ajuda-aplica').hidden = false; $('#missatge').textContent = ''; }
      else $('#missatge').textContent = r.ok ? T_('Fet! El tema ja és al telèfon.') : T_("No s'ha pogut aplicar: {e}", { e: r.missatge || '' });
    } catch (e) { $('#missatge').textContent = T_("No s'ha pogut aplicar: {e}", { e: e.message || e }); }
    b.disabled = false;
  }

  // ------------------------------------------------------------ arrencada
  async function arrenca() {
    const l = I18N.posa(desat.llengua || '');
    document.documentElement.lang = l;
    I18N.tradueix(document.body);
    // vista prèvia gran del fons triat (inici i bloqueig), damunt dels lliscadors
    const pv = el('div', { id: 'previa-fons', class: 'previes-mini' });
    $('.lliscadors').before(pv);
    registraEstils();
    await registraFonsPropis();
    if (!M.ESTILS[E.estil]) E.estil = 'Color3D';
    if (!M.FONS[E.fons]) E.fons = 'LogotipOrTaronja';

    $('#b-opcions').onclick = opcions;
    $('#modal-tanca').onclick = tancaModal;
    $('#modal').onclick = (e) => { if (e.target === $('#modal')) tancaModal(); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') tancaModal(); });
    $('#b-model').onclick = triaModel;
    $('#amp').onchange = $('#alc').onchange = () => { E.W = +$('#amp').value; E.H = +$('#alc').value; pintaFons(); };
    $('#b-busca').onclick = buscaTelefon;
    $('#b-adb').onclick = async () => {
      $('#estat-tlf').textContent = T_("Descarregant les eines d'Android de Google…");
      try { await Plat.descarregaAdb(); } catch (e) { $('#estat-tlf').textContent = String(e.message || e); return; }
      buscaTelefon();
    };
    $('#b-crea').onclick = crea;
    $('#b-desa').onclick = desa;
    $('#b-aplica').onclick = aplica;
    if (!$('#nom').value) $('#nom').value = 'Xoriguer';
    lligaLliscadors();
    pintaEstils();
    pintaXips('#pal-fons', PAL_FONS, 'palFons', (p) => `linear-gradient(135deg,${p.targeta},${p.fons})`);
    pintaXips('#pal-accent', PAL_ACCENT, 'accent', (p) => p.c);
    pintaCentre();
    aplicaModel();
    buscaTelefon();
  }
  arrenca();
})();
