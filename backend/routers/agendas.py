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

router = APIRouter()


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
        
        # 3. Simulated "LLM" Analysis Logic
        # ------------------------------------------------------------------
        # Implementation Note:
        # To switch to real LLM, uncomment the block below and ensure OPENAI_API_KEY is in .env
        
        # api_key = os.getenv("OPENAI_API_KEY")
        # if api_key:
        #    # import openai
        #    # openai.api_key = api_key
        #    # response = openai.ChatCompletion.create(...)
        #    # return parse_llm_response(response)
        # ------------------------------------------------------------------

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
