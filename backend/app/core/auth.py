from typing import Annotated

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import get_settings

security = HTTPBearer(auto_error=False)

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    settings = get_settings()
    if _jwks_client is None:
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


async def verify_supabase_token(token: str) -> dict:
    settings = get_settings()
    try:
        if settings.supabase_url:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "HS256"],
                audience="authenticated",
                options={"verify_aud": False},
            )
            return payload
    except Exception:
        pass

    if settings.supabase_service_role_key:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_service_role_key,
                algorithms=["HS256"],
                options={"verify_aud": False, "verify_exp": False},
            )
            if payload.get("sub"):
                return payload
        except Exception:
            pass

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_anon_key},
        )
        if resp.status_code == 200:
            user = resp.json()
            return {"sub": user["id"], "email": user.get("email")}

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return await verify_supabase_token(credentials.credentials)
