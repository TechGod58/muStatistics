param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$envPath = Join-Path $Root '.env'

if (Test-Path $envPath) {
  exit 0
}

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
"@ | Set-Content -Path $envPath -Encoding UTF8
