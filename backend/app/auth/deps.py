import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.security import decode_access_token
from app.repository.user_repository import get_user_by_id
from app.domain.user import User

bearer = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> User:
    try:
        user_id = decode_access_token(credentials.credentials)
    # PyJWTError is the base class every decode failure inherits from: a bad
    # signature, a malformed token, an unexpected algorithm, and â€” the common
    # one â€” an expired token. PyJWKError is a subclass covering JSON Web Key
    # lookups, which HS256 with a shared secret never performs, so catching it
    # let all of the above escape as a 500.
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = get_user_by_id(user_id)
    if user is None: 
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(id=user["id"], email=user["email"])