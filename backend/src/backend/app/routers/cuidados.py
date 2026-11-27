from fastapi import APIRouter, status

from backend.app.models import TipoCuidado
from backend.app.routers.dependencias import CuidadoServiceDep
from backend.app.routers.erros import documentar
from backend.app.schemas import Alerta, CuidadoCreate, CuidadoRead, CuidadoUpdate

router = APIRouter(tags=["cuidados"])


@router.post(
    "/pets/{pet_id}/cuidados",
    status_code=status.HTTP_201_CREATED,
    response_model=CuidadoRead,
    responses=documentar(404),
)
def criar_cuidado(pet_id: int, dados: CuidadoCreate, service: CuidadoServiceDep):
    return service.criar(pet_id, dados)


@router.get(
    "/pets/{pet_id}/cuidados",
    response_model=list[CuidadoRead],
    responses=documentar(404),
)
def listar_cuidados(
    pet_id: int, service: CuidadoServiceDep, tipo: TipoCuidado | None = None
):
    return service.listar(pet_id, tipo)


@router.get(
    "/pets/{pet_id}/alertas", response_model=list[Alerta], responses=documentar(404)
)
def alertas_do_pet(pet_id: int, service: CuidadoServiceDep):
    return service.alertas(pet_id)


@router.put(
    "/cuidados/{cuidado_id}", response_model=CuidadoRead, responses=documentar(404)
)
def atualizar_cuidado(
    cuidado_id: int, dados: CuidadoUpdate, service: CuidadoServiceDep
):
    return service.atualizar(cuidado_id, dados)


@router.delete(
    "/cuidados/{cuidado_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=documentar(404),
)
def remover_cuidado(cuidado_id: int, service: CuidadoServiceDep) -> None:
    service.remover(cuidado_id)
