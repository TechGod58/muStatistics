param(
  [string]$OutputRoot = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path 'portable\muStatistics-portable')
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$deployRoot = Join-Path $OutputRoot 'app'
$nodeSource = 'C:\Program Files\nodejs'
$runtimeRoot = Join-Path $OutputRoot 'runtime\node'

Write-Host "Building workspace..."
pnpm -r build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Path $OutputRoot) {
  Remove-Item -LiteralPath $OutputRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputRoot | Out-Null

Write-Host "Deploying API runtime..."
pnpm --filter @mu/api --prod deploy --legacy $deployRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Copying built web assets..."
$webTarget = Join-Path $deployRoot 'apps\web\dist'
New-Item -ItemType Directory -Path $webTarget -Force | Out-Null
Copy-Item -Path (Join-Path $repoRoot 'apps\web\dist\*') -Destination $webTarget -Recurse -Force

Write-Host "Repointing internal workspace packages to built dist..."
$internalPackagesRoot = Join-Path $deployRoot 'node_modules\@mu'
if (Test-Path $internalPackagesRoot) {
  Get-ChildItem $internalPackagesRoot -Directory | ForEach-Object {
    $packageJsonPath = Join-Path $_.FullName 'package.json'
    $distEntry = Join-Path $_.FullName 'dist\index.js'
    if ((Test-Path $packageJsonPath) -and (Test-Path $distEntry)) {
      $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
      $packageJson.main = 'dist/index.js'
      $packageJson.types = 'dist/index.d.ts'
      $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath -Encoding UTF8
    }
  }
}

Write-Host "Copying portable scripts..."
$portableScriptsTarget = Join-Path $deployRoot 'scripts\portable'
New-Item -ItemType Directory -Path $portableScriptsTarget -Force | Out-Null
Copy-Item -Path (Join-Path $repoRoot 'scripts\portable\ensure-portable-env.ps1') -Destination $portableScriptsTarget -Force
Copy-Item -Path (Join-Path $repoRoot 'scripts\portable\start-portable.ps1') -Destination $portableScriptsTarget -Force
Copy-Item -Path (Join-Path $repoRoot 'scripts\portable\stop-portable.ps1') -Destination $portableScriptsTarget -Force
Copy-Item -Path (Join-Path $repoRoot 'scripts\portable\status-portable.ps1') -Destination $portableScriptsTarget -Force
Copy-Item -Path (Join-Path $repoRoot 'scripts\portable\install-shortcut.ps1') -Destination $portableScriptsTarget -Force

Write-Host "Copying Axion sidecar assets..."
$axionTarget = Join-Path $deployRoot 'services\axion'
New-Item -ItemType Directory -Path $axionTarget -Force | Out-Null
Copy-Item -Path (Join-Path $repoRoot 'services\axion\axion_sidecar.py') -Destination $axionTarget -Force
Copy-Item -Path (Join-Path $repoRoot 'services\axion\parallel_cubed_region_genome.json') -Destination $axionTarget -Force

Write-Host "Writing portable app environment..."
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
@"
MU_PORTABLE=1
MU_SERVE_WEB=1
MU_STORAGE_ROOT=./data
MU_PORTABLE_DB_DIR=./data/portable-db
APP_ORIGIN=http://127.0.0.1:4000
PORT=4000
SESSION_SECRET=$secret
MU_AXION_SIDECAR_ENABLED=1
MU_AXION_SIDECAR_AUTOSTART=1
MU_AXION_SIDECAR_URL=http://127.0.0.1:8765
MU_AXION_SIDECAR_SCRIPT_PATH=./services/axion/axion_sidecar.py
MU_AXION_PARALLEL_CUBED_GENOME=./services/axion/parallel_cubed_region_genome.json
MU_AXION_PYTHON_COMMAND=py
MU_AXION_PYTHON_ARGS=-3.11
MU_AXION_PREFILTER_ENABLED=1
MU_AXION_PREFILTER_MIN_SCORE=0.08
MU_AXION_QECC_GUARD_ENABLED=1
"@ | Set-Content -Path (Join-Path $deployRoot '.env') -Encoding UTF8

$launcherPath = Join-Path $OutputRoot 'start-portable.cmd'
@"
@echo off
setlocal
set "ROOT=%~dp0app"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\portable\start-portable.ps1" -Root "%ROOT%" -ApiEntry "dist/index.js"
"@ | Set-Content -Path $launcherPath -Encoding ASCII

$stopLauncherPath = Join-Path $OutputRoot 'stop-portable.cmd'
@"
@echo off
setlocal
set "ROOT=%~dp0app"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\portable\stop-portable.ps1" -Root "%ROOT%"
"@ | Set-Content -Path $stopLauncherPath -Encoding ASCII

$statusLauncherPath = Join-Path $OutputRoot 'status-portable.cmd'
@"
@echo off
setlocal
set "ROOT=%~dp0app"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\portable\status-portable.ps1" -Root "%ROOT%"
"@ | Set-Content -Path $statusLauncherPath -Encoding ASCII

$shortcutInstallerPath = Join-Path $OutputRoot 'install-desktop-shortcut.cmd'
@"
@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\scripts\portable\install-shortcut.ps1" -BundleRoot "%~dp0"
"@ | Set-Content -Path $shortcutInstallerPath -Encoding ASCII

if (Test-Path $nodeSource) {
  Write-Host "Copying local Node runtime..."
  New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
  Copy-Item -Path (Join-Path $nodeSource '*') -Destination $runtimeRoot -Recurse -Force
}

Write-Host "Writing portable README..."
@"
muStatistics portable bundle

Start:
  start-portable.cmd

Control:
  status-portable.cmd
  stop-portable.cmd
  install-desktop-shortcut.cmd

This bundle runs in single-user portable mode:
  - embedded local database
  - built-in web serving from the API
  - local data stored under app\data

URL:
  http://127.0.0.1:4000
"@ | Set-Content -Path (Join-Path $OutputRoot 'README.txt') -Encoding ASCII
