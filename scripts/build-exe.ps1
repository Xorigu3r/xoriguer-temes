# Genera dist\XoriguerTemes-Instalador.exe (Windows, Electron + NSIS). Tot local: copia www\ dins de l'app.
#   npm run exe
$ErrorActionPreference = 'Stop'
$proj = Split-Path $PSScriptRoot -Parent
$esc  = Join-Path $proj 'escriptori'
New-Item -ItemType Directory -Force (Join-Path $proj 'dist') | Out-Null
$www = Join-Path $esc 'www'
if (Test-Path $www) { Remove-Item $www -Recurse -Force }
Copy-Item (Join-Path $proj 'www') $www -Recurse
Remove-Item (Join-Path $www 'capacitor.js'), (Join-Path $www 'sw.js') -ErrorAction SilentlyContinue
Push-Location $esc
try {
  if (-not (Test-Path node_modules)) { npm install --no-audit --no-fund }
  npx electron-builder --win nsis
  if ($LASTEXITCODE -ne 0) { throw "electron-builder ha fallat ($LASTEXITCODE)" }
} finally { Pop-Location }
$out = Join-Path $proj 'dist\XoriguerTemes-Instalador.exe'
Copy-Item (Join-Path $proj 'dist\escriptori\XoriguerTemes-Instalador.exe') $out -Force
Write-Host "EXE: $out"
