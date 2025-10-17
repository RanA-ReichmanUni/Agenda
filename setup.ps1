# Agenda Project Setup Script
# This script helps you set up the project quickly

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Agenda Project Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check Node
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Setting up Backend (Python FastAPI)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Setup Backend
Set-Location backend

Write-Host "Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Setting up environment file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file (please update with your database credentials)" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Setting up Frontend (Next.js)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Setup Frontend
Set-Location agenda-frontend

Write-Host "Installing Node dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Setting up environment file..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    "NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local file already exists" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🎉" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update database credentials in backend/.env" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "   python main.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. In a NEW terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd agenda-frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "Or use Docker:" -ForegroundColor White
Write-Host "   docker-compose up --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more information, see QUICKSTART.md" -ForegroundColor Yellow
Write-Host ""
