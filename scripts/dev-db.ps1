# Starts a dev-only, single-node MongoDB replica set on port 27018.
#
# Why: Prisma's MongoDB connector requires a replica set (used for
# transactions in signup/escalation/document ingestion). The MongoDB
# Windows service installed on this machine runs as a plain standalone
# server on port 27017, and reconfiguring a Windows service requires
# admin rights. Rather than touching the system service, this script
# runs a second mongod as a normal user process, storing its data under
# %LOCALAPPDATA%\supportai-devdb, completely separate from the service's
# data on port 27017.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\dev-db.ps1
#
# Leave the resulting window/process running while you run `npm run dev`.
# DATABASE_URL in .env should point at:
#   mongodb://localhost:27018/supportai?replicaSet=rs0

$ErrorActionPreference = "Stop"

$mongod = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dataPath = "$env:LOCALAPPDATA\supportai-devdb\rs0"
$logPath = "$env:LOCALAPPDATA\supportai-devdb\mongod.log"
$port = 27018

if (-not (Test-Path $mongod)) {
    Write-Error "mongod.exe not found at $mongod — update the path in this script if MongoDB is installed elsewhere."
    exit 1
}

New-Item -ItemType Directory -Path $dataPath -Force | Out-Null

$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Output "Something is already listening on port $port — assuming the dev mongod is already running."
    exit 0
}

Write-Output "Starting dev mongod (replSet rs0) on port $port ..."
Start-Process -FilePath $mongod `
  -ArgumentList "--dbpath", "`"$dataPath`"", "--replSet", "rs0", "--port", "$port", "--bind_ip", "127.0.0.1", "--logpath", "`"$logPath`"" `
  -WindowStyle Hidden

Start-Sleep -Seconds 3

# Initiate the replica set if it hasn't been already (safe to call repeatedly;
# already-initiated is just a harmless error on subsequent runs).
& npx mongosh --port $port --quiet --eval "try { rs.initiate() } catch (e) { print('rs.initiate: ' + e.codeName) }" 2>$null

Write-Output "Dev MongoDB replica set ready at mongodb://localhost:$port/supportai?replicaSet=rs0"
Write-Output "Log file: $logPath"
