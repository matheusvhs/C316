from datetime import date, timedelta
from decimal import Decimal

import pytest

from backend.app.core.erros import BusinessRuleError, NotFoundError
from backend.app.models import Pet, TipoCuidado
from backend.app.schemas import StatusAlerta
from backend.app.services import CuidadoService, PetService
from backend.app.services.cuidado import classificar
from tests.fabricas import cuidado_create, cuidado_update, pet_create

HOJE = date(2026, 11, 27)


@pytest.fixture
def rex(pet_service: PetService) -> Pet:
    return pet_service.criar(pet_create(data_nascimento="2020-01-15"))


def dias(n: int) -> date:
    return HOJE + timedelta(days=n)


def test_criar_e_listar_em_ordem_de_data_decrescente(
    cuidado_service: CuidadoService, rex: Pet
):
    cuidado_service.criar(rex.id, cuidado_create(data="2024-01-10"))
    cuidado_service.criar(rex.id, cuidado_create(data="2024-05-02", tipo="consulta"))
    cuidado_service.criar(rex.id, cuidado_create(data="2023-07-20"))

    datas = [c.data.isoformat() for c in cuidado_service.listar(rex.id)]

    assert datas == ["2024-05-02", "2024-01-10", "2023-07-20"]


def test_filtrar_cuidados_por_tipo(cuidado_service: CuidadoService, rex: Pet):
    cuidado_service.criar(rex.id, cuidado_create(tipo="banho"))
    cuidado_service.criar(rex.id, cuidado_create(tipo="vacina", descricao="V10"))

    vacinas = cuidado_service.listar(rex.id, TipoCuidado.VACINA)

    assert [(c.tipo, c.descricao) for c in vacinas] == [(TipoCuidado.VACINA, "V10")]


def test_regra_2_nao_registra_cuidado_antes_do_nascimento(
    cuidado_service: CuidadoService, rex: Pet
):
    with pytest.raises(BusinessRuleError, match="anterior ao nascimento do pet"):
        cuidado_service.criar(rex.id, cuidado_create(data="2020-01-14"))


def test_regra_2_registra_cuidado_no_dia_do_nascimento(
    cuidado_service: CuidadoService, rex: Pet
):
    cuidado = cuidado_service.criar(rex.id, cuidado_create(data="2020-01-15"))

    assert cuidado.data == date(2020, 1, 15)


def test_regra_2_nao_edita_cuidado_para_antes_do_nascimento(
    cuidado_service: CuidadoService, rex: Pet
):
    cuidado = cuidado_service.criar(rex.id, cuidado_create())

    with pytest.raises(BusinessRuleError, match="anterior ao nascimento do pet"):
        cuidado_service.atualizar(cuidado.id, cuidado_update(data="2019-12-31"))


@pytest.mark.parametrize("descricao", [None, "   "])
def test_regra_4_vacina_precisa_de_nome(
    cuidado_service: CuidadoService, rex: Pet, descricao: str | None
):
    with pytest.raises(BusinessRuleError, match="Informe o nome da vacina"):
        cuidado_service.criar(
            rex.id, cuidado_create(tipo="vacina", descricao=descricao)
        )


def test_regra_4_nao_edita_para_vacina_sem_nome(
    cuidado_service: CuidadoService, rex: Pet
):
    cuidado = cuidado_service.criar(rex.id, cuidado_create(tipo="banho"))

    with pytest.raises(BusinessRuleError, match="Informe o nome da vacina"):
        cuidado_service.atualizar(cuidado.id, cuidado_update(tipo="vacina"))


def test_regra_4_registra_vacina_com_nome(cuidado_service: CuidadoService, rex: Pet):
    cuidado = cuidado_service.criar(
        rex.id, cuidado_create(tipo="vacina", descricao="Antirrábica")
    )

    assert cuidado.descricao == "Antirrábica"


