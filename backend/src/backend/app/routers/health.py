from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from backend.app.routers.dependencias import SessaoDep
from backend.app.routers.erros import documentar

router = APIRouter(tags=["health"])


@router.get("/health", responses=documentar(503))
def health(sessao: SessaoDep) -> dict[str, str]:
    try:
        sessao.execute(text("SELECT 1"))
    except OperationalError as erro:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Banco de dados indisponível"
        ) from erro
    return {"status": "ok"}
