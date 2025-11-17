"""
Agenda Backend API

Main application entry point that sets up FastAPI app with CORS
and includes all router modules for clean separation of concerns.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import auth, agendas, articles, metadata

# Create FastAPI application
app = FastAPI(
    title="Agenda API",
    description="Backend API for Agenda application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(agendas.router, prefix="/agendas", tags=["agendas"])
app.include_router(articles.router, tags=["articles"])
app.include_router(metadata.router, prefix="/api", tags=["metadata"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Agenda API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
