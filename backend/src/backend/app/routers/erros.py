from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError

from backend.app.core.erros import (
    BusinessRuleError,
    ConflictError,
    DomainError,
    NotFoundError,
)

STATUS_POR_ERRO: dict[type[DomainError], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ConflictError: status.HTTP_409_CONFLICT,
    BusinessRuleError: status.HTTP_422_UNPROCESSABLE_CONTENT,
}

ROTULOS = {
    "nome": "Nome",
    "especie": "Espécie",
    "raca": "Raça",
    "data_nascimento": "Data de nascimento",
    "peso_kg": "Peso",
    "tipo": "Tipo",
    "data": "Data",
    "custo": "Custo",
    "descricao": "Descrição",
    "proxima_data": "Próxima data",
    "busca": "Busca",
    "pet_id": "Pet",
    "cuidado_id": "Cuidado",
    "corpo": "Corpo da requisição",
}

MENSAGENS_DE_VALIDACAO = {
    "missing": "Campo obrigatório",
    "string_too_short": "Deve ter pelo menos {min_length} caracteres",
    "string_too_long": "Deve ter no máximo {max_length} caracteres",
    "string_type": "Informe um texto",
    "enum": "Escolha uma opção válida",
    "greater_than": "Deve ser maior que {gt}",
    "greater_than_equal": "Deve ser maior ou igual a {ge}",
    "less_than_equal": "Deve ser no máximo {le}",
    "decimal_max_places": "Use no máximo {decimal_places} casas decimais",
    "decimal_max_digits": "Número grande demais",
    "decimal_parsing": "Informe um número válido",
    "decimal_type": "Informe um número válido",
    "int_parsing": "Informe um número inteiro",
    "date_parsing": "Informe uma data válida",
    "date_from_datetime_parsing": "Informe uma data válida",
    "date_type": "Informe uma data válida",
    "json_invalid": "JSON inválido",
    "model_attributes_type": "Envie um objeto JSON",
}


def _traduzir(erro: dict) -> dict[str, str]:
    contexto = erro.get("ctx", {})
    if erro["type"] == "value_error":
        mensagem = str(contexto.get("error", erro["msg"]))
    else:
        modelo = MENSAGENS_DE_VALIDACAO.get(erro["type"], "Valor inválido")
        mensagem = modelo.format(**contexto)
    if erro["type"] == "json_invalid":
        campo = "corpo"
    else:
        campo = ".".join(str(parte) for parte in erro["loc"][1:]) or "corpo"
    return {"campo": campo, "mensagem": mensagem}


class ErroResposta(BaseModel):
    detail: str


def documentar(*codigos: int) -> dict[int | str, dict]:
    return {codigo: {"model": ErroResposta} for codigo in codigos}


def registrar_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def erro_de_dominio(_: Request, erro: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=STATUS_POR_ERRO.get(type(erro), status.HTTP_400_BAD_REQUEST),
            content={"detail": erro.mensagem},
        )

    @app.exception_handler(RequestValidationError)
    async def erro_de_validacao(
        _: Request, erro: RequestValidationError
    ) -> JSONResponse:
        erros = [_traduzir(item) for item in erro.errors()]
        detalhe = "; ".join(
            f"{ROTULOS.get(item['campo'], item['campo'])}: {item['mensagem']}"
            for item in erros
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={"detail": detalhe, "erros": erros},
        )

    @app.exception_handler(IntegrityError)
    async def erro_de_integridade(_: Request, __: IntegrityError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "A operação conflita com dados já cadastrados"},
        )
