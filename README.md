# Agenda - Work in Progress

**Agenda** is a web application that allows users to present a **personal agenda or narrative**, and back it up with **reliable external sources**, primarily news articles.

Each **agenda** represents a specific claim or statement (e.g., "Biden is unfit to be president" or the contrast, "Biden is a great president").  
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

## 🏗️ Architecture

### Backend (Python FastAPI)
- **Framework**: FastAPI (modern, fast, async)
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Features**:
  - RESTful API design with router-based architecture
  - Automatic metadata extraction from URLs
  - OpenAPI/Swagger documentation
  - Type validation with Pydantic
  - Raw SQL queries (no ORM used)
  - CORS enabled for frontend
  - Protected endpoints with OAuth2

### Frontend (Vite + React)
- **Framework**: Vite with React 18+
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage
- **Features**:
  - Lightning-fast HMR (Hot Module Replacement)
  - TypeScript for type safety
  - Modern UI with glassmorphism effects
  - Responsive design
  - Protected routes

---

## Stack & Technologies

| Area       | Tech                                       |
|------------|--------------------------------------------|
| Frontend   | [Vite](https://vitejs.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Routing    | [React Router](https://reactrouter.com/)   |
| Styling    | [TailwindCSS](https://tailwindcss.com/)    |
| Backend    | [Python](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/) |
| Database   | [PostgreSQL](https://www.postgresql.org/)  |
| DB Access  | Raw SQL via `psycopg2` (no ORM used)       |
| Dev Env    | [Docker](https://www.docker.com/), `docker-compose` |

---

## 📁 Project Structure

```
Agenda/
├── backend/                  # Python FastAPI Backend
│   ├── main.py              # Main application & routes
│   ├── models.py            # Pydantic models
│   ├── database.py          # Database connection & raw SQL
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Docker configuration
│   └── .env                 # Environment variables
│
├── frontend/                # Vite + React Frontend
│   ├── src/
│   │   ├── App.tsx          # Main app with React Router
│   │   ├── main.tsx         # Vite entry point
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── lib/             # Utilities & types
│   │   └── pages/           # Page components
│   ├── package.json
│   ├── vite.config.ts       # Vite configuration
│   └── .env                 # Frontend environment
│
└── docker-compose.yml       # Docker orchestration
```

---

## Features Implemented

- [x] User authentication with JWT tokens
- [x] Protected routes and API endpoints
- [x] Create and list agendas (core narratives)
- [x] Add articles as evidence supporting an agenda
- [x] Store and retrieve all data from PostgreSQL
- [x] RESTful backend with clean router-based architecture
- [x] Dockerized environment with PostgreSQL persistence
- [x] Delete agendas and articles
- [x] Article preview with metadata (image, excerpt)
- [x] Automatic metadata extraction from URLs
- [x] Iframe embedding detection for articles
- [x] Modern, responsive UI with animations

---

## Roadmap

- [ ] Public sharing / publishing features
- [ ] Tagging or categorization of agendas
- [ ] Search and filter functionality
- [ ] Export agendas (PDF, JSON)
- [ ] Dark mode
- [ ] CI/CD pipeline
- [ ] Email verification for registration

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 15+** (or use Docker)
- **npm**

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
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Database: localhost:5432

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
   # Using convenience script
   ..\start-backend.ps1
   
   # Or manually with uvicorn
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```powershell
   cd frontend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment** (if different from default)
   ```powershell
   # Create .env file
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

4. **Run the development server**
   ```powershell
   # Using convenience script
   ..\start-frontend-vite.ps1
   
   # Or manually with npm
   npm run dev
   ```

5. **Open browser**
   Navigate to http://localhost:5173

6. **Create an account**
   - Click "Sign Up" or navigate to `/register`
   - Enter your details and create an account
   - Login with your credentials

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

#### Metadata Extraction
- `POST /api/extract` - Extract metadata from a URL
- `GET /api/check-iframe?url=<url>` - Check if URL allows iframe embedding

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user profile (protected)

#### Agendas
- `GET /agendas` - Get all agendas for current user (protected)
- `GET /agendas/{id}` - Get single agenda (protected)
- `POST /agendas` - Create new agenda (protected)
- `DELETE /agendas/{id}` - Delete agenda (protected)

#### Articles
- `GET /agendas/{id}/articles` - Get articles for an agenda (protected)
- `POST /agendas/{id}/articles` - Create article (protected)
- `DELETE /articles/{id}` - Delete article (protected)

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **PostgreSQL** - Relational database
- **psycopg2** - PostgreSQL adapter
- **python-jose** - JWT token generation and validation
- **passlib** - Password hashing with bcrypt
- **BeautifulSoup4** - HTML parsing for metadata extraction
- **Pydantic** - Data validation
- **python-dotenv** - Environment management

### Frontend
- **Vite** - Next-generation frontend tooling
- **React 18+** - Modern UI library with hooks
- **React Router DOM** - Client-side routing
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## �️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework with async support
- **Uvicorn** - Lightning-fast ASGI server
- **PostgreSQL** - Robust relational database
- **psycopg2** - PostgreSQL adapter (raw SQL, no ORM)
- **BeautifulSoup4** - HTML parsing for metadata extraction
- **Pydantic** - Data validation and serialization
- **python-dotenv** - Environment management

### Frontend
- **Vite** - Next-generation frontend tooling
- **React 18+** - Modern UI library with hooks
- **React Router DOM** - Client-side routing
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework
- **uuid** - Unique ID generation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## �🔧 Development

### Backend Development

The FastAPI backend includes automatic reloading. Any changes to Python files will automatically restart the server.

```powershell
# Run with auto-reload
uvicorn main:app --reload
```

### Frontend Development

Vite includes blazing-fast Hot Module Replacement (HMR). Changes are reflected instantly without losing state.

```powershell
npm run dev
```

---

## 🌟 Features

- ✅ **Metadata Extraction**: Automatically fetch title, description, and images from URLs using BeautifulSoup
- ✅ **CRUD Operations**: Full create, read, delete for agendas and articles
- ✅ **Responsive Design**: Works seamlessly on desktop and mobile devices
- ✅ **Modern UI**: Glassmorphism effects, smooth animations, and polished design
- ✅ **Type Safety**: TypeScript frontend with strict mode, Pydantic backend validation
- ✅ **API Documentation**: Auto-generated Swagger/OpenAPI docs at `/docs`
- ✅ **Docker Support**: Easy deployment and development with Docker Compose
- ✅ **Iframe Preview**: Check if articles can be embedded and preview them
- ✅ **Raw SQL**: Direct database queries for maximum control and performance

---

## 📝 Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenda_db
DB_USER=agenda_user
DB_PASSWORD=supersecret
API_PORT=8000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 👨‍💻 Author

This project is developed by an independent developer with two academic degrees in Computer Science, combining deep theoretical foundations with practical, real-world full-stack engineering experience.

---

## 🔗 Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Made with ❤️ using Python FastAPI and Vite + React**

## 👨‍💻 Author

Created as a learning project to demonstrate full-stack development skills.

## 🔗 Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Made with ❤️ using Python FastAPI and Vite + React**

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
| Frontend   | [Vite](https://vitejs.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Routing    | [React Router](https://reactrouter.com/)   |
| Styling    | [TailwindCSS](https://tailwindcss.com/)    |
| Backend    | [Python](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/) |
| Database   | [PostgreSQL](https://www.postgresql.org/)  |
| DB Access  | Raw SQL via `psycopg2` (no ORM used)       |
| Dev Env    | [Docker](https://www.docker.com/), `docker-compose` |

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

```powershell
# Start backend + PostgreSQL with Docker
docker-compose up --build

# Start frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

> Access backend on `http://localhost:8000`  
> Access frontend on `http://localhost:5173`

---

## Author

This project is developed by an independent developer with two academic degrees in Computer Science, combining deep theoretical foundations with practical, real-world full-stack engineering experience.
