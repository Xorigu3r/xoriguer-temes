// Rasteritza els glifs Tabler / Simple Icons a màscares blanques 512x512 (transparents).
// Ús: node eines/glifs.mjs   -> sortida a cache/glifs/<gruix>/<paquet>.png
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apps = JSON.parse(fs.readFileSync(path.join(arrel, 'eines', 'apps.json'), 'utf8').replace(/^\uFEFF/, ''));
const MIDA = 512;
const GRUIXOS = { prim: 1.6, gruixut: 2.3 };   // gruix del traç Tabler (viewBox 24)
let falten = [];

function svgTabler(nom, gruix) {
  const f = path.join(arrel, 'node_modules/@tabler/icons/icons/outline', nom + '.svg');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8')
    .replace(/width="24"/, `width="${MIDA}"`).replace(/height="24"/, `height="${MIDA}"`)
    .replace(/stroke="currentColor"/g, 'stroke="#ffffff"')
    .replace(/stroke-width="[\d.]+"/, `stroke-width="${gruix}"`);
}

function svgMarca(nom) {
  const f = path.join(arrel, 'node_modules/simple-icons/icons', nom + '.svg');
  if (!fs.existsSync(f)) return null;
  // Simple Icons: viewBox 24, sense marge. Hi afegim un 12% de marge perquè no quedi més gran que Tabler.
  const d = fs.readFileSync(f, 'utf8').match(/<path d="([^"]+)"/)[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MIDA}" height="${MIDA}" viewBox="-3 -3 30 30"><path fill="#ffffff" d="${d}"/></svg>`;
}

for (const [gNom, gruix] of Object.entries(GRUIXOS)) {
  const dir = path.join(arrel, 'cache', 'glifs', gNom);
  fs.mkdirSync(dir, { recursive: true });
  for (const [paquet, glif] of Object.entries(apps)) {
    if (paquet.startsWith('_') || glif.startsWith('m:')) continue;
    const [tipus, nom] = glif.split(':');
    const svg = tipus === 't' ? svgTabler(nom, gruix) : svgMarca(nom);
    if (!svg) { falten.push(`${paquet} -> ${glif}`); continue; }
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: MIDA } }).render().asPng();
    fs.writeFileSync(path.join(dir, paquet + '.png'), png);
  }
}
falten = [...new Set(falten)];
console.log(falten.length ? 'FALTEN:\n' + falten.join('\n') : 'Tots els glifs fets.');
