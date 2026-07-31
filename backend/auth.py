"""DAK standard auth primitive.

Simple admin-key check. Every DAK project starts with this so you
don't reinvent auth on the first admin endpoint. Upgrade to real
sessions / JWT / OAuth only when the project genuinely needs multi-
user auth.

Usage:
    from auth import require_admin

    @app.post("/api/admin/do-thing", dependencies=[Depends(require_admin)])
    async def do_thing(): ...

Or in a router:
    router = APIRouter(dependencies=[Depends(require_admin)])

Key is checked against the DETAILED_PASSWORD env var. Sent via
X-Admin-Key header, or via `admin_key` cookie (useful for SPAs).
"""
import os

from fastapi import Header, HTTPException, Cookie


ADMIN_PASSWORD = os.environ.get("DETAILED_PASSWORD", "")


async def require_admin(
    x_admin_key: str | None = Header(default=None),
    admin_key: str | None = Cookie(default=None),
):
    if not ADMIN_PASSWORD:
        # Prod safety: refuse rather than allow all.
        raise HTTPException(status_code=503, detail="admin auth not configured")
    supplied = x_admin_key or admin_key
    if not supplied or supplied != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="admin key required")
    return True
