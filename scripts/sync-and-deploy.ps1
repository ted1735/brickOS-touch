# scripts/sync-and-deploy.ps1
param(
    [string]$CommitMessage = "Update brickOS-Touch and sync to server"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

Push-Location $root
try {
    Write-Host "==========================================" -ForegroundColor Magenta
    Write-Host "   brickOS-Touch: GitHub Sync & Deploy    " -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta

    # 1. Sync with GitHub
    Write-Host "[1/4] Syncing with GitHub (origin/main)..." -ForegroundColor Cyan
    git add -A
    $status = git status --porcelain
    if ($status) {
        git commit -m "$CommitMessage"
        Write-Host "  -> Committed local changes: $CommitMessage" -ForegroundColor Gray
    } else {
        Write-Host "  -> Working tree clean, checking remote..." -ForegroundColor Gray
    }
    git pull --rebase origin main
    git push origin main
    Write-Host "  -> Successfully pushed to https://github.com/ted1735/brickOS-touch" -ForegroundColor Green

    # 2. Run Deploy Script (Build, Package, Transfer & Restart)
    Write-Host "[2/4] Triggering automated deployment to CT 120 (port 3001)..." -ForegroundColor Cyan
    & "$PSScriptRoot\deploy.ps1"
} finally {
    Pop-Location
}
