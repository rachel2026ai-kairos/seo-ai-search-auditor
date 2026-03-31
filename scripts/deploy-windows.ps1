# OpenNext 在含中文路徑的專案目錄常無法完成建置；複製到 C:\deploy 後再 build + deploy。
$ErrorActionPreference = "Stop"
$src = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dst = "C:\deploy\ai-seo-website"
$env:NODE_OPTIONS = "--max-old-space-size=8192"
Remove-Item Env:SKIP_NEXT_APP_BUILD -ErrorAction SilentlyContinue

Write-Host "Copying from: $src"
if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
New-Item -ItemType Directory -Path $dst -Force | Out-Null
robocopy $src $dst /E /XD node_modules .next .open-next .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }

Set-Location $dst
npm ci --no-audit
npm run cf:build
npx opennextjs-cloudflare deploy
Write-Host "Done. Worker: ai-seo-website"
