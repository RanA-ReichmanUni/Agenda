# Agenda Backend (Python FastAPI)

Modern Python backend for the Agenda application using FastAPI.

## Features

- ✅ FastAPI framework (async, fast, modern)
- ✅ Automatic API documentation (Swagger/OpenAPI)
- ✅ PostgreSQL database integration
- ✅ Metadata extraction from URLs
- ✅ RESTful API design
- ✅ Type hints and validation with Pydantic

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows PowerShell:**
```powershell
venv\Scripts\Activate.ps1
```

**Windows CMD:**
```cmd
venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

### 5. Run the Server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## API Endpoints

### Metadata Extraction
- `POST /api/extract` - Extract metadata from a URL

### Agendas
- `GET /agendas` - Get all agendas
- `GET /agendas/{id}` - Get single agenda
- `POST /agendas` - Create new agenda
- `DELETE /agendas/{id}` - Delete agenda

### Articles
- `GET /agendas/{id}/articles` - Get articles for an agenda
- `POST /agendas/{id}/articles` - Create article for an agenda
- `DELETE /articles/{id}` - Delete article

## Project Structure

```
backend/
├── main.py              # FastAPI application & routes
├── models.py            # Pydantic models
├── database.py          # Database connection & initialization
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

## Tech Stack

- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **PostgreSQL** - Database
- **psycopg2** - PostgreSQL adapter
- **BeautifulSoup4** - HTML parsing
- **Pydantic** - Data validation
