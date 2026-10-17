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
    Write-Host "[1/5] Syncing with GitHub..." -ForegroundColor Cyan
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

    # 2. Build production assets
    Write-Host "[2/5] Building production bundle (Vite + esbuild)..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed!" }
    Write-Host "  -> Build succeeded!" -ForegroundColor Green

    # 3. Package bundle
    Write-Host "[3/5] Packaging deployment archive..." -ForegroundColor Cyan
    $tarPath = "$root\brickos_dist.tar.gz"
    tar -czf "$tarPath" -C "$root" dist package.json
    $tarSize = [math]::Round((Get-Item $tarPath).Length / 1MB, 2)
    Write-Host "  -> Archive created ($tarSize MB)" -ForegroundColor Gray

    # 4. Upload to Proxmox
    Write-Host "[4/5] Uploading to Nextcloud server (CT 120)..." -ForegroundColor Cyan
    scp -o StrictHostKeyChecking=no "$tarPath" root@192.168.1.91:/tmp/brickos_dist.tar.gz
    Remove-Item "$tarPath" -Force

    # 5. Extract and Restart
    Write-Host "[5/5] Deploying on container and restarting service..." -ForegroundColor Cyan
    ssh -o StrictHostKeyChecking=no root@192.168.1.91 "
        pct push 120 /tmp/brickos_dist.tar.gz /var/www/brickos-webdashboard/brickos_dist.tar.gz
        rm -f /tmp/brickos_dist.tar.gz
        pct exec 120 -- bash -c '
            cd /var/www/brickos-webdashboard
            tar -xzf brickos_dist.tar.gz
            rm -f brickos_dist.tar.gz
            npm install --omit=dev
            chown -R www-data:www-data /var/www/brickos-webdashboard
            systemctl restart brickos
        '
        pct exec 120 -- systemctl is-active brickos
    "

    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   SUCCESS: Synced with GitHub and live at:" -ForegroundColor Green
    Write-Host "   https://brickos.moyercloud.com" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
