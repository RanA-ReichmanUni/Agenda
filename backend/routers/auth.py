"""
Authentication routes for user registration, login, and profile.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db_connection
from models import User, UserRegister, UserLogin, Token
from security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user.
    
    Args:
        user_data: User registration data (email, password, name)
    
    Returns:
        JWT access token for the newly created user
    
    Raises:
        HTTPException: If email already exists or registration fails
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Validate password length (bcrypt has 72 byte limit)
        if len(user_data.password.encode('utf-8')) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password too long. Maximum 72 characters."
            )
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and create user
        hashed_password = get_password_hash(user_data.password)
        cursor.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
            (user_data.email, hashed_password, user_data.name)
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )
    finally:
        conn.close()


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Login user and return JWT token.
    
    Args:
        user_data: User login credentials (email, password)
    
    Returns:
        JWT access token
    
    Raises:
        HTTPException: If credentials are invalid
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Find user by email
        cursor.execute(
            "SELECT id, password_hash FROM users WHERE email = %s",
            (user_data.email,)
        )
        user_row = cursor.fetchone()
        
        if not user_row or not verify_password(user_data.password, user_row[1]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = user_row[0]
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        return Token(access_token=access_token, token_type="bearer")
        
    finally:
        conn.close()


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    
    Args:
        current_user: Automatically injected by authentication dependency
    
    Returns:
        Current user's profile information
    """
    return current_user
