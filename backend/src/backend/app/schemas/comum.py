from datetime import date
from typing import Annotated

from pydantic import AfterValidator


def limpar_texto(valor: object) -> object:
    if isinstance(valor, str):
        return valor.strip() or None
    return valor


def _nao_futura(valor: date) -> date:
    if valor > date.today():
        raise ValueError("A data não pode ser futura")
    return valor


DataPassada = Annotated[date, AfterValidator(_nao_futura)]
