# Aplica un tema Xoriguer al Xiaomi connectat per USB (MIUI 14, depuració USB activada).
# Ús:  .\posa_tema.ps1 Pissarra      (o Taronja, Crema)
#      .\posa_tema.ps1 Pissarra -Refes   (torna a generar els temes abans)
param(
    [Parameter(Mandatory = $true)][ValidateSet('Pissarra', 'Taronja', 'Crema', 'Color', 'Color3D', 'PissarraColor')][string]$Versio,
    [switch]$Refes
)
$ErrorActionPreference = 'Stop'
$adb = "C:\Users\Xorigu3r\android-tools\sdk\platform-tools\adb.exe"
$arrel = $PSScriptRoot

if ($Refes) {
    Push-Location $arrel
    node eines/glifs.mjs
    python eines/fes_temes.py
    Pop-Location
}

# El gestor de temes només pot llegir la seva pròpia carpeta (no Descàrregues).
$desti = "/sdcard/Android/data/com.android.thememanager/files/xoriguer"
& $adb shell mkdir -p $desti | Out-Null
& $adb push "$arrel\temes\Xoriguer-$Versio.mtz" "$desti/Xoriguer-$Versio.mtz" | Out-Null

# Activitat interna del gestor de temes que aplica un .mtz directament.
# Primer el tanquem: si ja era obert, només el porta al davant i no aplica res.
& $adb shell am force-stop com.android.thememanager
& $adb shell am start --activity-clear-task -f 0x10008000 -n com.android.thememanager/.ApplyThemeForScreenshot `
    -e theme_file_path "$desti/Xoriguer-$Versio.mtz" -e api_called_from xoriguer | Out-Null
Write-Host "Aplicant Xoriguer $Versio... (la pantalla del mòbil es congela uns segons)"
Start-Sleep 10
& $adb shell input keyevent KEYCODE_HOME
Write-Host "Fet."
