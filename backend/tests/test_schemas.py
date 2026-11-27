from datetime import date, timedelta
from decimal import Decimal

import pytest
from pydantic import ValidationError

from backend.app.schemas import CuidadoCreate, PetCreate
from tests.fabricas import dados_cuidado, dados_pet

AMANHA = (date.today() + timedelta(days=1)).isoformat()


def campos_com_erro(erro: ValidationError) -> list[tuple]:
    return [falha["loc"] for falha in erro.errors()]


def test_pet_valido_normaliza_textos():
    pet = PetCreate(**dados_pet(nome="  Rex  ", raca="   "))

    assert pet.nome == "Rex"
    assert pet.raca is None
    assert pet.peso_kg == Decimal("12.50")


@pytest.mark.parametrize(
    ("campos", "campo"),
    [
        ({"nome": "R"}, "nome"),
        ({"nome": "   "}, "nome"),
        ({"nome": "a" * 61}, "nome"),
        ({"especie": "peixe"}, "especie"),
        ({"raca": "a" * 61}, "raca"),
        ({"data_nascimento": AMANHA}, "data_nascimento"),
        ({"peso_kg": "0"}, "peso_kg"),
        ({"peso_kg": "150.01"}, "peso_kg"),
        ({"peso_kg": "1.234"}, "peso_kg"),
    ],
)
def test_pet_invalido(campos: dict, campo: str):
    with pytest.raises(ValidationError) as erro:
        PetCreate(**dados_pet(**campos))

    assert campos_com_erro(erro.value) == [(campo,)]


def test_pet_aceita_limites():
    pet = PetCreate(**dados_pet(peso_kg="150", data_nascimento=date.today()))

    assert pet.peso_kg == Decimal("150")
    assert pet.data_nascimento == date.today()


@pytest.mark.parametrize(
    ("campos", "campo"),
    [
        ({"tipo": "tosa"}, "tipo"),
        ({"data": AMANHA}, "data"),
        ({"custo": "-0.01"}, "custo"),
        ({"descricao": "a" * 256}, "descricao"),
    ],
)
def test_cuidado_invalido(campos: dict, campo: str):
    with pytest.raises(ValidationError) as erro:
        CuidadoCreate(**dados_cuidado(**campos))

    assert campos_com_erro(erro.value) == [(campo,)]


@pytest.mark.parametrize("proxima_data", ["2024-03-10", "2024-03-09"])
def test_regra_3_proxima_data_precisa_ser_depois_da_data(proxima_data: str):
    with pytest.raises(ValidationError) as erro:
        CuidadoCreate(**dados_cuidado(data="2024-03-10", proxima_data=proxima_data))

    assert campos_com_erro(erro.value) == [("proxima_data",)]
    assert "depois da data do cuidado" in erro.value.errors()[0]["msg"]


def test_regra_3_aceita_proxima_data_posterior():
    cuidado = CuidadoCreate(
        **dados_cuidado(data="2024-03-10", proxima_data="2024-03-11", custo="0")
    )

    assert cuidado.proxima_data == date(2024, 3, 11)
    assert cuidado.custo == Decimal("0")


def test_descricao_em_branco_vira_none():
    assert CuidadoCreate(**dados_cuidado(descricao="  ")).descricao is None
