# Compila l'APK (release, firmat amb la clau de ~/android-tools/claus) amb el JDK i l'SDK de ~/android-tools.
$ErrorActionPreference = 'Stop'
$tools = Join-Path $HOME 'android-tools'
# Capacitor 8 demana JDK 21: el de ~/android-tools (el JAVA_HOME del sistema és 17)
$env:JAVA_HOME = Join-Path $tools 'jdk'
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $tools 'sdk' }
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
if (-not (Test-Path (Join-Path $tools 'claus\temes.properties'))) {
  Write-Warning "No hi ha la clau (~/android-tools/claus/pdf.properties): l'APK sortirà firmat amb la clau de debug."
}

$android = Join-Path $PSScriptRoot '..\android'
# Gradle llegeix l'SDK de local.properties (barres invertides escapades)
"sdk.dir=$($env:ANDROID_HOME -replace '\\','\\')" | Set-Content -Encoding ascii (Join-Path $android 'local.properties')

Push-Location $android
try {
  & .\gradlew.bat assembleRelease --no-daemon
  if ($LASTEXITCODE -ne 0) { throw "Gradle ha fallat ($LASTEXITCODE)" }
} finally { Pop-Location }

$apk = Join-Path $android 'app\build\outputs\apk\release\app-release.apk'
$out = Join-Path $PSScriptRoot '..\dist\XoriguerTemes.apk'
Copy-Item $apk $out -Force
Write-Host "APK: $((Resolve-Path $out).Path)"
