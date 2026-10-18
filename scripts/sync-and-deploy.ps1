# scripts/sync-and-deploy.ps1
param(
    [string]$CommitMessage = "Update brickOS dashboard and sync to server"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

Push-Location $root
try {
    Write-Host "==========================================" -ForegroundColor Magenta
    Write-Host "   brickOS: GitHub Sync and Deployment" -ForegroundColor Magenta
    Write-Host "==========================================" -ForegroundColor Magenta

    # 1. Sync with GitHub
    Write-Host "[1/4] Syncing with GitHub..." -ForegroundColor Cyan
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
    Write-Host "  -> Successfully pushed to origin/main" -ForegroundColor Green

    # 2. Run Deploy Script (Build, Package, Transfer & Restart)
    Write-Host "[2/4] Triggering automated deployment to CT 120..." -ForegroundColor Cyan
    & "$PSScriptRoot\deploy.ps1"
} finally {
    Pop-Location
}
