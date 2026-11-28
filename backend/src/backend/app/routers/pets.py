from typing import Annotated

from fastapi import APIRouter, Query, status

from backend.app.models import Especie
from backend.app.routers.dependencias import PetServiceDep
from backend.app.routers.erros import documentar
from backend.app.schemas import PetCreate, PetRead, PetResumo, PetUpdate

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=PetRead,
    responses=documentar(409),
)
def criar_pet(dados: PetCreate, service: PetServiceDep):
    return service.criar(dados)


@router.get("", response_model=list[PetRead])
def listar_pets(
    service: PetServiceDep,
    busca: Annotated[str | None, Query(max_length=60)] = None,
    especie: Especie | None = None,
):
    return service.listar(busca=busca, especie=especie)


@router.get("/{pet_id}", response_model=PetRead, responses=documentar(404))
def obter_pet(pet_id: int, service: PetServiceDep):
    return service.obter(pet_id)


@router.put("/{pet_id}", response_model=PetRead, responses=documentar(404, 409))
def atualizar_pet(pet_id: int, dados: PetUpdate, service: PetServiceDep):
    return service.atualizar(pet_id, dados)


@router.delete(
    "/{pet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=documentar(404, 409),
)
def remover_pet(pet_id: int, service: PetServiceDep) -> None:
    service.remover(pet_id)


@router.get("/{pet_id}/resumo", response_model=PetResumo, responses=documentar(404))
def resumo_do_pet(pet_id: int, service: PetServiceDep):
    return service.resumo(pet_id)
