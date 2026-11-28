from datetime import date

from backend.app.schemas import CuidadoCreate, CuidadoUpdate, PetCreate, PetUpdate

NASCIMENTO = date(2020, 1, 15)


def dados_pet(**campos: object) -> dict:
    return {
        "nome": "Rex",
        "especie": "cachorro",
        "raca": None,
        "data_nascimento": NASCIMENTO.isoformat(),
        "peso_kg": "12.50",
        **campos,
    }


def dados_cuidado(**campos: object) -> dict:
    return {
        "tipo": "banho",
        "data": "2024-03-10",
        "custo": "50.00",
        "descricao": None,
        "proxima_data": None,
        **campos,
    }


def pet_create(**campos: object) -> PetCreate:
    return PetCreate(**dados_pet(**campos))


def pet_update(**campos: object) -> PetUpdate:
    return PetUpdate(**dados_pet(**campos))


def cuidado_create(**campos: object) -> CuidadoCreate:
    return CuidadoCreate(**dados_cuidado(**campos))


def cuidado_update(**campos: object) -> CuidadoUpdate:
    return CuidadoUpdate(**dados_cuidado(**campos))
