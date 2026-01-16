"""
Metadata extraction routes for scraping article information from URLs.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl
import requests
from bs4 import BeautifulSoup

router = APIRouter()


class ExtractURLRequest(BaseModel):
    url: HttpUrl


class ExtractedMetadata(BaseModel):
    title: str
    description: str
    image: str | None


class IframeCheckResponse(BaseModel):
    blocked: bool


@router.post("/extract", response_model=ExtractedMetadata)
async def extract_metadata(data: ExtractURLRequest):
    """
    Extract metadata (title, description, image) from a URL.
    
    Args:
        data: Request containing the URL to extract metadata from
    
    Returns:
        Extracted metadata including title, description, and image URL
    
    Raises:
        HTTPException: If URL cannot be fetched or parsed
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(str(data.url), headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract title
        title = None
        if soup.find('meta', property='og:title'):
            title = soup.find('meta', property='og:title').get('content')
        elif soup.find('title'):
            title = soup.find('title').string
        
        # Extract description
        description = None
        if soup.find('meta', property='og:description'):
            description = soup.find('meta', property='og:description').get('content')
        elif soup.find('meta', attrs={'name': 'description'}):
            description = soup.find('meta', attrs={'name': 'description'}).get('content')
        
        # Extract image
        image = None
        if soup.find('meta', property='og:image'):
            image = soup.find('meta', property='og:image').get('content')
        
        return ExtractedMetadata(
            title=title or "No title found",
            description=description or "No description found",
            image=image
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract metadata: {str(e)}")


@router.get("/check-iframe", response_model=IframeCheckResponse)
async def check_iframe(url: str):
    """
    Check if a URL allows iframe embedding.
    
    Args:
        url: URL to check for iframe compatibility
    
    Returns:
        Boolean indicating whether the URL can be embedded in an iframe
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.head(url, headers=headers, timeout=5, allow_redirects=True)
        
        # Check X-Frame-Options header
        x_frame_options = response.headers.get('X-Frame-Options', '')
        csp = response.headers.get('Content-Security-Policy', '')

        # Normalize for checks
        xfo_l = x_frame_options.lower()
        csp_l = csp.lower()

        if (
            'deny' in xfo_l or
            'sameorigin' in xfo_l or
            'frame-ancestors' in csp_l
        ):
            return IframeCheckResponse(blocked=True)

        return IframeCheckResponse(blocked=False)
    except Exception:
        # Network error or other issue — assume blocked (conservative)
        return IframeCheckResponse(blocked=True)