def test_atualizar_e_remover_cuidado(cuidado_service: CuidadoService, rex: Pet):
    cuidado = cuidado_service.criar(rex.id, cuidado_create())

    atualizado = cuidado_service.atualizar(
        cuidado.id, cuidado_update(custo="65.00", descricao="com tosa")
    )
    cuidado_service.remover(cuidado.id)

    assert (atualizado.custo, atualizado.descricao) == (Decimal("65.00"), "com tosa")
    with pytest.raises(NotFoundError, match="Cuidado não encontrado"):
        cuidado_service.obter(cuidado.id)


@pytest.mark.parametrize(
    "operacao",
    [
        lambda s: s.listar(999),
        lambda s: s.criar(999, cuidado_create()),
        lambda s: s.alertas(999),
    ],
    ids=["listar", "criar", "alertas"],
)
def test_regra_6_pet_inexistente(cuidado_service: CuidadoService, operacao):
    with pytest.raises(NotFoundError, match="Pet não encontrado"):
        operacao(cuidado_service)


@pytest.mark.parametrize(
    "operacao",
    [
        lambda s: s.obter(999),
        lambda s: s.atualizar(999, cuidado_update()),
        lambda s: s.remover(999),
    ],
    ids=["obter", "atualizar", "remover"],
)
def test_regra_6_cuidado_inexistente(cuidado_service: CuidadoService, operacao):
    with pytest.raises(NotFoundError, match="Cuidado não encontrado"):
        operacao(cuidado_service)


@pytest.mark.parametrize(
    ("dias_restantes", "status"),
    [
        (-1, StatusAlerta.VENCIDO),
        (0, StatusAlerta.PROXIMO),
        (7, StatusAlerta.PROXIMO),
        (8, StatusAlerta.EM_DIA),
    ],
)
def test_classificar(dias_restantes: int, status: StatusAlerta):
    assert classificar(dias_restantes) == status


def test_alertas_cobrem_os_tres_status(cuidado_service: CuidadoService, rex: Pet):
    cuidado_service.criar(
        rex.id, cuidado_create(tipo="vermifugo", data=dias(-90), proxima_data=dias(-2))
    )
    cuidado_service.criar(
        rex.id,
        cuidado_create(tipo="antipulgas", data=dias(-25), proxima_data=dias(5)),
    )
    cuidado_service.criar(
        rex.id,
        cuidado_create(
            tipo="vacina", descricao="V10", data=dias(-30), proxima_data=dias(335)
        ),
    )

    alertas = cuidado_service.alertas(rex.id, hoje=HOJE)

    assert [(a.tipo, a.dias_restantes, a.status) for a in alertas] == [
        (TipoCuidado.VERMIFUGO, -2, StatusAlerta.VENCIDO),
        (TipoCuidado.ANTIPULGAS, 5, StatusAlerta.PROXIMO),
        (TipoCuidado.VACINA, 335, StatusAlerta.EM_DIA),
    ]
    assert alertas[2].descricao == "V10"


def test_alerta_usa_o_cuidado_mais_recente_de_cada_tipo(
    cuidado_service: CuidadoService, rex: Pet
):
    cuidado_service.criar(
        rex.id,
        cuidado_create(tipo="vermifugo", data=dias(-100), proxima_data=dias(-10)),
    )
    recente = cuidado_service.criar(
        rex.id, cuidado_create(tipo="vermifugo", data=dias(-20), proxima_data=dias(70))
    )
    cuidado_service.criar(rex.id, cuidado_create(tipo="banho", data=dias(-1)))

    alertas = cuidado_service.alertas(rex.id, hoje=HOJE)

    assert [(a.cuidado_id, a.status) for a in alertas] == [
        (recente.id, StatusAlerta.EM_DIA)
    ]


def test_sem_proxima_data_nao_ha_alertas(cuidado_service: CuidadoService, rex: Pet):
    cuidado_service.criar(rex.id, cuidado_create())

    assert cuidado_service.alertas(rex.id, hoje=HOJE) == []
