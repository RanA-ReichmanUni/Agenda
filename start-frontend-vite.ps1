# Start Frontend Server (Vite)
Write-Host "Starting Frontend Server (Vite) ..." -ForegroundColor Cyan
Write-Host ""

Set-Location frontend

Write-Host "Starting development server on http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
