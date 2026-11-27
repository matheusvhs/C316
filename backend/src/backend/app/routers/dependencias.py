from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.services import CuidadoService, PetService

SessaoDep = Annotated[Session, Depends(get_db)]


def get_pet_service(sessao: SessaoDep) -> PetService:
    return PetService(sessao)


def get_cuidado_service(sessao: SessaoDep) -> CuidadoService:
    return CuidadoService(sessao)


PetServiceDep = Annotated[PetService, Depends(get_pet_service)]
CuidadoServiceDep = Annotated[CuidadoService, Depends(get_cuidado_service)]
