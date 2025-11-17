"""
Agenda CRUD routes for creating, reading, updating, and deleting agendas.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db_connection
from models import User, Agenda, CreateAgenda
from security import get_current_user

router = APIRouter()


@router.post("", response_model=Agenda, status_code=status.HTTP_201_CREATED)
async def create_agenda(
    agenda: CreateAgenda,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new agenda for the authenticated user.
    
    Args:
        agenda: Agenda creation data (title)
        current_user: Authenticated user from JWT token
    
    Returns:
        Created agenda object
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO agendas (user_id, title) VALUES (%s, %s) RETURNING id, user_id, title, created_at",
            (current_user.id, agenda.title)
        )
        row = cursor.fetchone()
        conn.commit()
        return Agenda(id=row[0], user_id=row[1], title=row[2], created_at=row[3])
    finally:
        conn.close()


@router.get("", response_model=list[Agenda])
async def get_agendas(current_user: User = Depends(get_current_user)):
    """
    Get all agendas for the authenticated user.
    
    Args:
        current_user: Authenticated user from JWT token
    
    Returns:
        List of user's agendas
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, user_id, title, created_at FROM agendas WHERE user_id = %s ORDER BY created_at DESC",
            (current_user.id,)
        )
        rows = cursor.fetchall()
        return [Agenda(id=r[0], user_id=r[1], title=r[2], created_at=r[3]) for r in rows]
    finally:
        conn.close()


@router.get("/{agenda_id}", response_model=Agenda)
async def get_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific agenda by ID.
    
    Args:
        agenda_id: ID of the agenda to retrieve
        current_user: Authenticated user from JWT token
    
    Returns:
        Agenda object
    
    Raises:
        HTTPException: If agenda not found or user doesn't own it
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, user_id, title, created_at FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        return Agenda(id=row[0], user_id=row[1], title=row[2], created_at=row[3])
    finally:
        conn.close()


@router.delete("/{agenda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an agenda and all its articles.
    
    Args:
        agenda_id: ID of the agenda to delete
        current_user: Authenticated user from JWT token
    
    Raises:
        HTTPException: If agenda not found or user doesn't own it
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
