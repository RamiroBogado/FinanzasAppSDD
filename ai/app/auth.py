import jwt
from fastapi import HTTPException, Request

from app.config import JWT_SECRET


def get_bearer_token(request: Request) -> str:
    header = request.headers.get("authorization")

    if not header or not header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")

    return header[len("Bearer "):]


def require_user_id(request: Request) -> int:
    token = get_bearer_token(request)

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_sub": False},
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
