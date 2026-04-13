param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$Root = [string]$Root
$Root = $Root.Trim().Trim('"')
$Root = [System.IO.Path]::GetFullPath($Root)
$runtimeStatePath = [System.IO.Path]::Combine($Root, 'data', 'portable-runtime.json')

if (-not (Test-Path $runtimeStatePath)) {
  Write-Host 'No portable runtime state file found.'
  exit 0
}

try {
  $state = Get-Content $runtimeStatePath -Raw | ConvertFrom-Json
} catch {
  Remove-Item -LiteralPath $runtimeStatePath -Force -ErrorAction SilentlyContinue
  Write-Host 'Removed invalid portable runtime state.'
  exit 0
}

if ($state.pid) {
  $process = Get-Process -Id ([int]$state.pid) -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $process.Id -Force
    Write-Host "Stopped muStatistics portable PID $($process.Id)."
  } else {
    Write-Host 'Portable runtime process was not running.'
  }
}

Remove-Item -LiteralPath $runtimeStatePath -Force -ErrorAction SilentlyContinue
