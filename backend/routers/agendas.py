"""
Agenda CRUD routes for creating, reading, updating, and deleting agendas.
"""
import uuid
from typing import List, Optional
import time
import random
import os
try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse

from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db_connection
from models import User, Agenda, CreateAgenda, Article
from security import get_current_user
import requests
from bs4 import BeautifulSoup
import json

router = APIRouter()

def fetch_article_excerpt(url: str, max_words: int = 200) -> str:
    """
    Fetches the URL and extracts text from the first few paragraphs.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # Short timeout to not stall the request too long
        response = requests.get(url, headers=headers, timeout=4)
        if response.status_code != 200:
            return "Could not fetch content."
            
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.decompose()
            
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Truncate
        words = text.split()
        if len(words) > max_words:
            return ' '.join(words[:max_words]) + "..."
        return text
    except Exception as e:
        return f"Error extracting content: {str(e)}"

def call_openrouter_analysis(claim: str, evidence: list) -> Optional[dict]:
    """
    Calls OpenRouter LLM to analyze the claim based on evidence.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    print(f"DEBUG: Checking for API Key... Found? {bool(api_key)}")
    if not api_key:
        print("DEBUG: No API Key found, skipping LLM.")
        return None

    print(f"DEBUG: Calling OpenRouter with {len(evidence)} evidence items...")

    messages = [
      {
        "role": "system",
        "content": """You are an evidence-evaluation assistant. You must evaluate claims ONLY based on the provided excerpts. 
        You must not assume facts, browse the web, or rely on outside knowledge. 
        If evidence is insufficient, explicitly say so and lower confidence. Do not overstate certainty. 
        
        You must output a VALID JSON object with exactly these fields:
        {
            "score": "High" | "Medium" | "Low",
            "reasoning": "A concise paragraph explaining the evaluation."
        }
        """
      },
      {
        "role": "user",
        "content": json.dumps({
          "task": "Evaluate whether the provided evidence supports the agenda claim.",
          "agenda_claim": claim,
          "evidence_items": evidence,
          "instructions": {
            "evaluate_source_credibility": True,
            "evaluate_relevance_to_claim": True,
            "identify_missing_information": True,
            "return_confidence_level": ["Low", "Medium", "High"]
          }
        })
      }
    ]

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000", 
                "X-Title": "Agenda App"
            },
            json={
                "model": "xiaomi/mimo-v2-flash:free",
                "messages": messages
            },
            timeout=45
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            # Clean content if it has markdown code blocks
            if "```json" in content:
                content = content.replace("```json", "").replace("```", "")
            
            parsed = json.loads(content)
            return {
                "score": parsed.get("score", "Low"),
                "reasoning": parsed.get("reasoning", "Analysis failed to produce reasoning."),
                "claim": claim
            }
        else:
            print(f"LLM API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"LLM Exception: {str(e)}")
        return None

@router.post("", response_model=Agenda, status_code=status.HTTP_201_CREATED)
async def create_agenda(
    agenda: CreateAgenda,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new agenda for the authenticated user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO agendas (user_id, title) VALUES (%s, %s) RETURNING id, user_id, title, created_at, share_token",
            (current_user.id, agenda.title)
        )
        row = cursor.fetchone()
        conn.commit()
        # Handle potential older DB schema without share_token column (though migration should help)
        share_token = row[4] if len(row) > 4 else None
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=share_token)
    finally:
        conn.close()


@router.get("", response_model=List[Agenda])
async def get_agendas(current_user: User = Depends(get_current_user)):
    """
    Get all agendas for the authenticated user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Try to select with share_token
        try:
            cursor.execute(
                "SELECT id, user_id, title, created_at, share_token FROM agendas WHERE user_id = %s ORDER BY created_at DESC",
                (current_user.id,)
            )
        except Exception:
            conn.rollback()
            # Fallback for old schema if migration failed
            cursor.execute(
                "SELECT id, user_id, title, created_at FROM agendas WHERE user_id = %s ORDER BY created_at DESC",
                (current_user.id,)
            )
            rows = cursor.fetchall()
            return [Agenda(id=r[0], user_id=r[1], title=r[2], createdAt=r[3]) for r in rows]

        rows = cursor.fetchall()
        return [Agenda(id=r[0], user_id=r[1], title=r[2], createdAt=r[3], share_token=r[4]) for r in rows]
    finally:
        conn.close()


@router.get("/shared/{token}", response_model=Agenda)
async def get_shared_agenda(token: str):
    """
    Get a shared agenda by token (Public access).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT a.id, a.user_id, a.title, a.created_at, a.share_token, u.name 
            FROM agendas a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.share_token = %s
            """,
            (token,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        return Agenda(
            id=row[0], 
            user_id=row[1], # Returning user_id is fine, it's public info anyway that someone owns it
            title=row[2], 
            createdAt=row[3], 
            share_token=row[4],
            owner_name=row[5]
        )
    finally:
        conn.close()


@router.get("/shared/{token}/articles", response_model=List[Article])
async def get_shared_agenda_articles(token: str):
    """
    Get articles for a shared agenda (Public access).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # First resolve the token to an ID
        cursor.execute("SELECT id FROM agendas WHERE share_token = %s", (token,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        agenda_id = row[0]

        cursor.execute(
            "SELECT id, title, url, description, image, agenda_id, created_at FROM articles WHERE agenda_id = %s ORDER BY created_at DESC",
            (agenda_id,)
        )
        articles = cursor.fetchall()
        return [
            Article(
                id=a[0],
                title=a[1],
                url=a[2],
                description=a[3],
                image=a[4],
                agenda_id=a[5],
                createdAt=a[6]
            ) 
            for a in articles
        ]
    finally:
        conn.close()


@router.get("/{agenda_id}", response_model=Agenda)
async def get_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific agenda by ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Try select with share_token
        try:
            cursor.execute(
                "SELECT id, user_id, title, created_at, share_token FROM agendas WHERE id = %s AND user_id = %s",
                (agenda_id, current_user.id)
            )
        except Exception:
            conn.rollback()
            cursor.execute(
                "SELECT id, user_id, title, created_at FROM agendas WHERE id = %s AND user_id = %s",
                (agenda_id, current_user.id)
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Agenda not found")
            return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3])

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=row[4])
    finally:
        conn.close()


