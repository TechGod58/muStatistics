param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$Root = [string]$Root
$Root = $Root.Trim().Trim('"')
$Root = [System.IO.Path]::GetFullPath($Root)
$runtimeStatePath = [System.IO.Path]::Combine($Root, 'data', 'portable-runtime.json')

if (-not (Test-Path $runtimeStatePath)) {
  Write-Host 'portable: stopped'
  exit 0
}

try {
  $state = Get-Content $runtimeStatePath -Raw | ConvertFrom-Json
} catch {
  Write-Host 'portable: invalid state'
  exit 1
}

$processId = [int]$state.pid
$url = [string]$state.url
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue

if (-not $process) {
  Write-Host "portable: stale state (pid $processId not running)"
  exit 1
}

try {
  $health = Invoke-WebRequest -UseBasicParsing "$url/health" -TimeoutSec 2
  if ($health.StatusCode -eq 200) {
    Write-Host "portable: running pid=$processId url=$url"
    exit 0
  }
} catch {
  Write-Host "portable: process running but health check failed pid=$processId url=$url"
  exit 1
}
