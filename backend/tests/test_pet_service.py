from datetime import date
from decimal import Decimal

import pytest

from backend.app.core.erros import BusinessRuleError, ConflictError, NotFoundError
from backend.app.models import Especie
from backend.app.services import CuidadoService, PetService
from backend.app.services.pet import calcular_idade
from tests.fabricas import cuidado_create, pet_create, pet_update


def test_criar_e_obter_pet(pet_service: PetService):
    pet = pet_service.criar(pet_create())

    obtido = pet_service.obter(pet.id)

    assert obtido.nome == "Rex"
    assert obtido.especie == Especie.CACHORRO
    assert obtido.criado_em is not None


def test_listar_com_busca_e_especie(pet_service: PetService):
    pet_service.criar(pet_create(nome="Rex"))
    pet_service.criar(pet_create(nome="Rexona", especie="gato"))
    pet_service.criar(pet_create(nome="Bob"))

    assert [p.nome for p in pet_service.listar()] == ["Bob", "Rex", "Rexona"]
    assert [p.nome for p in pet_service.listar(busca="  rEx ")] == ["Rex", "Rexona"]
    assert [p.nome for p in pet_service.listar(especie=Especie.GATO)] == ["Rexona"]
    assert [
        p.nome for p in pet_service.listar(busca="rex", especie=Especie.CACHORRO)
    ] == ["Rex"]


def test_busca_trata_curingas_como_texto(pet_service: PetService):
    pet_service.criar(pet_create(nome="Rex_100%"))
    pet_service.criar(pet_create(nome="Bob"))

    assert [p.nome for p in pet_service.listar(busca="%")] == ["Rex_100%"]
    assert [p.nome for p in pet_service.listar(busca="_")] == ["Rex_100%"]


def test_regra_1_nao_cria_nome_repetido_sem_diferenciar_maiusculas(
    pet_service: PetService,
):
    pet_service.criar(pet_create(nome="Rex"))

    with pytest.raises(ConflictError, match="Já existe um pet com este nome"):
        pet_service.criar(pet_create(nome="REX"))


def test_regra_1_nao_edita_para_nome_de_outro_pet(pet_service: PetService):
    pet_service.criar(pet_create(nome="Rex"))
    mia = pet_service.criar(pet_create(nome="Mia", especie="gato"))

    with pytest.raises(ConflictError, match="Já existe um pet com este nome"):
        pet_service.atualizar(mia.id, pet_update(nome="rex", especie="gato"))


def test_regra_1_edita_mantendo_o_proprio_nome(pet_service: PetService):
    rex = pet_service.criar(pet_create(nome="Rex"))

    atualizado = pet_service.atualizar(rex.id, pet_update(nome="REX", peso_kg="13"))

    assert atualizado.nome == "REX"
    assert atualizado.peso_kg == Decimal("13.00")


def test_regra_2_nao_move_nascimento_para_depois_do_primeiro_cuidado(
    pet_service: PetService, cuidado_service: CuidadoService
):
    rex = pet_service.criar(pet_create(data_nascimento="2020-01-15"))
    cuidado_service.criar(rex.id, cuidado_create(data="2020-02-01"))

    with pytest.raises(BusinessRuleError, match="anterior ao nascimento"):
        pet_service.atualizar(rex.id, pet_update(data_nascimento="2020-02-02"))


def test_regra_2_move_nascimento_ate_o_dia_do_primeiro_cuidado(
    pet_service: PetService, cuidado_service: CuidadoService
):
    rex = pet_service.criar(pet_create(data_nascimento="2020-01-15"))
    cuidado_service.criar(rex.id, cuidado_create(data="2020-02-01"))

    atualizado = pet_service.atualizar(rex.id, pet_update(data_nascimento="2020-02-01"))

    assert atualizado.data_nascimento == date(2020, 2, 1)


def test_regra_5_nao_remove_pet_com_cuidados(
    pet_service: PetService, cuidado_service: CuidadoService
):
    rex = pet_service.criar(pet_create())
    cuidado_service.criar(rex.id, cuidado_create())

    with pytest.raises(ConflictError, match="Exclua os cuidados antes"):
        pet_service.remover(rex.id)


def test_regra_5_remove_pet_sem_cuidados(pet_service: PetService):
    rex = pet_service.criar(pet_create())

    pet_service.remover(rex.id)

    with pytest.raises(NotFoundError):
        pet_service.obter(rex.id)


@pytest.mark.parametrize(
    "operacao",
    [
        lambda s: s.obter(999),
        lambda s: s.atualizar(999, pet_update()),
        lambda s: s.remover(999),
        lambda s: s.resumo(999),
    ],
    ids=["obter", "atualizar", "remover", "resumo"],
)
def test_regra_6_pet_inexistente(pet_service: PetService, operacao):
    with pytest.raises(NotFoundError, match="Pet não encontrado"):
        operacao(pet_service)


def test_resumo_com_cuidados(pet_service: PetService, cuidado_service: CuidadoService):
    rex = pet_service.criar(pet_create(data_nascimento="2020-01-15"))
    cuidado_service.criar(rex.id, cuidado_create(data="2024-01-10", custo="80.50"))
    cuidado_service.criar(rex.id, cuidado_create(data="2024-05-02", custo="19.50"))

    resumo = pet_service.resumo(rex.id, hoje=date(2026, 11, 27))

    assert (resumo.idade.anos, resumo.idade.meses) == (6, 10)
    assert resumo.total_gasto == Decimal("100.00")
    assert resumo.quantidade_cuidados == 2
    assert resumo.ultimo_cuidado == date(2024, 5, 2)


def test_resumo_sem_cuidados(pet_service: PetService):
    rex = pet_service.criar(pet_create())

    resumo = pet_service.resumo(rex.id)

    assert resumo.total_gasto == Decimal("0.00")
    assert resumo.quantidade_cuidados == 0
    assert resumo.ultimo_cuidado is None


@pytest.mark.parametrize(
    ("nascimento", "hoje", "esperado"),
    [
        ("2020-01-15", "2026-01-14", (5, 11)),
        ("2020-01-15", "2026-01-15", (6, 0)),
        ("2020-01-31", "2020-02-29", (0, 0)),
        ("2026-11-27", "2026-11-27", (0, 0)),
    ],
)
def test_calcular_idade(nascimento: str, hoje: str, esperado: tuple[int, int]):
    idade = calcular_idade(date.fromisoformat(nascimento), date.fromisoformat(hoje))

    assert (idade.anos, idade.meses) == esperado
