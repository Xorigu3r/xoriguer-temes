// Xoriguer Temes per a Windows (Electron). La web de www/ va dins de l'instal·lador i es serveix amb app://.
// El telèfon es controla amb adb (Android platform-tools): el que ja hi hagi a l'ordinador o el que es descarregui
// de Google a la carpeta de dades de l'app.
const { app, BrowserWindow, Menu, shell, protocol, net, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');

const WWW = path.join(__dirname, 'www');
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };
const PLATFORM_TOOLS = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
if (!app.requestSingleInstanceLock()) app.quit();

let finestra = null;

// ------------------------------------------------------------ adb
function candidatsAdb() {
  const c = [];
  for (const v of ['ANDROID_HOME', 'ANDROID_SDK_ROOT']) if (process.env[v]) c.push(path.join(process.env[v], 'platform-tools', 'adb.exe'));
  c.push(path.join(app.getPath('userData'), 'platform-tools', 'adb.exe'));
  if (process.env.LOCALAPPDATA) c.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe'));
  c.push(path.join(os.homedir(), 'android-tools', 'sdk', 'platform-tools', 'adb.exe'));
  c.push('C:\\platform-tools\\adb.exe', 'C:\\Android\\platform-tools\\adb.exe');
  for (const d of (process.env.PATH || '').split(';')) if (d) c.push(path.join(d, 'adb.exe'));
  return c;
}
let ADB = null;
function trobaAdb() {
  if (ADB && fs.existsSync(ADB)) return ADB;
  ADB = candidatsAdb().find((f) => { try { return fs.existsSync(f); } catch { return false; } }) || null;
  return ADB;
}
function adb(args, opcions) {
  return new Promise((ok, ko) => {
    const a = trobaAdb();
    if (!a) return ko(new Error('sense-adb'));
    execFile(a, args, { windowsHide: true, timeout: (opcions && opcions.timeout) || 30000, maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' },
      (err, out, errOut) => (err && !(opcions && opcions.ignora) ? ko(new Error((errOut || err.message).trim())) : ok(String(out))));
  });
}
async function dispositiu() {
  const out = await adb(['devices']);
  const linies = out.split(/\r?\n/).slice(1).map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 2);
  const bo = linies.find((p) => p[1] === 'device');
  if (bo) return { serie: bo[0] };
  if (linies.some((p) => p[1] === 'unauthorized')) return { noAutoritzat: true };
  return null;
}

ipcMain.handle('info', async () => {
  if (!trobaAdb()) return { connectat: false, sensAdb: true };
  let d;
  try { d = await dispositiu(); } catch { return { connectat: false, sensAdb: true }; }
  if (!d) return { connectat: false };
  if (d.noAutoritzat) return { connectat: false, noAutoritzat: true };
  const props = ['ro.product.model', 'ro.product.marketname', 'ro.product.vendor.marketname', 'ro.product.manufacturer',
    'ro.miui.ui.version.name', 'ro.mi.os.version.name'];
  const out = await adb(['-s', d.serie, 'shell', props.map((p) => `getprop ${p}`).join(';') + ';wm size']);
  const l = out.split(/\r?\n/).map((x) => x.trim());
  const [model, mk1, mk2, marca, miui, hyper] = l;
  const mida = out.match(/Override size:\s*(\d+)x(\d+)/) || out.match(/Physical size:\s*(\d+)x(\d+)/) || [0, 1080, 2400];
  const W = Math.min(+mida[1], +mida[2]), H = Math.max(+mida[1], +mida[2]);
  let versio = '';
  if (hyper) versio = 'HyperOS ' + hyper.replace('OS', '');
  else if (miui) { const dd = miui.replace(/\D/g, ''); versio = 'MIUI ' + (dd.length >= 3 ? dd.slice(0, 2) + (dd[2] !== '0' ? '.' + dd[2] : '') : dd); }
  return {
    connectat: true, serie: d.serie, model, nom: mk1 || mk2 || `${marca} ${model}`, W, H, miui: versio,
    avis: versio ? '' : 'Aquest telèfon no és un Xiaomi: el tema només funciona amb MIUI.',
  };
});

ipcMain.handle('apps', async () => {
  const d = await dispositiu();
  if (!d || !d.serie) return null;
  const out = await adb(['-s', d.serie, 'shell', 'cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER']);
  const paquets = [...new Set(out.split(/\r?\n/).map((x) => x.trim()).filter((x) => x.includes('/')).map((x) => x.split('/')[0]))];
  return paquets.map((p) => ({ paquet: p }));
});

