param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$ApiEntry = 'apps/api/dist/index.js',
  [string]$Url = 'http://127.0.0.1:4000'
)

$ErrorActionPreference = 'Stop'
$Root = [string]$Root
$Root = $Root.Trim().Trim('"')
$Root = [System.IO.Path]::GetFullPath($Root)

$envScript = Join-Path $Root 'scripts\portable\ensure-portable-env.ps1'
& $envScript -Root $Root

$dataRoot = Join-Path $Root 'data'
$runtimeStatePath = Join-Path $dataRoot 'portable-runtime.json'
New-Item -ItemType Directory -Path $dataRoot -Force | Out-Null

$bundledNodeCandidates = @(
  (Join-Path $Root 'runtime\node\node.exe'),
  (Join-Path (Split-Path $Root -Parent) 'runtime\node\node.exe')
)
$nodeExe = $bundledNodeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $nodeExe) {
  $nodeExe = 'node'
  if (Test-Path 'C:\Program Files\nodejs\node.exe') {
    $nodeExe = 'C:\Program Files\nodejs\node.exe'
  }
}

$env:MU_PORTABLE = '1'
$env:MU_SERVE_WEB = '1'
$env:MU_STORAGE_ROOT = $dataRoot
$env:MU_PORTABLE_DB_DIR = Join-Path $dataRoot 'portable-db'
$env:APP_ORIGIN = $Url
$env:PORT = '4000'

if (Test-Path $runtimeStatePath) {
  try {
    $existing = Get-Content $runtimeStatePath -Raw | ConvertFrom-Json
    if ($existing.pid) {
      $running = Get-Process -Id ([int]$existing.pid) -ErrorAction SilentlyContinue
      if ($running) {
        Start-Process $Url
        Write-Host "muStatistics portable is already running at $Url"
        exit 0
      }
    }
  } catch {
    # stale state; continue
  }
}

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $nodeExe
$startInfo.Arguments = $ApiEntry
$startInfo.WorkingDirectory = $Root
$startInfo.UseShellExecute = $false
$startInfo.Environment['MU_PORTABLE'] = '1'
$startInfo.Environment['MU_SERVE_WEB'] = '1'
$startInfo.Environment['MU_STORAGE_ROOT'] = $dataRoot
$startInfo.Environment['MU_PORTABLE_DB_DIR'] = (Join-Path $dataRoot 'portable-db')
$startInfo.Environment['APP_ORIGIN'] = $Url
$startInfo.Environment['PORT'] = '4000'

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $startInfo
[void]$process.Start()
$runtimeState = [ordered]@{
  pid = $process.Id
  url = $Url
  startedAt = (Get-Date).ToString('o')
  root = $Root
}
$runtimeState | ConvertTo-Json | Set-Content -Path $runtimeStatePath -Encoding UTF8

$healthy = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $response = Invoke-WebRequest -UseBasicParsing "$Url/health" -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
      $healthy = $true
      break
    }
  } catch {
    Start-Sleep -Milliseconds 250
  }
}

if (-not $healthy) {
  Write-Warning "muStatistics portable started, but health check did not complete in time."
}

Start-Process $Url
Write-Host "muStatistics portable is running at $Url"
