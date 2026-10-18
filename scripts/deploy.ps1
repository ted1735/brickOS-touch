# scripts/deploy.ps1
param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

Push-Location $root
try {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   brickOS: Production Deploy (CT 120)    " -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    if (-not $SkipBuild) {
        Write-Host "🔨 [1/4] Building production bundle..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed!" }
        Write-Host "  -> Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⏩ [1/4] Skipping build as requested..." -ForegroundColor Yellow
    }

    Write-Host "📦 [2/4] Packaging deployment bundle..." -ForegroundColor Cyan
    $tarPath = "$root\brickos_dist.tar.gz"
    tar -czf "$tarPath" -C "$root" dist package.json
    $tarSize = [math]::Round((Get-Item $tarPath).Length / 1MB, 2)
    Write-Host "  -> Created archive ($tarSize MB)" -ForegroundColor Green

    Write-Host "🚀 [3/4] Uploading directly to Nextcloud container (192.168.1.121)..." -ForegroundColor Cyan
    scp -o StrictHostKeyChecking=no "$tarPath" root@192.168.1.121:/var/www/brickos-webdashboard/brickos_dist.tar.gz
    Remove-Item "$tarPath" -Force
    Write-Host "  -> Transfer complete!" -ForegroundColor Green

    Write-Host "🔄 [4/4] Extracting, updating permissions & restarting service..." -ForegroundColor Cyan
    $remoteCmd = "cd /var/www/brickos-webdashboard && tar -xzf brickos_dist.tar.gz && rm -f brickos_dist.tar.gz && chown -R www-data:www-data /var/www/brickos-webdashboard && systemctl restart brickos.service && systemctl is-active brickos.service"
    ssh -o StrictHostKeyChecking=no root@192.168.1.121 "$remoteCmd"
    if ($LASTEXITCODE -ne 0) { throw "Remote deployment failed!" }

    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   SUCCESS: Deployed & Active on Production!" -ForegroundColor Green
    Write-Host "   URL: https://brickos.moyercloud.com" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
