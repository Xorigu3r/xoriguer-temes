/* Xoriguer Temes — interfície. */
'use strict';
(function () {
  const VERSIO = '2.1.0';
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
    dyInici: desat.dyInici || 0, dyBloq: desat.dyBloq || 0, escala: desat.escala || 1, senseLogo: !!desat.senseLogo,
    W: 1080, H: 2400, apps: null, info: null, resultat: null,
    cc: Object.assign({ on: '#FFA82E', segon: '#F2650F', off: 'com_ara', icona: '#FFFFFF', barra: '#FFA82E', rellotge: '#F6EFE2' }, desat.cc || {}),
    rl: Object.assign({ estil: 'taronja', posy: 20, alinea: 'centre', escala: 0.55, data: true }, desat.rl || {}),
    // fons (2.0): una base i un logo a sobre, per separat
    base: desat.base || '', logo: desat.logo || '', logoBloq: !!desat.logoBloq,
    baseB: desat.baseB || 'igual', logoB: desat.logoB, pantalla: 'inici',
    config: desat.config || 'cap', configFoscor: desat.configFoscor == null ? 0.55 : desat.configFoscor,   // fons de Configuració   // fons i logo de la pantalla de bloqueig
    parts: { icones: true, fons: true, bloqueig: true, colors: true },   // no es desa: cada cop comença amb «Tot el tema»
    pas: 1,
  };
  // de les versions 1.x: el fons era una sola peça (fons + logo); el convertim a base + logo
  const VELLS = { Falco: ['Falco', 'Falco'], FalcoOr: ['FalcoOr', 'FalcoOr'], Logotip: ['Falco', 'Logotip'], LogotipOr: ['FalcoOr', 'LogotipOr'],
    LogotipOrTaronja: ['FalcoOr', 'LogotipOrTaronja'], Pissarra: ['Pissarra', 'cap'], Taronja: ['Taronja', 'cap'], Crema: ['Crema', 'cap'] };
  if (!E.base) {
    const v = VELLS[E.fons];
    E.base = v ? v[0] : 'FalcoOr'; E.logo = v ? v[1] : 'LogotipOrTaronja';
    if (E.senseLogo) E.logo = 'cap';
  }
  if (E.logoB === undefined) E.logoB = E.logoBloq ? E.logo : 'cap';
  // abans el rellotge digital ocupava gairebé tota l'amplada (0,8); ara per defecte la meitat
  if (!desat.rlMida) { if (E.rl.escala === 0.8) E.rl.escala = 0.55; desat.rlMida = 1; }
  function guarda() {
    escriu('xt-opcions', { estil: E.estil, fons: E.fons, palFons: E.palFons, accent: E.accent, model: E.model, cc: E.cc, rl: E.rl,
      dyInici: E.dyInici, dyBloq: E.dyBloq, escala: E.escala, base: E.base, logo: E.logo, baseB: E.baseB, logoB: E.logoB, config: E.config, configFoscor: E.configFoscor, llengua: desat.llengua || '', senseCarpeta: desat.senseCarpeta, rlMida: 1 });
  }


  // ------------------------------------------------------------ pantalla de bloqueig (rellotge propi)
  let blGen = 0, blTemps = null;
  function pintaPreviaBloq() { clearTimeout(blTemps); blTemps = setTimeout(pintaPreviaBloqAra, 60); }
  async function pintaPreviaBloqAra() {
    const meu = ++blGen;
    const c = $('#previa-bloq');
    c.height = Math.round(c.width * E.H / E.W);
    const f = await M.fons(TRIA, c.width, c.height, true, opcionsFons());
    if (meu !== blGen) return;
    const x = c.getContext('2d'); x.drawImage(f, 0, 0);
    if (!$('#rellotge').checked) return;
    await M.dibuixaRellotge(c, E.rl);
    if (meu !== blGen) return;
    // marc amb nanses: s'arrossega per moure'l i per les cantonades per canviar-ne la mida
    const b = await caixaCanvas(c);
    x.save(); x.setLineDash([8, 6]); x.lineWidth = 2; x.strokeStyle = 'rgba(255,168,46,0.9)'; x.strokeRect(b.x, b.y, b.w, b.h); x.setLineDash([]);
    for (const [hx, hy] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]) {
      x.beginPath(); x.arc(hx, hy, 9, 0, Math.PI * 2); x.fillStyle = '#FFA82E'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#1E2A3B'; x.stroke();
    }
    x.restore();
  }
  async function caixaCanvas(c) {
    const k = c.width / 1080, cb = await M.caixaRellotge(E.rl);
    return { x: cb.x * k, y: c.height * E.rl.posy / 100, w: cb.w * k, h: cb.h * k };
  }
  /** Arrossegar el rellotge a la vista prèvia: dins = moure'l; cantonades = mida (des del centre) */
  function lligaArrossega() {
    const c = $('#previa-bloq');
    let ini = null;
    const punt = (e) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height, esc: c.width / r.width }; };
    c.addEventListener('pointerdown', async (e) => {
      if (!$('#rellotge').checked) return;
      const p = punt(e), b = await caixaCanvas(c), marge = 22 * p.esc;
      const cant = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].findIndex(([hx, hy]) => Math.hypot(p.x - hx, p.y - hy) < marge);
      const dins = p.x > b.x - marge && p.x < b.x + b.w + marge && p.y > b.y - marge && p.y < b.y + b.h + marge;
      if (cant < 0 && !dins) return;
      ini = { p, b, cant, posy: E.rl.posy, escala: E.rl.escala, cx: (b.x + b.w / 2) / c.width };
      c.setPointerCapture(e.pointerId); e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
      if (!ini) return;
      const p = punt(e), dx = p.x - ini.p.x, dy = p.y - ini.p.y;
      if (ini.cant < 0) {   // moure
        E.rl.posy = Math.round(Math.max(2, Math.min(85, ini.posy + dy / c.height * 100)) * 2) / 2;
        E.rl.alinea = 'lliure'; E.rl.cx = Math.max(0.05, Math.min(0.95, ini.cx + dx / c.width));
      } else {              // mida: la cantonada s'allunya o s'acosta del centre
        const dreta = ini.cant % 2 === 1, baix = ini.cant >= 2;
        const nouW = Math.max(40, ini.b.w + (dreta ? dx : -dx) * 2);
        E.rl.escala = Math.round(Math.max(0.3, Math.min(1.6, ini.escala * nouW / ini.b.w)) * 100) / 100;
        if (!baix) {   // estirant des de dalt, la part de baix es queda on és
          const nouH = ini.b.h * E.rl.escala / ini.escala;
          E.rl.posy = Math.max(2, (ini.b.y + ini.b.h - nouH) / c.height * 100);
        }
        if (E.rl.alinea !== 'lliure') { E.rl.alinea = 'lliure'; E.rl.cx = ini.cx; }
      }
      sincronitza(); pintaPreviaBloq();
    });
    const acaba = () => { if (!ini) return; ini = null; E.rl.posy = Math.round(E.rl.posy * 2) / 2; guarda(); sincronitza(); pintaRellotge(); };
    c.addEventListener('pointerup', acaba); c.addEventListener('pointercancel', acaba);
  }
  function sincronitza() {
    $('#rl-posy').value = String(Math.round(E.rl.posy)); $('#rl-escala').value = String(Math.round(E.rl.escala * 100));
    $('#o-rl-posy').textContent = Math.round(E.rl.posy) + '%'; $('#o-rl-escala').textContent = Math.round(E.rl.escala * 100) + '%';
  }
  function pintaRellotge() {
    const canvia = (k) => (v) => { E.rl[k] = v; guarda(); pintaPreviaBloq(); };
    const posa = (sel, node) => { const d = $(sel); d.innerHTML = ''; d.append(node); };
    pintaEstilsRellotge();
    posa('#rl-alinea', segment([['esquerra', 'Esquerra'], ['centre', 'Centre'], ['dreta', 'Dreta']], E.rl.alinea, canvia('alinea')));
    const posy = $('#rl-posy'), esc = $('#rl-escala');
    const etiq = () => { $('#o-rl-posy').textContent = E.rl.posy + '%'; $('#o-rl-escala').textContent = Math.round(E.rl.escala * 100) + '%'; };
    posy.value = String(E.rl.posy); esc.value = String(Math.round(E.rl.escala * 100));
    posy.oninput = () => { E.rl.posy = +posy.value; etiq(); guarda(); pintaPreviaBloq(); };
    esc.oninput = () => { E.rl.escala = esc.value / 100; etiq(); guarda(); pintaPreviaBloq(); };
    $('#rl-data').checked = !!E.rl.data;
    $('#rl-data').onchange = () => { E.rl.data = $('#rl-data').checked; guarda(); pintaPreviaBloq(); };
    $('#rellotge').onchange = () => { $('#rellotge-opcions').hidden = !$('#rellotge').checked; pintaPreviaBloq(); };
    etiq(); pintaPreviaBloq();
  }

  // estils de rellotge: els de sèrie i els que fa l'usuari (localStorage xt-rellotges)
  let rellotgesPropis = llegeix('xt-rellotges', []);   // [{id, nom, cfg}]
  function registraRellotges() { for (const r of rellotgesPropis) M.registraRellotge(r.id, r.nom, r.cfg); }
  function pintaEstilsRellotge() {
    const cont = $('#rl-estil'); cont.innerHTML = '';
    for (const [id, nom] of Object.entries(M.RELLOTGES)) {
      if (id === 'R_prova') continue;
      const propi = M.PROPIS_RL[id];
      const b = el('div', { class: 'opcio' + (id === E.rl.estil ? ' sel' : ''), role: 'button', tabindex: '0' });
      const c = el('canvas', { width: '400', height: '150' });
      b.append(c, el('span', { text: propi ? nom : T_(nom) }));
      b.onclick = () => { E.rl.estil = id; guarda(); cont.querySelectorAll('.opcio').forEach((o) => o.classList.remove('sel')); b.classList.add('sel'); pintaPreviaBloq(); };
      if (propi) {
        const ed = el('button', { class: 'edita', 'aria-label': T_('Edita'), text: '✎' });
        ed.onclick = (ev) => { ev.stopPropagation(); editaRellotge(rellotgesPropis.find((x) => x.id === id)); };
        b.append(ed);
      }
      cont.append(b);
      M.mostraRellotge(c, id, false);
    }
    const nou = el('button', { class: 'opcio nou' }, [el('b', { text: '+' }), el('span', { text: T_('Nou rellotge') })]);
    nou.onclick = () => editaRellotge(null);
    cont.append(nou);
  }
  function editaRellotge(existent) {
    const id = existent ? existent.id : 'R' + Date.now().toString(36);
    const cfg = existent ? { ...existent.cfg } : { lletra: 'gruixuda', ompli: 'degradat', c1: '#FFA82E', c2: '#F2650F', sep: ':', cp: '', vora: false, cv: '#F2650F', cd: '#F6EFE2' };
    let nom = existent ? existent.nom : T_('El meu rellotge');
    const prova = 'R_prova';
    const previa = el('canvas', { class: 'previa-editor', width: '400', height: '170' });
    let pend = null;
    const refresca = () => { clearTimeout(pend); pend = setTimeout(() => { M.registraRellotge(prova, nom, { ...cfg }); M.mostraRellotge(previa, prova, true); }, 60); };
    const treuProva = () => M.treuRellotge(prova);
    obreModal(existent ? T_('Edita el rellotge') : T_('Nou estil de rellotge'), (cos) => {
      const nomInp = el('input', { type: 'text', value: nom, maxlength: '30' }); nomInp.oninput = () => { nom = nomInp.value; };
      const blocColors = el('div');
      const pintaColors = () => {
        blocColors.innerHTML = '';
        if (['color', 'degradat', 'contorn'].includes(cfg.ompli)) blocColors.append(el('div', { style: 'height:8px' }), mostres(cfg.c1, (c) => { cfg.c1 = c; refresca(); }));
        if (cfg.ompli === 'degradat') blocColors.append(el('div', { style: 'height:8px' }), mostres(cfg.c2, (c) => { cfg.c2 = c; refresca(); }));
      };
      const blocSep = el('div');
      const pintaSep = () => { blocSep.innerHTML = ''; if (cfg.cp) blocSep.append(el('div', { style: 'height:8px' }), mostres(cfg.cp, (c) => { cfg.cp = c; refresca(); })); };
      const blocVora = el('div');
      const pintaVora = () => { blocVora.innerHTML = ''; if (cfg.vora) blocVora.append(mostres(cfg.cv, (c) => { cfg.cv = c; refresca(); })); };
      const vora = el('input', { type: 'checkbox' }); vora.checked = !!cfg.vora;
      vora.onchange = () => { cfg.vora = vora.checked; pintaVora(); refresca(); };
      cos.append(previa,
        bloc('Nom', nomInp),
        bloc('Lletra', segment([['gruixuda', 'Gruixuda'], ['normal', 'Normal'], ['fina', 'Fina'], ['classica', 'Clàssica'], ['maquina', 'De màquina']], cfg.lletra, (v) => { cfg.lletra = v; refresca(); })),
        bloc('Color dels números', segment([['color', 'Un color'], ['degradat', 'Degradat'], ['or', 'Daurat'], ['plata', 'Platejat'], ['contorn', 'Només la vora']], cfg.ompli, (v) => { cfg.ompli = v; pintaColors(); refresca(); }), blocColors),
        bloc('Separador', segment([[':', 'Dos punts'], ['·', 'Punt'], ['', 'Cap']], cfg.sep, (v) => { cfg.sep = v; refresca(); }), el('div', { style: 'height:8px' }),
          segment([['', 'Com els números'], ['color', 'Un altre color']], cfg.cp ? 'color' : '', (v) => { cfg.cp = v ? (cfg.cp || '#FFA82E') : ''; pintaSep(); refresca(); }), blocSep),
        bloc('Vora', el('label', { class: 'check' }, [vora, el('span', { text: T_("Vora d'un altre color al voltant dels números") })]), blocVora),
        bloc('Color de la data', mostres(cfg.cd, (c) => { cfg.cd = c; refresca(); })));
      pintaColors(); pintaSep(); pintaVora(); refresca();
    }, [
      { text: T_('Desa'), classe: 'princ', fes: () => {
        treuProva();
        const reg = { id, nom: nom.trim() || T_('El meu rellotge'), cfg };
        rellotgesPropis = rellotgesPropis.filter((x) => x.id !== id).concat(reg);
        escriu('xt-rellotges', rellotgesPropis);
        M.registraRellotge(id, reg.nom, cfg); E.rl.estil = id; guarda(); tancaModal(); pintaEstilsRellotge(); pintaPreviaBloq();
      } },
      ...(existent ? [{ text: T_('Esborra'), fes: () => {
        rellotgesPropis = rellotgesPropis.filter((x) => x.id !== id); escriu('xt-rellotges', rellotgesPropis);
        M.treuRellotge(id); treuProva(); if (E.rl.estil === id) E.rl.estil = 'taronja'; guarda(); tancaModal(); pintaEstilsRellotge(); pintaPreviaBloq();
      } }] : []),
      { text: T_('Cancel·la'), fes: () => { treuProva(); tancaModal(); } },
    ]);
  }

  // ------------------------------------------------------------ Centre de control
  let ccGen = 0;
  async function pintaPreviaCentre() {
    const meu = ++ccGen;
    const f = await M.fons(TRIA, 216, Math.round(216 * E.H / E.W), false, opcionsFons());
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
    $('#sistema').onchange = () => { $('#sistema-opcions').hidden = !$('#sistema').checked; };
    pintaPreviaCentre();
  }
  const opcionsFons = () => ({ dyInici: E.dyInici, dyBloq: E.dyBloq, escala: E.escala });

  // ------------------------------------------------------------ fotos dels fons propis (IndexedDB)
  const IDB = {
    db: null,
    obre() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((ok, ko) => {
        const r = indexedDB.open('xoriguer-temes', 2);
        r.onupgradeneeded = () => { for (const m of ['fotos', 'icones']) if (!r.result.objectStoreNames.contains(m)) r.result.createObjectStore(m); };
        r.onsuccess = () => { this.db = r.result; ok(this.db); };
        r.onerror = () => ko(r.error);
      });
    },
    async op(mode, f, magatzem) {
      const db = await this.obre(), m = magatzem || 'fotos';
      return new Promise((ok, ko) => { const t = db.transaction(m, mode); const r = f(t.objectStore(m)); t.oncomplete = () => ok(r && r.result); t.onerror = () => ko(t.error); });
    },
    posa(k, v, m) { return this.op('readwrite', (s) => s.put(v, k), m); },
    agafa(k, m) { return this.op('readonly', (s) => s.get(k), m); },
    treu(k, m) { return this.op('readwrite', (s) => s.delete(k), m); },
    /** Esborra les icones desades d'una versió anterior del dibuix */
    netejaIcones(ver) { return this.op('readwrite', (s) => { const r = s.openKeyCursor(); r.onsuccess = () => { const c = r.result; if (!c) return; if (!String(c.key).startsWith(ver + '|')) s.delete(c.key); c.continue(); }; }, 'icones'); },
  };

  // ------------------------------------------------------------ icones preparades d'amagat (crear el tema va molt més de pressa)
  let prepGen = 0, prepTemps = null;
  function opcionsIcones() {
    const apps = E.apps ? E.apps.map((a) => ({ paquet: a.paquet, icona: a.icona })) : Object.keys(window.CATALEG).map((p) => ({ paquet: p }));
    return { estil: M.ESTILS[E.estil] ? E.estil : 'Color3D', apps,
      originals: !$('#l-originals').hidden && $('#originals').checked, plenes: !$('#l-plenes').hidden && $('#plenes').checked };
  }
  /** Torna a preparar les icones (després d'un canvi d'estil, d'apps o d'opcions); la preparació anterior es para sola */
  function preparaIcones() {
    clearTimeout(prepTemps);
    prepTemps = setTimeout(() => {
      const meu = ++prepGen;
      M.preparaIcones(opcionsIcones(), () => meu !== prepGen).catch((e) => console.warn('prepara icones', e));
    }, 400);
  }
  const imatgeDe = (blob) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = URL.createObjectURL(blob); });

  // ------------------------------------------------------------ estils propis i la foto del fons
  let estilsPropis = llegeix('xt-estils', []);   // [{id, nom, cfg}]
  function registraEstils() { for (const e of estilsPropis) M.registraEstil(e.id, e.nom, e.cfg); }
  let foto = null, fotoB = null, fotoC = null;   // fotoC: la de Configuració (IndexedDB 'foto-config')   // les fotos de l'usuari: inici (IndexedDB 'foto') i bloqueig ('foto-bloq')
  async function carregaFoto() {
    try {
      let b = await IDB.agafa('foto');
      if (!b) {   // de les versions 1.x: el darrer fons propi amb foto
        const vells = llegeix('xt-fons', []).filter((f) => f.cfg && f.cfg.base === 'foto');
        for (const f of vells.reverse()) { b = await IDB.agafa(f.id); if (b) { await IDB.posa('foto', b); break; } }
        if (b && vells.some((f) => f.id === E.fons)) { E.base = 'foto'; const v = vells.find((f) => f.id === E.fons); if (v.cfg.logo) E.logo = v.cfg.logo; }
      }
      if (b) foto = await imatgeDe(b);
    } catch { /* res */ }
    if (E.base === 'foto' && !foto) E.base = 'FalcoOr';
    try { const b = await IDB.agafa('foto-bloq'); if (b) fotoB = await imatgeDe(b); } catch { /* res */ }
    if (E.baseB === 'foto' && !fotoB) E.baseB = 'igual';
    try { const b = await IDB.agafa('foto-config'); if (b) fotoC = await imatgeDe(b); } catch { /* res */ }
    if (E.config === 'foto' && !fotoC) E.config = 'cap';
  }
  const TRIA = '_tria';
  function registraTria() { M.registraFons(TRIA, '', { base: E.base, foto, logo: E.logo, baseB: E.baseB, fotoB, logoB: E.logoB, aura: true }); }

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
    $('#resolucio').hidden = E.model !== 'altre';
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
    $('#sense-originals').hidden = !$('#l-originals').hidden;
    E.potAplicar = !!(Plat.potAplicar && i.connectat);
    preparaIcones();   // ara ja sabem quines apps té el telèfon
    // posar el fons d'inici sense tocar la resta del tema només es pot des de l'app del mòbil (WallpaperManager)
    $('#l-fons-bloq').hidden = !(Plat.potFonsInici && E.potAplicar);
    $('#b-fes').textContent = E.potAplicar ? T_('Aplica al telèfon') : T_('Crea el tema');
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
        E.estil = id; guarda(); preparaIcones();
        cont.querySelectorAll('.opcio').forEach((o) => o.classList.remove('sel')); b.classList.add('sel');
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
        bloc('Marc metàl·lic', segment([['cap', 'Sense marc'], ['or', 'Daurat'], ['plata', 'Platejat'], ['bronze', 'De bronze']], cfg.marc || 'cap', (v) => { cfg.marc = v; refresca(); })),
        bloc('Acabat', chk('Relleu 3D (brillantor i ombra)', 'relleu'), chk('Vora de color', 'vora')),
        bloc('Mida del dibuix', mida));
      pintaColorsFons(); pintaColorGlif(); refresca();
    }, [
      { text: T_('Desa'), classe: 'princ', fes: () => {
        M.treuEstil(prova);
        const reg = { id, nom: nom.trim() || T_('El meu estil'), cfg };
        estilsPropis = estilsPropis.filter((x) => x.id !== id).concat(reg);
        escriu('xt-estils', estilsPropis);
        M.registraEstil(id, reg.nom, cfg); E.estil = id; guarda(); tancaModal(); pintaEstils(); preparaIcones();
      } },
      ...(existent ? [{ text: T_('Esborra'), fes: () => {
        estilsPropis = estilsPropis.filter((x) => x.id !== id); escriu('xt-estils', estilsPropis);
        M.treuEstil(id); M.treuEstil(prova); if (E.estil === id) E.estil = 'Color3D'; guarda(); tancaModal(); pintaEstils();
      } }] : []),
      { text: T_('Cancel·la'), fes: () => { M.treuEstil(prova); tancaModal(); } },
    ]);
  }

  // ------------------------------------------------------------ fons: base (o la foto) + logo
  const NOMS_BASE = { FalcoOr: 'Llum daurada', Falco: 'Llum taronja', Pissarra: 'Pissarra', Taronja: 'Posta de sol', Crema: 'Corbes' };
  const NOMS_LOGO = [['cap', 'Sense logo'], ['Falco', 'Falcó'], ['FalcoOr', "Falcó d'or"], ['Simbol', 'Falcó amb roda'],
    ['Logotip', 'Logotip'], ['LogotipOr', "Logotip d'or"], ['LogotipOrTaronja', 'Or i taronja']];
  let fonsGen = 0, fonsTemps = null;
  function pintaFons() { registraTria(); clearTimeout(fonsTemps); fonsTemps = setTimeout(pintaFonsAra, 80); }
  function triaFoto() {
    const bloq = E.pantalla === 'bloq';
    const inp = $('#tria-foto'); inp.value = '';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      try {
        const im = await imatgeDe(f);
        await IDB.posa(bloq ? 'foto-bloq' : 'foto', f);
        if (bloq) { fotoB = im; E.baseB = 'foto'; } else { foto = im; E.base = 'foto'; }
      } catch (e) { alert(String(e.message || e)); return; }
      guarda(); pintaFons();
    };
    inp.click();
  }
  function triaPantalla(v) { E.pantalla = v; pintaFons(); }
  async function pintaFonsAra() {
    const meu = ++fonsGen;
    const bloq = E.pantalla === 'bloq';
    const pest = $('#fons-pantalla'); pest.innerHTML = '';
    pest.append(segment([['inici', "Pantalla d'inici"], ['bloq', 'Pantalla de bloqueig']], E.pantalla, triaPantalla));
    $('#sub-fons').textContent = T_(bloq ? 'Fons de la pantalla de bloqueig' : "Fons de la pantalla d'inici");
    const cont = $('#bases');
    cont.innerHTML = '';
    const w = 160, h = Math.round(160 * E.H / E.W);
    const actual = bloq ? E.baseB : E.base, logo = bloq ? E.logoB : E.logo, fotoAra = bloq ? fotoB : foto;
    const tria = (id) => { if (bloq) E.baseB = id; else E.base = id; guarda(); pintaFons(); };
    const mostra = (c, cfg) => {
      const id = '_m_' + Math.random().toString(36).slice(2);
      M.registraFons(id, '', { aura: true, ...cfg });
      M.fons(id, w, h, bloq, opcionsFons()).then((f) => { M.treuFons(id); if (meu === fonsGen) c.getContext('2d').drawImage(f, 0, 0); });
    };
    const rajola = (id, nom, cfg) => {
      const b = el('div', { class: 'opcio' + (id === actual ? ' sel' : ''), role: 'button', tabindex: '0' });
      const c = el('canvas', { width: String(w), height: String(h) });
      b.append(c, el('span', { text: T_(nom) }));
      b.onclick = () => tria(id);
      cont.append(b); mostra(c, cfg);
      return b;
    };
    // a la pantalla de bloqueig, primer «el mateix que a l'inici»
    if (bloq) rajola('igual', "El mateix que a l'inici", { base: E.base, foto, logo });
    // la foto de l'usuari
    if (fotoAra) {
      const bf = rajola('foto', 'La meva foto', { base: 'foto', foto: fotoAra, logo });
      const ed = el('button', { class: 'edita', 'aria-label': T_('Canvia la foto'), text: '✎' });
      ed.onclick = (ev) => { ev.stopPropagation(); triaFoto(); };
      bf.append(ed);
    } else {
      const bf = el('div', { class: 'opcio', role: 'button', tabindex: '0' });
      bf.append(el('div', { class: 'foto-buida', text: '+' }), el('span', { text: T_('La meva foto') }));
      bf.onclick = triaFoto;
      cont.append(bf);
    }
    for (const [id, nom] of Object.entries(NOMS_BASE)) rajola(id, nom, { base: id, logo });
    const lg = $('#logos'); lg.innerHTML = '';
    lg.append(segment(NOMS_LOGO, logo, (v) => { if (bloq) E.logoB = v; else E.logo = v; guarda(); pintaFons(); }));
    $('#logo-opcions').hidden = E.logo === 'cap' && E.logoB === 'cap';
    pintaPreviaFons();
  }
  let previaGen = 0;
  async function pintaPreviaFons() {
    const meu = ++previaGen;
    registraTria();
    if ($('#previa-centre')) pintaPreviaCentre();
    if ($('#previa-bloq')) pintaPreviaBloq();
    const cont = $('#previa-fons');
    const w = 150, h = Math.round(150 * E.H / E.W);
    const [a, b] = await Promise.all([M.fons(TRIA, w, h, false, opcionsFons()), M.fons(TRIA, w, h, true, opcionsFons())]);
    if (meu !== previaGen) return;
    cont.innerHTML = '';
    for (const [f, t, v] of [[a, 'Inici', 'inici'], [b, 'Bloqueig', 'bloq']]) {
      const c = el('canvas', { width: String(w), height: String(h) }); c.getContext('2d').drawImage(f, 0, 0);
      const fig = el('figure', { class: E.pantalla === v ? 'sel' : '' }, [c, el('figcaption', { text: T_(t) })]);
      fig.onclick = () => { if (E.pantalla !== v) triaPantalla(v); };
      cont.append(fig);
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

  // ------------------------------------------------------------ imatge de fons a Configuració
  const PAL_FONS_ACTUAL = () => (PAL_FONS.find((p) => p.id === E.palFons) || PAL_FONS[0]).fons;
  async function imatgeConfig() {   // la imatge triada (foto o el fons d'inici) o null
    if (E.config === 'foto' && fotoC) return fotoC;
    if (E.config === 'inici') { registraTria(); return M.fons(TRIA, E.W, E.H, false, opcionsFons()); }
    return null;
  }
  function triaFotoConfig() {
    const inp = $('#tria-foto'); inp.value = '';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      try { fotoC = await imatgeDe(f); await IDB.posa('foto-config', f); } catch (e) { alert(String(e.message || e)); return; }
      E.config = 'foto'; guarda(); pintaConfig();
    };
    inp.click();
  }
  let confGen = 0;
  async function pintaConfig() {
    const meu = ++confGen;
    const cont = $('#config-fons'); cont.innerHTML = '';
    const w = 120, h = Math.round(120 * E.H / E.W);
    // mostra: la imatge enfosquida amb unes quantes files de text de mentida, com la pantalla del Wi‑Fi
    const dibuixa = (c, img) => {
      const x = c.getContext('2d');
      if (img) x.drawImage(M.imatgeConfiguracio(img, w, h, E.configFoscor, PAL_FONS_ACTUAL()), 0, 0);
      else { x.fillStyle = PAL_FONS_ACTUAL(); x.fillRect(0, 0, w, h); }
      x.fillStyle = 'rgba(246,239,226,.9)'; x.fillRect(10, 22, 40, 7);
      for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(246,239,226,.75)'; x.fillRect(10, 48 + i * 24, 60, 5); x.fillStyle = 'rgba(185,178,165,.6)'; x.fillRect(10, 57 + i * 24, 38, 4); }
    };
    const rajola = (id, nom, img, onclick) => {
      const b = el('div', { class: 'opcio' + (id === E.config ? ' sel' : ''), role: 'button', tabindex: '0' });
      const c = el('canvas', { width: String(w), height: String(h) });
      b.append(c, el('span', { text: T_(nom) }));
      b.onclick = onclick || (() => { E.config = id; guarda(); pintaConfig(); });
      cont.append(b);
      Promise.resolve(img).then((im) => { if (meu === confGen) dibuixa(c, im); });
      return b;
    };
    rajola('cap', 'Sense imatge', null);
    if (fotoC) {
      const b = rajola('foto', 'La meva foto', fotoC);
      const ed = el('button', { class: 'edita', 'aria-label': T_('Canvia la foto'), text: '✎' });
      ed.onclick = (ev) => { ev.stopPropagation(); triaFotoConfig(); };
      b.append(ed);
    } else {
      const b = el('div', { class: 'opcio', role: 'button', tabindex: '0' });
      b.append(el('div', { class: 'foto-buida', text: '+' }), el('span', { text: T_('La meva foto') }));
      b.onclick = triaFotoConfig; cont.append(b);
    }
    registraTria();
    rajola('inici', "El fons d'inici", M.fons(TRIA, w, h, false, opcionsFons()));
    $('#config-foscor-bloc').hidden = E.config === 'cap';
    const fs = $('#config-foscor');
    fs.value = String(Math.round(E.configFoscor * 100)); $('#o-config-foscor').textContent = fs.value + '%';
    fs.oninput = () => { E.configFoscor = fs.value / 100; $('#o-config-foscor').textContent = fs.value + '%'; guarda(); clearTimeout(fs.t); fs.t = setTimeout(pintaConfig, 120); };
  }

  // ------------------------------------------------------------ xips del sistema
  function pintaXips(sel, llista, clau, mostra) {
    const cont = $(sel);
    cont.innerHTML = '';
    for (const p of llista) {
      const b = el('button', { class: 'xip' + (p.id === E[clau] ? ' sel' : ''), html: `<i style="background:${mostra(p)}"></i><span>${escH(T_(p.nom))}</span>` });
      b.onclick = () => { E[clau] = p.id; guarda(); pintaXips(sel, llista, clau, mostra); if (clau === 'palFons') pintaConfig(); };
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
  // Només opcions provades al Mi 10T Lite: tot (-1), només icones (8), només bloqueig (4100). Les barreges amb el bit 1
  // esborren el fons d'inici (provat el 22/11/2026), per això no n'hi ha.
  function llegeixParts() {
    const a = (document.querySelector('input[name=abast]:checked') || {}).value || 'tot';
    E.abast = a;
    E.parts = { icones: a === 'tot' || a === 'icones', fons: a === 'tot' || a === 'fons-bloq', bloqueig: a === 'tot' || a === 'bloqueig' || a === 'fons-bloq', colors: a === 'tot' };
  }
  async function crea() {
    $('#resultat').hidden = true; $('#missatge').textContent = ''; $('#ajuda-aplica').hidden = true;
    const pr = $('#progres'); pr.hidden = false; const barra = pr.firstElementChild;
    if (E.model === 'altre') { E.W = +$('#amp').value || 1080; E.H = +$('#alc').value || 2400; }
    const pf = PAL_FONS.find((p) => p.id === E.palFons) || PAL_FONS[0], pa = PAL_ACCENT.find((p) => p.id === E.accent) || PAL_ACCENT[0];
    const apps = E.apps ? E.apps.map((a) => ({ paquet: a.paquet, icona: a.icona })) : Object.keys(window.CATALEG).map((p) => ({ paquet: p }));
    const est = M.ESTILS[E.estil] || M.ESTILS.Color3D;
    registraTria();
    try {
      const fotoConfig = $('#sistema').checked ? await imatgeConfig() : null;
      const r = await M.creaTema({
        estil: M.ESTILS[E.estil] ? E.estil : 'Color3D', fons: TRIA, W: E.W, H: E.H,
        nom: $('#nom').value || 'Xoriguer', fonsOpcions: opcionsFons(), parts: { ...E.parts },
        config: fotoConfig ? { foto: fotoConfig, foscor: E.configFoscor } : null,
        descripcio: `Xoriguer Temes · ${est.personal ? est.nom : T_(est.nom)}`,
        apps, originals: !$('#l-originals').hidden && $('#originals').checked,
        plenes: !$('#l-plenes').hidden && $('#plenes').checked,
        sistema: $('#sistema').checked, paleta: { fons: pf.fons, targeta: pf.targeta, accent: pa.c },
        centre: $('#centre').checked ? { ...E.cc } : null,
        rellotge: $('#rellotge').checked ? { ...E.rl, llisca: T_('Llisca amunt per desbloquejar'), textos: { grup: 'Xoriguer', posicio: T_('Posició del rellotge (% de l’alçada)'), resum: T_('0 = a dalt de tot, 60 = cap a baix'), data: T_('Mostra la data') } } : null,
        progres: (f) => { barra.style.width = Math.round(f * 100) + '%'; },
      });
      E.resultat = { ...r, nom: nomFitxer(), flags: M.flagsParts(E.parts) };
      $('#img-inici').src = r.previa.toDataURL('image/jpeg', 0.85);
      $('#img-bloq').src = r.bloqueig.toDataURL('image/jpeg', 0.85);
      $('#res-text').textContent = T_('{n} icones · {w}×{h} · {mb} MB', { n: r.icones, w: E.W, h: E.H, mb: (r.bytes.length / 1048576).toFixed(1) });
      $('#nom-fitxer').textContent = E.resultat.nom;
      $('#resultat').hidden = false;
      return true;
    } catch (e) {
      console.error(e);
      $('#missatge').textContent = T_("No s'ha pogut crear el tema: {e}", { e: e.message || e });
      $('#resultat').hidden = false;
      return false;
    } finally { setTimeout(() => { pr.hidden = true; barra.style.width = '0'; }, 600); }
  }
  async function fes() {
    llegeixParts();
    const b = $('#b-fes'); b.disabled = true;
    try {
      if (!(await crea())) return;
      if (E.potAplicar) await aplica();
      else if (Plat.tipus === 'web') await desa();
      $('#resultat').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally { b.disabled = false; }
  }
  async function desa() {
    const r = await Plat.desa(E.resultat.bytes, E.resultat.nom);
    if (r && r.cami) $('#missatge').textContent = T_('Desat a {c}', { c: r.cami });
    else if (r && r.ok) $('#missatge').textContent = T_('Desat.');
  }
  async function aplica() {
    $('#missatge').textContent = T_('Aplicant el tema…'); $('#ajuda-aplica').hidden = true;
    try {
      // fons + bloqueig: primer el fons d'inici (Android) i després la pantalla de bloqueig amb el tema (4100)
      if (E.abast === 'fons-bloq' && E.resultat.fonsInici) {
        await Plat.posaFonsInici(E.resultat.fonsInici);
        // Android recalcula els colors del sistema amb el fons nou i reinicia les finestres: si el gestor de temes
        // s'obre abans, es tanca a mitja feina (provat al Mi 10T Lite). Esperem que acabi.
        $('#missatge').textContent = T_('Posant el fons de pantalla…');
        await new Promise((r) => setTimeout(r, 7000));
      }
      const r = await Plat.aplica(E.resultat.bytes, E.resultat.nom, E.resultat.flags);
      if (r.tria) { $('#ajuda-aplica').hidden = false; $('#missatge').textContent = ''; }
      else $('#missatge').textContent = r.ok ? T_('Fet! El tema ja és al telèfon.') : T_("No s'ha pogut aplicar: {e}", { e: r.missatge || '' });
    } catch (e) { $('#missatge').textContent = T_("No s'ha pogut aplicar: {e}", { e: e.message || e }); }
  }

  // ------------------------------------------------------------ passos
  function vesA(n) {
    E.pas = Math.max(1, Math.min(5, n));
    document.querySelectorAll('section.pas').forEach((s) => { s.hidden = +s.dataset.pas !== E.pas; });
    document.querySelectorAll('#passos button').forEach((b) => {
      const k = +b.dataset.pas;
      b.classList.toggle('act', k === E.pas); b.classList.toggle('fet', k < E.pas);
    });
    $('#b-enrere').hidden = E.pas === 1;
    $('#b-seguent').hidden = E.pas === 5;
    if (E.pas === 2) pintaFons();
    if (E.pas === 3) pintaPreviaBloq();
    if (E.pas === 4) { pintaPreviaCentre(); pintaConfig(); }
    window.scrollTo({ top: 0 });
  }

  // ------------------------------------------------------------ arrencada
  async function arrenca() {
    const l = I18N.posa(desat.llengua || '');
    document.documentElement.lang = l;
    I18N.tradueix(document.body);
    registraEstils();
    registraRellotges();
    if (!M.RELLOTGES[E.rl.estil]) E.rl.estil = 'taronja';
    await carregaFoto();
    if (!M.ESTILS[E.estil]) E.estil = 'Color3D';
    registraTria();
    M.posaMagatzem({ agafa: (k) => IDB.agafa(k, 'icones'), posa: (k, v) => IDB.posa(k, v, 'icones') });
    IDB.netejaIcones(M.VER_IC).catch(() => {});
    $('#originals').addEventListener('change', preparaIcones); $('#plenes').addEventListener('change', preparaIcones);
    document.querySelectorAll('input[name=abast]').forEach((r) => { r.onchange = llegeixParts; });
    document.querySelectorAll('#passos button').forEach((b) => { b.onclick = () => vesA(+b.dataset.pas); });
    $('#b-enrere').onclick = () => vesA(E.pas - 1);
    $('#b-seguent').onclick = () => vesA(E.pas + 1);

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
    $('#b-fes').onclick = fes;
    $('#b-desa').onclick = desa;
    if (!$('#nom').value) $('#nom').value = 'Xoriguer';
    lligaLliscadors();
    pintaEstils();
    pintaXips('#pal-fons', PAL_FONS, 'palFons', (p) => `linear-gradient(135deg,${p.targeta},${p.fons})`);
    pintaXips('#pal-accent', PAL_ACCENT, 'accent', (p) => p.c);
    pintaCentre();
    pintaRellotge();
    lligaArrossega();
    aplicaModel();
    vesA(1);
    buscaTelefon();
  }
  arrenca();
})();
