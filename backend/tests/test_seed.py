from datetime import date

from sqlalchemy.orm import Session

from backend.app.services import CuidadoService, PetService
from backend.seed import popular

HOJE = date(2026, 11, 27)


def test_seed_cria_dois_pets_com_um_alerta_de_cada_cor(
    sessao: Session, pet_service: PetService, cuidado_service: CuidadoService
) -> None:
    mensagens = popular(sessao, HOJE)

    pets = pet_service.listar()
    assert mensagens == [
        "Rex cadastrado com 3 cuidados.",
        "Mia cadastrado com 3 cuidados.",
    ]
    assert {(pet.nome, pet.especie) for pet in pets} == {
        ("Rex", "cachorro"),
        ("Mia", "gato"),
    }
    status = {
        alerta.status
        for pet in pets
        for alerta in cuidado_service.alertas(pet.id, HOJE)
    }
    assert status == {"vencido", "proximo", "em_dia"}


def test_seed_nao_duplica_quando_roda_de_novo(
    sessao: Session, pet_service: PetService, cuidado_service: CuidadoService
) -> None:
    popular(sessao, HOJE)

    mensagens = popular(sessao, HOJE)

    assert mensagens == [
        "Rex já existe, nada foi alterado.",
        "Mia já existe, nada foi alterado.",
    ]
    assert len(pet_service.listar()) == 2
    assert all(len(cuidado_service.listar(pet.id)) == 3 for pet in pet_service.listar())