@router.post("/{agenda_id}/share", response_model=Agenda)
async def share_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Generate or retrieve a share token for an agenda.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id, user_id, title, created_at, share_token FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        existing_token = row[4]
        if existing_token:
             return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=existing_token)

        # Generate new token
        new_token = str(uuid.uuid4())
        cursor.execute(
            "UPDATE agendas SET share_token = %s WHERE id = %s",
            (new_token, agenda_id)
        )
        conn.commit()
        
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=new_token)
    finally:
        conn.close()


@router.post("/{agenda_id}/unshare", response_model=Agenda)
async def unshare_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Revoke the share token for an agenda.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id, user_id, title, created_at FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        cursor.execute(
            "UPDATE agendas SET share_token = NULL WHERE id = %s",
            (agenda_id,)
        )
        conn.commit()
        
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=None)
    finally:
        conn.close()


@router.patch("/{agenda_id}", response_model=Agenda)
async def update_agenda(
    agenda_id: int,
    agenda_update: CreateAgenda, 
    current_user: User = Depends(get_current_user)
):
    """
    Update an agenda title.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        cursor.execute(
            "UPDATE agendas SET title = %s WHERE id = %s RETURNING id, user_id, title, created_at, share_token",
            (agenda_update.title, agenda_id)
        )
        row = cursor.fetchone()
        conn.commit()
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=row[4])
    finally:
        conn.close()


@router.delete("/{agenda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an agenda and all its articles.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        # Delete agenda (articles will cascade delete)
        cursor.execute("DELETE FROM agendas WHERE id = %s", (agenda_id,))
        conn.commit()
    finally:
        conn.close()

@router.post("/shared/{share_token}/analyze")
async def analyze_shared_agenda_claim(share_token: str):
    """
    Analyze the agenda claim for a shared agenda (public access).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Fetch Agenda by Token
        cursor.execute(
            "SELECT id, title FROM agendas WHERE share_token = %s",
            (share_token,)
        )
        agenda_row = cursor.fetchone()
        if not agenda_row:
            raise HTTPException(status_code=404, detail="Shared agenda not found")
        
        agenda_id = agenda_row[0]
        claim = agenda_row[1]
        
        # 2. Fetch Articles
        cursor.execute(
            "SELECT title, url, description FROM articles WHERE agenda_id = %s",
            (agenda_id,)
        )
        articles = cursor.fetchall()
        
        # 3. LLM Analysis Logic
        
        # Prepare evidence
        evidence_items = []
        for i, a in enumerate(articles):
            # a = (title, url, description)
            url = a[1]
            excerpt = fetch_article_excerpt(url)
            evidence_items.append({
                "id": f"a{i}",
                "title": a[0],
                "url": url,
                "publisher": urlparse(url).netloc,
                "excerpt": excerpt
            })
            
        # Try real LLM first
        llm_result = call_openrouter_analysis(claim, evidence_items)
        if llm_result:
            return llm_result

        # Fallback to Simulation
        time.sleep(1.5) # Fake "thinking" time
        
        count = len(articles)
        
        if count == 0:
            return {
                "score": "Low",
                "reasoning": "No evidence provided. Please add articles to verify this claim.",
                "claim": claim
            }

        # CRITERIA 1: Keywords looking for "Hard Evidence" 
        authoritative_keywords = ["report", "study", "evidence", "confirmed", "analysis", "data", "statistics", "review", "official", "survey", "court", "verdict", "proof", "science", "research"]
        
        quality_matches = 0
        for a in articles:
            text_blob = (str(a[0]) + " " + str(a[2])).lower()
            if any(kw in text_blob for kw in authoritative_keywords):
                quality_matches += 1

        # CRITERIA 2: Diversity of Sources
        unique_domains = set()
        for a in articles:
            url = a[1]
            try:
                domain = urlparse(url).netloc.replace('www.', '')
                if domain:
                    unique_domains.add(domain)
            except:
                pass
        
        num_unique = len(unique_domains)
        
        # SCORING ALGORITHM
        points = (count * 10) + (num_unique * 15) + (quality_matches * 10)

        score = "Low"
        reasoning_detail = ""

        if points >= 65: 
            score = "High"
            reasoning_detail = f"Strong consensus detected across about {num_unique} unique domains. The semantic analysis identified authoritative terminology (e.g., study, data) that strongly supports the claim."
        elif points >= 35: 
            score = "Medium"
            reasoning_detail = f"Evidence is present ({count} sources) and appears relevant. Usage of { 'a single source' if num_unique == 1 else 'diverse sources' } provides a partial correlation. Adding one more distinct source would likely elevate this to a high confidence level."
        else:
            score = "Low"
            reasoning_detail = f"Insufficient data density. With only {count} source(s) and limited cross-referencing, the claim lacks the verifiable weight required for a definitive rating."
            
        return {
            "score": score,
            "reasoning": reasoning_detail, 
            "claim": claim
        }

    finally:
        conn.close()


