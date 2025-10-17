# 🚀 Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.11 or higher
- ✅ Node.js 18 or higher
- ✅ PostgreSQL 15 (or use Docker)
- ✅ Git

Check your versions:
```powershell
python --version
node --version
psql --version
```

---

## 🐳 Option 1: Docker (Easiest)

### 1. Start Everything
```powershell
docker-compose up --build
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. Stop Services
```powershell
docker-compose down
```

---

## 💻 Option 2: Local Development (Recommended for Development)

### Step 1: Setup Backend (Python FastAPI)

1. **Open PowerShell and navigate to backend**
   ```powershell
   cd backend
   ```

2. **Create virtual environment**
   ```powershell
   python -m venv venv
   ```

3. **Activate virtual environment**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get an execution policy error:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Setup database** (if not using Docker)
   ```powershell
   # Open PostgreSQL and create database
   psql -U postgres
   CREATE DATABASE agenda_db;
   \q
   ```

6. **Configure environment**
   ```powershell
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your database credentials
   notepad .env
   ```

7. **Run the backend**
   ```powershell
   python main.py
   ```
   
   You should see:
   ```
   ✅ Database initialized
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

8. **Test the API**
   Open browser: http://localhost:8000/docs

---

### Step 2: Setup Frontend (Next.js)

1. **Open a NEW PowerShell window and navigate to frontend**
   ```powershell
   cd agenda-frontend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment**
   ```powershell
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. **Run the frontend**
   ```powershell
   npm run dev
   ```
   
   You should see:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   ```

5. **Open the application**
   Navigate to: http://localhost:3000

---

## ✅ Verify Everything Works

### 1. Check Backend Health
```powershell
curl http://localhost:8000
```
Should return: `{"message":"Agenda Backend API is running",...}`

### 2. Test Frontend
- Go to http://localhost:3000
- You should see the Agenda homepage
- Try creating a new agenda

### 3. Test Metadata Extraction
- Create an agenda
- Click on the agenda to open it
- Try adding an article with a URL (e.g., https://example.com)

---

## 🛠️ Troubleshooting

### Backend Issues

**Problem**: "Import could not be resolved"
```powershell
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

**Problem**: Database connection error
```powershell
# Check PostgreSQL is running
# Update .env with correct credentials
notepad .env
```

**Problem**: Port 8000 already in use
```powershell
# Find and kill the process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend Issues

**Problem**: Port 3000 already in use
```powershell
# Kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Problem**: "Module not found"
```powershell
# Clear node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

**Problem**: Frontend can't connect to backend
```powershell
# Check .env.local file exists
cat .env.local

# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Restart frontend dev server
```

---

## 📝 Common Commands

### Backend Commands
```powershell
# Activate virtual environment
cd backend
.\venv\Scripts\Activate.ps1

# Run backend
python main.py

# Install new package
pip install <package-name>
pip freeze > requirements.txt

# Deactivate virtual environment
deactivate
```

### Frontend Commands
```powershell
# Run development server
cd agenda-frontend
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Install new package
npm install <package-name>
```

### Docker Commands
```powershell
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild containers
docker-compose up --build

# View logs
docker-compose logs -f

# Access backend container
docker-compose exec backend bash

# Access database
docker-compose exec postgres psql -U agenda_user -d agenda_db
```

---

## 🎯 Next Steps

1. **Explore the API Documentation**
   - Visit http://localhost:8000/docs
   - Try out different endpoints

2. **Create Your First Agenda**
   - Go to http://localhost:3000
   - Click "Create New Agenda"
   - Add some articles

3. **Read the Full Documentation**
   - Check out the main README.md
   - Review backend/README.md for API details

4. **Start Developing**
   - Make changes to the code
   - Both frontend and backend have hot-reload enabled

---

## 📞 Need Help?

- **API Documentation**: http://localhost:8000/docs
- **Backend README**: `backend/README.md`
- **Main README**: `README.md`

---

**Happy Coding! 🚀**
