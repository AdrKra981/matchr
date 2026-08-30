import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.auth.deps import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.domain.user import User
from app.repository.user_repository import create_user, get_user_by_email

router = APIRouter(prefix='/auth', tags=['auth'])
logger = logging.getLogger(__name__)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post('/register')
def register(body: RegisterRequest):
    if get_user_by_email(body.email):
        logger.warning("Registration failed: email in use", extra={"email": body.email})
        raise HTTPException(status_code=409, detail="Email is already in use")

    user_id = create_user(body.email, hash_password(body.password))
    logger.info("Registration successful", extra={"user_id": user_id})
    return {"id": user_id, "email": body.email}

@router.post('/login')
def login(body: LoginRequest):
    user = get_user_by_email(body.email)
    if user is None or not verify_password(body.password, user["password_hash"]):
        logger.warning("Login failed: invalid credentials", extra={"email": body.email})
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"])
    logger.info("Login successful", extra={"user_id": user["id"]})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