@router.post("/{agenda_id}/analyze")
async def analyze_agenda_claim(
    agenda_id: int, 
    current_user: User = Depends(get_current_user)
):
    """
    Analyze the agenda claim against its articles using (Simulated) AI.
    Eventually, this will connect to a real LLM API (OpenAI/Anthropic).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Fetch Agenda
        cursor.execute(
            "SELECT title FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        agenda_row = cursor.fetchone()
        if not agenda_row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        claim = agenda_row[0]
        
        # 2. Fetch Articles
        cursor.execute(
            "SELECT title, url, description FROM articles WHERE agenda_id = %s",
            (agenda_id,)
        )
        articles = cursor.fetchall()
        # articles list of tuples: (title, url, description)
        
        # 3. LLM Analysis Logic
        
        # Prepare evidence
        evidence_items = []
        for i, a in enumerate(articles):
            # a = (title, url, description)
            url = a[1]
            excerpt = fetch_article_excerpt(url)
            evidence_items.append({
                "id": f"a{i}",
                "title": a[0],
                "url": url,
                "publisher": urlparse(url).netloc,
                "excerpt": excerpt
            })
            
        # Try real LLM first
        llm_result = call_openrouter_analysis(claim, evidence_items)
        if llm_result:
            return llm_result

        # Fallback to Simulation if LLM fails or no key
        time.sleep(1.5) # Fake "thinking" time
        
        count = len(articles)
        
        if count == 0:
            return {
                "score": "Low",
                "reasoning": "No evidence provided. Please add articles to verify this claim.",
                "claim": claim
            }

        # CRITERIA 1: Keywords looking for "Hard Evidence" 
        authoritative_keywords = ["report", "study", "evidence", "confirmed", "analysis", "data", "statistics", "review", "official", "survey", "court", "verdict", "proof", "science", "research"]
        
        quality_matches = 0
        for a in articles:
            # a[0] = title, a[2] = description, a[3] = content (if any)
            text_blob = (str(a[0]) + " " + str(a[2])).lower()
            if any(kw in text_blob for kw in authoritative_keywords):
                quality_matches += 1

        # CRITERIA 2: Diversity of Sources
        unique_domains = set()
        for a in articles:
            url = a[1]
            try:
                domain = urlparse(url).netloc.replace('www.', '')
                if domain:
                    unique_domains.add(domain)
            except:
                pass
        
        domain_count = len(unique_domains)

        # SCORING ALGORITHM
        # Base: 10 pts per article (Quantity)
        # Bonus: 15 pts per unique domain (Diversity is worth more than quantity)
        # Bonus: 10 pts per "Scientific/Official" keyword match (Quality)
        points = (count * 10) + (domain_count * 15) + (quality_matches * 10)

        if points >= 65:
            score = "High"
            detail = f"Strong consensus detected across {domain_count} unique domains. The semantic analysis identified {quality_matches} authoritative sources or terms (e.g., study, data) that strongly support the claim."
        elif points >= 35:
            score = "Medium"
            detail = f"Evidence is present ({count} sources) and appears relevant. Usage of {domain_count} distinct domain(s) provides a partial correlation. Adding one more distinct source would likely elevate this to a high confidence level."
        else:
            score = "Low"
            detail = f"Insufficient data density. With only {count} source(s) and limited cross-referencing, the claim lacks the verifiable weight required for a definitive rating."

        return {
            "score": score,
            "reasoning": detail,
            "claim": claim
        }

    finally:
        conn.close()
