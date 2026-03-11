param(
  [string]$OutputDir
)

$ErrorActionPreference = 'Stop'

$envPath = Join-Path $PSScriptRoot '..\..\server\.env'
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $parts = $line.Split('=', 2)
    if ($parts.Length -ne 2) { return }
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if (-not (Get-Item "Env:$key" -ErrorAction SilentlyContinue)) {
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

$mongoUri = $env:MONGO_URI_PRIMARY
if (-not $mongoUri) { $mongoUri = $env:MONGO_URI }
if (-not $mongoUri) { throw 'MONGO_URI_PRIMARY or MONGO_URI must be set.' }

$root = if ($OutputDir) { $OutputDir } elseif ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path $PSScriptRoot '..\..\backup_dumps' }
if (-not (Test-Path $root)) { New-Item -ItemType Directory -Force -Path $root | Out-Null }
$root = (Resolve-Path $root).Path

if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
  throw 'mongodump not found in PATH. Install MongoDB Database Tools.'
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpPath = Join-Path $root $timestamp

New-Item -ItemType Directory -Force -Path $dumpPath | Out-Null

Write-Host "Dumping primary cluster to $dumpPath"
& mongodump --uri "$mongoUri" --out "$dumpPath"

Write-Host "Backup complete: $dumpPath"
