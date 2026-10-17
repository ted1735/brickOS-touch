# scripts/deploy.ps1
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "🔨 [1/4] Building production bundle..." -ForegroundColor Cyan
Push-Location $root
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }

    Write-Host "📦 [2/4] Packaging deployment bundle..." -ForegroundColor Cyan
    $tarPath = "$root\brickos_dist.tar.gz"
    tar -czf $tarPath -C $root dist package.json

    Write-Host "🚀 [3/4] Uploading to Proxmox Nextcloud server..." -ForegroundColor Cyan
    scp -o StrictHostKeyChecking=no $tarPath root@192.168.1.91:/tmp/brickos_dist.tar.gz
    Remove-Item $tarPath -Force

    Write-Host "🔄 [4/4] Deploying on container & restarting service..." -ForegroundColor Cyan
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
        pct exec 120 -- systemctl status brickos --no-pager
    "

    Write-Host "✅ [brickOS] Successfully deployed to https://brickos.moyercloud.com!" -ForegroundColor Green
} finally {
    Pop-Location
}
