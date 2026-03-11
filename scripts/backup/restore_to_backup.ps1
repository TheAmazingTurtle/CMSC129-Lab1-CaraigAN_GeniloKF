param(
  [string]$DumpPath
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

$backupUri = $env:MONGO_URI_BACKUP
if (-not $backupUri) { throw 'MONGO_URI_BACKUP must be set.' }

$root = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path $PSScriptRoot '..\..\backup_dumps' }
if (-not (Test-Path $root)) { New-Item -ItemType Directory -Force -Path $root | Out-Null }
$root = (Resolve-Path $root).Path

if (-not $DumpPath) {
  $latest = Get-ChildItem -Directory -Path $root | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $latest) { throw "No dumps found in $root" }
  $DumpPath = $latest.FullName
}

if (-not (Test-Path $DumpPath)) { throw "Dump path not found: $DumpPath" }

if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
  throw 'mongorestore not found in PATH. Install MongoDB Database Tools.'
}

Write-Host "Restoring dump from $DumpPath to backup cluster"
& mongorestore --uri "$backupUri" --drop "$DumpPath"

Write-Host 'Restore complete.'
