"""
Agenda Backend API

Main application entry point that sets up FastAPI app with CORS
and includes all router modules for clean separation of concerns.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

print("Loading Agenda API...")
print("Importing routers...")

try:
    from routers import auth
    print("✓ auth imported")
except Exception as e:
    print(f"✗ Error importing auth: {e}")
    raise

try:
    from routers import agendas
    print("✓ agendas imported")
except Exception as e:
    print(f"✗ Error importing agendas: {e}")
    raise

try:
    from routers import articles
    print("✓ articles imported")
except Exception as e:
    print(f"✗ Error importing articles: {e}")
    raise

try:
    from routers import metadata
    print("✓ metadata imported")
except Exception as e:
    print(f"✗ Error importing metadata: {e}")
    raise

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
        "http://localhost:5173",
        "https://agenda-pied-eta.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    print("Starting up...")
    try:
        init_db()
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
        raise
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)