$required = @(
  'apps',
  'packages',
  'docs',
  'services',
  'infrastructure',
  'data',
  'scripts',
  'tests',
  'package.json',
  'pnpm-workspace.yaml'
)

$missing = @()
foreach ($path in $required) {
  if (-not (Test-Path $path)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Missing required paths: " + ($missing -join ', '))
  exit 1
}

Write-Host 'Structure verified.'
