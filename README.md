# Agenda Application

A full-stack application for creating and managing agendas with articles. Built with **Python FastAPI** backend and **Next.js** frontend.

## 🎯 Project Overview

This application allows users to:
- Create and manage multiple agendas
- Add articles to agendas with automatic metadata extraction
- Organize and visualize content
- Build narratives and prove points with curated articles

## 🏗️ Architecture

### Backend (Python FastAPI)
- **Framework**: FastAPI (modern, fast, async)
- **Database**: PostgreSQL
- **Features**:
  - RESTful API design
  - Automatic metadata extraction from URLs
  - OpenAPI/Swagger documentation
  - Type validation with Pydantic
  - CORS enabled for frontend

### Frontend (Next.js)
- **Framework**: Next.js 14+ with React
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Features**:
  - Server-side rendering
  - Responsive design
  - Modern UI with glassmorphism effects

## 📁 Project Structure

```
Agenda/
├── backend/                  # Python FastAPI Backend
│   ├── main.py              # Main application & routes
│   ├── models.py            # Pydantic models
│   ├── database.py          # Database connection
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Docker configuration
│   └── .env                 # Environment variables
│
├── agenda-frontend/         # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   └── lib/             # Utilities & types
│   ├── package.json
│   └── .env.local           # Frontend environment
│
└── docker-compose.yml       # Docker orchestration
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+** (or use Docker)
- **npm** or **yarn**

### Option 1: Run with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Agenda
   ```

2. **Start all services**
   ```powershell
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Run Locally

#### Backend Setup

1. **Navigate to backend directory**
   ```powershell
   cd backend
   ```

2. **Create virtual environment**
   ```powershell
   python -m venv venv
   venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```powershell
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run the server**
   ```powershell
   python main.py
   ```
   
   Or with uvicorn:
   ```powershell
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
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

4. **Run the development server**
   ```powershell
   npm run dev
   ```

5. **Open browser**
   Navigate to http://localhost:3000

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

#### Metadata Extraction
- `POST /api/extract` - Extract metadata from a URL

#### Agendas
- `GET /agendas` - Get all agendas
- `GET /agendas/{id}` - Get single agenda
- `POST /agendas` - Create new agenda
- `DELETE /agendas/{id}` - Delete agenda

#### Articles
- `GET /agendas/{id}/articles` - Get articles for an agenda
- `POST /agendas/{id}/articles` - Create article
- `DELETE /articles/{id}` - Delete article

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **PostgreSQL** - Relational database
- **psycopg2** - PostgreSQL adapter
- **BeautifulSoup4** - HTML parsing for metadata extraction
- **Pydantic** - Data validation
- **python-dotenv** - Environment management

### Frontend
- **Next.js 14+** - React framework
- **React 18+** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **uuid** - Unique ID generation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 🔧 Development

### Backend Development

The FastAPI backend includes automatic reloading. Any changes to Python files will automatically restart the server.

```powershell
# Run with auto-reload
uvicorn main:app --reload
```

### Frontend Development

Next.js includes hot module replacement. Changes will be reflected instantly.

```powershell
npm run dev
```

## 🌟 Features

- ✅ **Metadata Extraction**: Automatically fetch title, description, and images from URLs
- ✅ **CRUD Operations**: Full create, read, update, delete for agendas and articles
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Modern UI**: Glassmorphism effects and smooth animations
- ✅ **Type Safety**: TypeScript frontend, Pydantic backend
- ✅ **API Documentation**: Auto-generated Swagger/OpenAPI docs
- ✅ **Docker Support**: Easy deployment with Docker Compose

## 📝 Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenda_db
DB_USER=postgres
DB_PASSWORD=postgres
API_PORT=8000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 👨‍💻 Author

Created as a learning project to demonstrate full-stack development skills.

## 🔗 Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Made with ❤️ using Python FastAPI and Next.js** — Work in Progress

**Agenda** is a web application that allows users to present a **personal agenda or narrative**, and back it up with **reliable external sources** — primarily news articles.

Each **agenda** represents a specific claim or statement (e.g., “Biden is unfit to be president”).  
The user then attaches **articles from reputable news outlets** that serve as evidence supporting the claim.

---

## Use Case

This tool is designed for:
- Structuring personal beliefs or arguments with traceable sources
- Gathering credible evidence for political, social, or personal narratives
- Showcasing a curated, article-based "case" for a point of view
- Simplifying research and content organization

---

## Status: In Progress

This is an ongoing personal project intended to simulate a full production-grade system with a strong emphasis on:
- Scalable backend architecture
- SQL-based persistence (no ORM)
- Modern frontend development
- Real-world development practices (Docker, CI-ready)

---

## Stack & Technologies

| Area       | Tech                                       |
|------------|--------------------------------------------|
| Frontend   | [Next.js](https://nextjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Styling    | [TailwindCSS](https://tailwindcss.com/)    |
| Backend    | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/) |
| Database   | [PostgreSQL](https://www.postgresql.org/)  |
| DB Access  | Raw SQL via `pg` (no ORM used)             |
| Dev Env    | [Docker](https://www.docker.com/), `docker-compose` |
| DB Admin   | [pgAdmin](https://www.pgadmin.org/)        |

---



---

## Features Implemented

- [x] Create and list agendas (core narratives)
- [x] Add articles as evidence supporting an agenda
- [x] Store and retrieve all data from PostgreSQL
- [x] RESTful backend built with raw SQL queries (no ORM)
- [x] Dockerized environment with PostgreSQL persistence

---

## Roadmap

- [ ] Delete agendas and articles
- [ ] Tagging or categorization of agendas
- [ ] Public sharing / publishing features
- [ ] Article preview with metadata (image, excerpt)
- [ ] Authentication (future)
- [ ] Responsive design and UI polish

---

## Local Development Setup

```bash
# Start backend + PostgreSQL
docker-compose up --build

# Start frontend (in a second terminal)
cd agenda-frontend
npm install
npm run dev
```

> Access backend on `http://localhost:4000`  
> Access frontend on `http://localhost:3000`

---

## Author

This project is developed by an independent developer with two academic degrees in Computer Science, combining deep theoretical foundations with practical, real-world full-stack engineering experience.
