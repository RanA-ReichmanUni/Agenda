from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
from dotenv import load_dotenv

# Import database and routes
from database import get_db_connection, init_db
from models import Agenda, Article, CreateAgenda, CreateArticle

load_dotenv()

app = FastAPI(
    title="Agenda API",
    description="Backend API for Agenda application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ExtractURLRequest(BaseModel):
    url: str

class ExtractURLResponse(BaseModel):
    title: str
    description: str
    image: Optional[str] = None

# ============================================
# METADATA EXTRACTION ENDPOINT
# ============================================

@app.post("/api/extract", response_model=ExtractURLResponse)
async def extract_metadata(data: ExtractURLRequest):
    """
    Extract metadata (title, description, image) from a given URL.
    Uses Open Graph and Twitter Card meta tags.
    """
    url = data.url
    
    if not url.startswith('http://') and not url.startswith('https://'):
        raise HTTPException(
            status_code=400,
            detail="URL must start with http:// or https://"
        )
    
    try:
        # Fetch the URL with proper headers
        response = requests.get(
            url,
            timeout=10,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        )
        response.raise_for_status()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch URL: {str(e)}"
        )
    
    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Extract title from various meta tags
    title = None
    title_sources = [
        soup.find('meta', property='og:title'),
        soup.find('meta', attrs={'name': 'twitter:title'}),
        soup.find('title'),
        soup.find('h1')
    ]
    
    for source in title_sources:
        if source:
            if source.name == 'meta':
                title = source.get('content', '').strip()
            else:
                title = source.get_text().strip()
            if title:
                break
    
    # Extract description
    description = None
    desc_sources = [
        soup.find('meta', property='og:description'),
        soup.find('meta', attrs={'name': 'twitter:description'}),
        soup.find('meta', attrs={'name': 'description'})
    ]
    
    for source in desc_sources:
        if source:
            description = source.get('content', '').strip()
            if description:
                break
    
    # Extract image
    image = None
    image_sources = [
        soup.find('meta', property='og:image'),
        soup.find('meta', attrs={'name': 'twitter:image'}),
        soup.find('meta', attrs={'name': 'twitter:image:src'})
    ]
    
    for source in image_sources:
        if source:
            image = source.get('content', '').strip()
            if image:
                # Convert relative URLs to absolute
                if image.startswith('//'):
                    image = 'https:' + image
                elif image.startswith('/'):
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    image = f"{parsed.scheme}://{parsed.netloc}{image}"
                break
    
    return ExtractURLResponse(
        title=title or "No title found",
        description=description or "No description found",
        image=image
    )

# Additional utility endpoint: iframe embedding check
@app.get("/api/check-iframe")
async def check_iframe(url: str):
    """Server-side HEAD check to determine if a URL blocks iframe embedding.
    Returns { blocked: bool } where True means likely blocked by X-Frame-Options or CSP.
    """
    if not url or (not url.startswith("http://") and not url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Missing or invalid url")
    try:
        res = requests.head(url, allow_redirects=True, timeout=8, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        frame_options = (res.headers.get("x-frame-options") or "").lower()
        csp = (res.headers.get("content-security-policy") or "").lower()
        blocked = (
            "deny" in frame_options or
            "sameorigin" in frame_options or
            "frame-ancestors" in csp
        )
        return {"blocked": blocked}
    except requests.exceptions.RequestException:
        # Network errors: assume blocked to be safe
        return {"blocked": True}

# ============================================
# AGENDA ENDPOINTS
# ============================================

@app.get("/agendas", response_model=List[Agenda])
async def get_agendas():
    """Get all agendas"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agendas ORDER BY created_at DESC")
        rows = cursor.fetchall()
        
        agendas = []
        for row in rows:
            agendas.append(Agenda(
                id=row[0],
                title=row[1],
                created_at=row[2]
            ))
        
        return agendas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/agendas/{agenda_id}", response_model=Agenda)
async def get_agenda(agenda_id: int):
    """Get a single agenda by ID"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM agendas WHERE id = %s", (agenda_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        return Agenda(
            id=row[0],
            title=row[1],
            created_at=row[2]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/agendas", response_model=Agenda, status_code=201)
async def create_agenda(agenda: CreateAgenda):
    """Create a new agenda"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO agendas (title, user_id) VALUES (%s, %s) RETURNING *",
            (agenda.title, 1)
        )
        row = cursor.fetchone()
        conn.commit()
        
        return Agenda(
            id=row[0],
            title=row[1],
            created_at=row[2]
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/agendas/{agenda_id}")
async def delete_agenda(agenda_id: int):
    """Delete an agenda"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM agendas WHERE id = %s RETURNING *", (agenda_id,))
        row = cursor.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        return {"message": "Agenda deleted", "id": agenda_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ============================================
# ARTICLE ENDPOINTS
# ============================================

@app.get("/agendas/{agenda_id}/articles", response_model=List[Article])
async def get_articles(agenda_id: int):
    """Get all articles for a specific agenda"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM articles WHERE agenda_id = %s ORDER BY created_at DESC",
            (agenda_id,)
        )
        rows = cursor.fetchall()
        
        articles = []
        for row in rows:
            articles.append(Article(
                id=row[0],
                title=row[1],
                url=row[2],
                description=row[3],
                image=row[4],
                agenda_id=row[5],
                created_at=row[6]
            ))
        
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/agendas/{agenda_id}/articles", response_model=Article, status_code=201)
async def create_article(agenda_id: int, article: CreateArticle):
    """Create a new article for a specific agenda"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO articles (title, url, description, image, agenda_id)
               VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            (article.title, article.url, article.description, article.image, agenda_id)
        )
        row = cursor.fetchone()
        conn.commit()
        
        return Article(
            id=row[0],
            title=row[1],
            url=row[2],
            description=row[3],
            image=row[4],
            agenda_id=row[5],
            created_at=row[6]
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/articles/{article_id}")
async def delete_article(article_id: int):
    """Delete an article by ID"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM articles WHERE id = %s RETURNING *", (article_id,))
        row = cursor.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Article not found")
        
        return {"message": "Article deleted", "id": article_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ============================================
# ROOT & HEALTH CHECK
# ============================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Agenda Backend API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    init_db()
    print("✅ Database initialized")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
