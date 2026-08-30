import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.security import decode_access_token
from app.domain.user import User
from app.repository.user_repository import get_user_by_id

bearer = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> User:
    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = get_user_by_id(user_id)
    if user is None: 
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(id=user["id"], email=user["email"])