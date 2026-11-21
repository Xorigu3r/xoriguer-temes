/* Xoriguer Temes — interfície. */
'use strict';
(function () {
  const $ = (s) => document.querySelector(s);
  const T_ = (s, v) => I18N.t(s, v);
  const M = window.Motor;

  const PAL_FONS = [
    { id: 'pissarra', nom: 'Pissarra', fons: '#1E2A3B', targeta: '#27354A' },
    { id: 'nit', nom: 'Blau nit', fons: '#172338', targeta: '#22314B' },
    { id: 'grafit', nom: 'Grafit', fons: '#262B33', targeta: '#323843' },
    { id: 'bosc', nom: 'Bosc', fons: '#1C2B28', targeta: '#263A35' },
    { id: 'pruna', nom: 'Pruna', fons: '#2A2236', targeta: '#372D46' },
  ];
  const PAL_ACCENT = [
    { id: 'taronja', nom: 'Taronja', c: '#FFA82E' },
    { id: 'or', nom: 'Or', c: '#E0B34A' },
    { id: 'blau', nom: 'Blau', c: '#40AAE6' },
    { id: 'verd', nom: 'Verd', c: '#4CC38A' },
    { id: 'rosa', nom: 'Rosa', c: '#EC6A9A' },
    { id: 'lila', nom: 'Lila', c: '#9C7BEA' },
  ];

  const desat = (() => { try { return JSON.parse(localStorage.getItem('xt-opcions') || '{}'); } catch { return {}; } })();
  const E = {
    estil: desat.estil || 'Color3D', fons: desat.fons || 'LogotipOrTaronja',
    palFons: desat.palFons || 'pissarra', accent: desat.accent || 'taronja',
    W: 1080, H: 2400, apps: null, info: null, resultat: null,
  };
  const guarda = () => { try { localStorage.setItem('xt-opcions', JSON.stringify({ estil: E.estil, fons: E.fons, palFons: E.palFons, accent: E.accent, llengua: $('#llengua').value })); } catch { /* res */ } };

  // ------------------------------------------------------------ idioma
  function posaLlengua(v) {
    const l = I18N.posa(v);
    document.documentElement.lang = l;
    if (!posaLlengua.original) posaLlengua.original = document.querySelector('main').innerHTML;
    else { document.querySelector('main').innerHTML = posaLlengua.original; }
    I18N.tradueix(document.body);
  }

  // ------------------------------------------------------------ telèfon
  function omplModels() {
    const s = $('#model');
    s.innerHTML = '';
    if (E.info && E.info.connectat && E.info.model) {
      s.append(new Option(`${E.info.nom || E.info.model} (${T_('aquest telèfon')})`, 'detectat'));
    }
    for (const m of window.MODELS) s.append(new Option(m.nom, m.id));
    s.append(new Option(T_('Un altre (escriu la resolució)'), 'altre'));
    s.value = E.info && E.info.connectat && E.info.model ? 'detectat' : (desat.model || 'M2007J17G');
    if (!s.value) s.value = 'M2007J17G';
    canviaModel();
  }
  function canviaModel() {
    const v = $('#model').value;
    if (v === 'detectat') { E.W = E.info.W; E.H = E.info.H; }
    else if (v !== 'altre') { const m = window.MODELS.find((x) => x.id === v); E.W = m.w; E.H = m.h; }
    $('#amp').value = E.W; $('#alc').value = E.H;
    $('#amp').disabled = $('#alc').disabled = v !== 'altre';
    pintaFons();
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
    } else if (Plat.tipus === 'windows') {
      est.className = 'estat avis';
      est.textContent = i.sensAdb ? T_("No trobo les eines d'Android (adb) en aquest ordinador.")
        : i.noAutoritzat ? T_('El telèfon és connectat però no ha autoritzat aquest ordinador: mira el mòbil i accepta la depuració USB.')
          : T_("No hi ha cap telèfon connectat. Pots triar el model a mà i desar el tema.");
      $('#ajuda-usb').hidden = false;
      $('#b-adb').hidden = !i.sensAdb;
    } else {
      est.className = 'estat avis';
      est.textContent = T_('Tria el model del teu telèfon. El tema es descarregarà com a fitxer .mtz.');
    }
    $('#l-originals').hidden = !(E.apps && E.apps.some((a) => a.icona));
    $('#b-aplica').hidden = !(Plat.potAplicar && i.connectat);
    omplModels();
  }
  const escH = (s) => String(s).replace(/[<>&"]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[m]));

  // ------------------------------------------------------------ opcions visuals
  const MOSTRA = ['com.whatsapp', 'org.telegram.messenger', 'cat.xoriguer.aparcament', 'com.google.android.gm'];
  async function pintaEstils() {
    const cont = $('#estils');
    cont.innerHTML = '';
    for (const [id, e] of Object.entries(M.ESTILS)) {
      const b = document.createElement('button');
      b.className = 'opcio' + (id === E.estil ? ' sel' : '');
      const c = document.createElement('canvas'); c.width = 400; c.height = 110;
      const x = c.getContext('2d'); x.fillStyle = '#1E2A3B'; x.fillRect(0, 0, 400, 110);
      b.append(c); const s = document.createElement('span'); s.textContent = T_(e.nom); b.append(s);
      b.onclick = () => { E.estil = id; E.fons = e.fons; guarda(); pintaEstils(); pintaFons(); };
      cont.append(b);
      MOSTRA.forEach(async (p, i) => { const ic = await M.icona(id, p); x.drawImage(ic, 8 + i * 98, 10, 90, 90); });
    }
  }
  let fonsGen = 0;
  async function pintaFons() {
    const meu = ++fonsGen;
    const cont = $('#fons');
    cont.innerHTML = '';
    const w = 180, h = Math.round(180 * E.H / E.W);
    for (const [id, nom] of Object.entries(M.FONS)) {
      const b = document.createElement('button');
      b.className = 'opcio' + (id === E.fons ? ' sel' : '');
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      b.append(c); const s = document.createElement('span'); s.textContent = T_(nom); b.append(s);
      b.onclick = () => { E.fons = id; guarda(); cont.querySelectorAll('.opcio').forEach((o) => o.classList.remove('sel')); b.classList.add('sel'); };
      cont.append(b);
      M.fons(id, w, h, true).then((f) => { if (meu === fonsGen) c.getContext('2d').drawImage(f, 0, 0); });
    }
  }
  function pintaXips(sel, llista, clau, mostra) {
    const cont = $(sel);
    cont.innerHTML = '';
    for (const p of llista) {
      const b = document.createElement('button');
      b.className = 'xip' + (p.id === E[clau] ? ' sel' : '');
      b.innerHTML = `<i style="background:${mostra(p)}"></i><span>${escH(T_(p.nom))}</span>`;
      b.onclick = () => { E[clau] = p.id; guarda(); pintaXips(sel, llista, clau, mostra); };
      cont.append(b);
    }
  }

  // ------------------------------------------------------------ crear
  function nomFitxer() {
    const n = ($('#nom').value || 'Xoriguer').normalize('NFKD').replace(/[^\w -]/g, '').trim().replace(/\s+/g, '-');
    return (n || 'Xoriguer') + '.mtz';
  }
  async function crea() {
    const b = $('#b-crea'); b.disabled = true;
    $('#resultat').hidden = true; $('#missatge').textContent = '';
    const pr = $('#progres'); pr.hidden = false; const barra = pr.firstElementChild;
    if ($('#model').value === 'altre') { E.W = +$('#amp').value || 1080; E.H = +$('#alc').value || 2400; }
    const pf = PAL_FONS.find((p) => p.id === E.palFons), pa = PAL_ACCENT.find((p) => p.id === E.accent);
    // apps: les del telèfon (si les sabem) o tot el catàleg
    const apps = E.apps ? E.apps.map((a) => ({ paquet: a.paquet, icona: a.icona }))
      : Object.keys(window.CATALEG).map((p) => ({ paquet: p }));
    try {
      const r = await M.creaTema({
        estil: E.estil, fons: E.fons, W: E.W, H: E.H, nom: $('#nom').value || 'Xoriguer',
        descripcio: `Xoriguer Temes · ${T_(M.ESTILS[E.estil].nom)} · ${T_(M.FONS[E.fons])}`,
        apps, originals: !$('#l-originals').hidden && $('#originals').checked,
        sistema: $('#sistema').checked, paleta: { fons: pf.fons, targeta: pf.targeta, accent: pa.c },
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
    $('#missatge').textContent = T_('Aplicant el tema…');
    try {
      const r = await Plat.aplica(E.resultat.bytes, E.resultat.nom);
      if (r.tria) { $('#ajuda-aplica').hidden = false; $('#missatge').textContent = ''; }
      else $('#missatge').textContent = r.ok ? T_('Fet! El tema ja és al telèfon.') : T_("No s'ha pogut aplicar: {e}", { e: r.missatge || '' });
    } catch (e) { $('#missatge').textContent = T_("No s'ha pogut aplicar: {e}", { e: e.message || e }); }
    b.disabled = false;
  }

  // ------------------------------------------------------------ arrencada
  function lliga() {
    $('#model').onchange = () => { try { const o = JSON.parse(localStorage.getItem('xt-opcions') || '{}'); o.model = $('#model').value; localStorage.setItem('xt-opcions', JSON.stringify(o)); } catch { /* res */ } canviaModel(); };
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
    pintaEstils(); pintaXips('#pal-fons', PAL_FONS, 'palFons', (p) => `linear-gradient(135deg,${p.targeta},${p.fons})`);
    pintaXips('#pal-accent', PAL_ACCENT, 'accent', (p) => p.c);
    omplModels();
    buscaTelefon();
  }

  $('#llengua').value = desat.llengua || '';
  posaLlengua($('#llengua').value);
  $('#llengua').onchange = () => { guarda(); posaLlengua($('#llengua').value); lliga(); };
  lliga();
  if (window.xtEscriptori) window.xtEscriptori.llest?.();
})();
