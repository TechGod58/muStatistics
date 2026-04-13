param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$NodeSource = 'C:\Program Files\nodejs'
)

$ErrorActionPreference = 'Stop'
$Root = [string]$Root
$Root = $Root.Trim().Trim('"')
$Root = [System.IO.Path]::GetFullPath($Root)
$runtimeRoot = Join-Path $Root 'runtime\node'

if (-not (Test-Path (Join-Path $NodeSource 'node.exe'))) {
  throw "Could not find node.exe under $NodeSource."
}

New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
Copy-Item -Path (Join-Path $NodeSource '*') -Destination $runtimeRoot -Recurse -Force

Write-Host "Embedded Node runtime at $runtimeRoot"
