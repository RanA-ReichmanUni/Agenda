"""
Article CRUD routes for managing articles within agendas.
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db_connection
from models import User, Article, CreateArticle
from security import get_current_user

router = APIRouter()


def verify_agenda_ownership(agenda_id: int, user_id: int) -> bool:
    """
    Verify that the user owns the specified agenda.
    
    Args:
        agenda_id: ID of the agenda to check
        user_id: ID of the user
    
    Returns:
        True if user owns the agenda, False otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, user_id)
        )
        return cursor.fetchone() is not None
    finally:
        conn.close()


@router.post("/agendas/{agenda_id}/articles", response_model=Article, status_code=status.HTTP_201_CREATED)
async def create_article(
    agenda_id: int,
    article: CreateArticle,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new article in an agenda.
    
    Args:
        agenda_id: ID of the agenda to add article to
        article: Article data (title, url, description, image)
        current_user: Authenticated user from JWT token
    
    Returns:
        Created article object
    
    Raises:
        HTTPException: If agenda not found or user doesn't own it
    """
    # Verify agenda ownership
    if not verify_agenda_ownership(agenda_id, current_user.id):
        raise HTTPException(status_code=404, detail="Agenda not found")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO articles (agenda_id, title, url, description, image) 
               VALUES (%s, %s, %s, %s, %s) 
               RETURNING id, agenda_id, title, url, description, image, created_at""",
            (agenda_id, article.title, article.url, article.description, article.image)
        )
        row = cursor.fetchone()
        conn.commit()
        return Article(
            id=row[0],
            agenda_id=row[1],
            title=row[2],
            url=row[3],
            description=row[4],
            image=row[5],
            created_at=row[6]
        )
    finally:
        conn.close()


@router.get("/agendas/{agenda_id}/articles", response_model=List[Article])
async def get_articles(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get all articles for a specific agenda.
    
    Args:
        agenda_id: ID of the agenda
        current_user: Authenticated user from JWT token
    
    Returns:
        List of articles in the agenda
    
    Raises:
        HTTPException: If agenda not found or user doesn't own it
    """
    # Verify agenda ownership
    if not verify_agenda_ownership(agenda_id, current_user.id):
        raise HTTPException(status_code=404, detail="Agenda not found")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT id, agenda_id, title, url, description, image, created_at 
               FROM articles 
               WHERE agenda_id = %s 
               ORDER BY created_at DESC""",
            (agenda_id,)
        )
        rows = cursor.fetchall()
        return [
            Article(
                id=r[0],
                agenda_id=r[1],
                title=r[2],
                url=r[3],
                description=r[4],
                image=r[5],
                created_at=r[6]
            ) for r in rows
        ]
    finally:
        conn.close()


@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an article.
    
    Args:
        article_id: ID of the article to delete
        current_user: Authenticated user from JWT token
    
    Raises:
        HTTPException: If article not found or user doesn't own the parent agenda
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership through agenda
        cursor.execute(
            """SELECT articles.id 
               FROM articles 
               JOIN agendas ON articles.agenda_id = agendas.id 
               WHERE articles.id = %s AND agendas.user_id = %s""",
            (article_id, current_user.id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Delete article
        cursor.execute("DELETE FROM articles WHERE id = %s", (article_id,))
        conn.commit()
    finally:
        conn.close()
