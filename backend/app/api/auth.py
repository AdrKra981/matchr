from app.auth.deps import get_current_user
from app.domain.user import User
from fastapi import Depends
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.auth.security import hash_password, verify_password, create_access_token
from app.repository.user_repository import create_user, get_user_by_email

router = APIRouter(prefix='/auth', tags=['auth'])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post('/register')
def register(body: RegisterRequest):
    if get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email is already in use")

    user_id = create_user(body.email, hash_password(body.password))
    return {"id": user_id, "email": body.email}

@router.post('/login')
def login(body: LoginRequest):
    user = get_user_by_email(body.email)
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"])
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
