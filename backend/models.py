from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ============================================
# USER/AUTH MODELS
# ============================================

class UserRegister(BaseModel):
    """Model for user registration"""
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str

class User(BaseModel):
    """Model for user response"""
    id: int
    email: str
    name: str
    created_at: datetime

class Token(BaseModel):
    """Model for JWT token response"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Model for decoded JWT token data"""
    user_id: Optional[int] = None

# ============================================
# AGENDA MODELS
# ============================================

class CreateAgenda(BaseModel):
    """Model for creating a new agenda"""
    title: str

class Agenda(BaseModel):
    """Model for agenda response"""
    id: int
    title: str
    createdAt: datetime

# ============================================
# ARTICLE MODELS
# ============================================

class CreateArticle(BaseModel):
    """Model for creating a new article"""
    title: str
    url: str
    description: str
    image: Optional[str] = None

class Article(BaseModel):
    """Model for article response"""
    id: int
    title: str
    url: str
    description: str
    image: Optional[str]
    agenda_id: int
    createdAt: datetime
