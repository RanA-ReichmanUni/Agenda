"""
Agenda CRUD routes for creating, reading, updating, and deleting agendas.
"""
import uuid
from typing import List, Optional
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
