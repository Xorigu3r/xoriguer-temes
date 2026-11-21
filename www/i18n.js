/* Xoriguer Temes — idiomes (català, castellà, francès, anglès).
 * La clau és el text en català tal com surt a l'HTML o a app.js; TR (traduccions.js) té les altres llengües.
 * A l'HTML no cal marcar res: es tradueix cada element que només té text i etiquetes de format (b, i, br...),
 * i si no, els seus trossos de text sols. També placeholder, aria-label i title. */
'use strict';
(function (g) {
  const LLENGUES = ['ca', 'es', 'fr', 'en'];
  const INLINE = new Set(['B', 'I', 'BR', 'EM', 'STRONG', 'SPAN', 'A']);
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  let L = 'ca';

  function delSistema() {
    const ll = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    for (const x of ll) {
      const s = String(x || '').toLowerCase().split('-')[0];
      if (s === 'ca') return 'ca';
      if (s === 'es' || s === 'gl' || s === 'eu') return 'es';
      if (s === 'fr') return 'fr';
      if (s === 'en') return 'en';
    }
    return 'en';
  }
  /** pref: '' (automàtic) o un codi. Retorna el codi efectiu. */
  function posa(pref) { L = LLENGUES.includes(pref) ? pref : delSistema(); return L; }

  function t(s, v) {
    let r = s;
    if (L !== 'ca') { const d = (g.TR || {})[L]; const x = d && d[norm(s)]; if (x != null) r = x; }
    if (v) r = r.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
    return r;
  }

  function esUnitat(el) {
    let text = false;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) text = true;
    if (!text) return false;
    for (const d of el.querySelectorAll('*')) if (!INLINE.has(d.tagName)) return false;
    return true;
  }
  /** Recorre l'arbre: fes(clau, aplica) per a cada tros traduïble. */
  function recorre(el, fes) {
    if (el.nodeType !== 1 || /^(SCRIPT|STYLE|SVG|svg|TEXTAREA|path)$/.test(el.tagName) || el.hasAttribute('data-no-t')) return;
    for (const a of ['placeholder', 'aria-label', 'title']) {
      const v = el.getAttribute(a);
      if (v && v.trim()) fes(norm(v), (x) => el.setAttribute(a, x));
    }
    if (esUnitat(el)) { fes(norm(el.innerHTML), (x) => { el.innerHTML = x; }); return; }
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 3 && n.nodeValue.trim()) {
        const o = n.nodeValue, k = norm(o);
        fes(k, (x) => { n.nodeValue = o.replace(o.trim(), x); });
      } else if (n.nodeType === 1) recorre(n, fes);
    }
  }
  function tradueix(root) {
    if (L === 'ca') return;
    const d = (g.TR || {})[L] || {};
    recorre(root, (k, aplica) => { if (d[k] != null) aplica(d[k]); });
  }
  /** Per a desenvolupament: claus de l'HTML que encara no tenen traducció a `l`. */
  function falten(root, l) {
    const d = (g.TR || {})[l] || {}, out = new Set();
    recorre(root, (k) => { if (!(k in d) && /\p{L}{2}/u.test(k)) out.add(k); });
    return [...out];
  }

  g.I18N = { LLENGUES, posa, t, tradueix, falten, get llengua() { return L; }, delSistema };
})(typeof window !== 'undefined' ? window : globalThis);