ipcMain.handle('desa', async (e, { nom, dades }) => {
  const r = await dialog.showSaveDialog(finestra, { defaultPath: path.join(app.getPath('documents'), nom), filters: [{ name: 'Tema MIUI', extensions: ['mtz'] }] });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, Buffer.from(dades));
  return { ok: true, cami: r.filePath };
});

ipcMain.handle('aplica', async (e, { nom, dades }) => {
  const d = await dispositiu();
  if (!d || !d.serie) return { ok: false, missatge: 'No hi ha cap telèfon connectat.' };
  const tmp = path.join(os.tmpdir(), 'xoriguer-temes-' + nom.replace(/[^\w.-]/g, '_'));
  fs.writeFileSync(tmp, Buffer.from(dades));
  // El gestor de temes només pot llegir la seva carpeta (no Descàrregues)
  const dir = '/sdcard/Android/data/com.android.thememanager/files/xoriguer';
  const desti = `${dir}/${path.basename(tmp)}`;
  const s = ['-s', d.serie];
  try {
    await adb([...s, 'shell', 'mkdir', '-p', dir]);
    await adb([...s, 'push', tmp, desti], { timeout: 120000 });
    // si el gestor ja era obert, només el portaria al davant: el tanquem i obrim una tasca nova
    await adb([...s, 'shell', 'am', 'force-stop', 'com.android.thememanager']);
    await adb([...s, 'shell', 'am', 'start', '--activity-clear-task', '-f', '0x10008000', '-n',
      'com.android.thememanager/.ApplyThemeForScreenshot', '-e', 'theme_file_path', desti, '-e', 'api_called_from', 'xoriguer-temes']);
    await new Promise((r) => setTimeout(r, 11000));
    await adb([...s, 'shell', 'input', 'keyevent', 'KEYCODE_HOME'], { ignora: true });
    const desc = await adb([...s, 'shell', 'cat', '/data/system/theme/description.xml'], { ignora: true });
    return { ok: true, titol: (desc.match(/<title>([^<]*)<\/title>/) || [])[1] || '' };
  } catch (err) {
    return { ok: false, missatge: err.message };
  } finally { fs.rm(tmp, () => {}); }
});

ipcMain.handle('descarrega-adb', async () => {
  const dest = app.getPath('userData');
  const zip = path.join(dest, 'platform-tools.zip');
  const r = await net.fetch(PLATFORM_TOOLS);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  await new Promise((ok, ko) => execFile('powershell.exe', ['-NoProfile', '-Command',
    `Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`],
  { windowsHide: true, timeout: 180000 }, (err) => (err ? ko(err) : ok())));
  fs.rm(zip, () => {});
  ADB = null;
  return !!trobaAdb();
});
ipcMain.on('obre-extern', (e, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });
// Comprovar versions sense problemes de CORS
ipcMain.handle('busca', async (e, url) => {
  if (!/^https:\/\/xoriguer\.dev\//.test(url)) throw new Error('url');
  const r = await net.fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
});

// ------------------------------------------------------------ finestra
function crea() {
  finestra = new BrowserWindow({
    width: 1100, height: 900, minWidth: 380, minHeight: 520, backgroundColor: '#1E2A3B', title: 'Xoriguer Temes',
    icon: path.join(__dirname, 'icona.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  Menu.setApplicationMenu(null);
  finestra.loadURL('app://local/index.html');
  finestra.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  finestra.on('closed', () => { finestra = null; });
}
app.on('second-instance', () => { if (finestra) { if (finestra.isMinimized()) finestra.restore(); finestra.focus(); } });
app.whenReady().then(() => {
  protocol.handle('app', async (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html';
    const fitxer = path.normalize(path.join(WWW, rel));
    if (!fitxer.startsWith(WWW)) return new Response('', { status: 403 });
    try {
      const r = await net.fetch(pathToFileURL(fitxer).toString());
      const tipus = MIME[path.extname(fitxer).toLowerCase()];
      return new Response(r.body, { status: r.status, headers: tipus ? { 'Content-Type': tipus } : r.headers });
    } catch { return new Response('', { status: 404 }); }
  });
  crea();
});
app.on('window-all-closed', () => app.quit());
