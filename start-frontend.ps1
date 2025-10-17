# Start Frontend Server
Write-Host "Starting Frontend Server (Next.js)..." -ForegroundColor Cyan
Write-Host ""

Set-Location agenda-frontend

Write-Host "Starting development server on http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
