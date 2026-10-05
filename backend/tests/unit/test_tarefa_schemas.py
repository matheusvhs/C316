import pytest
from pydantic import ValidationError

from backend.app.schemas.tarefa import Prioridade, TarefaCreate, TarefaPatch


def test_create_aplica_os_valores_padrao():
    tarefa = TarefaCreate(titulo="Estudar")

    assert tarefa.descricao is None
    assert tarefa.prioridade is Prioridade.MEDIA
    assert tarefa.concluida is False


def test_create_converte_prioridade_em_enum():
    assert TarefaCreate(titulo="x", prioridade="alta").prioridade is Prioridade.ALTA


@pytest.mark.parametrize(
    "dados",
    [
        {},
        {"titulo": ""},
        {"titulo": "x" * 121},
        {"titulo": "x", "descricao": "y" * 501},
        {"titulo": "x", "prioridade": "urgente"},
    ],
)
def test_create_rejeita_dados_invalidos(dados):
    with pytest.raises(ValidationError):
        TarefaCreate(**dados)


def test_patch_vazio_nao_marca_nenhum_campo():
    assert TarefaPatch().model_dump(exclude_unset=True) == {}


def test_patch_guarda_apenas_os_campos_enviados():
    patch = TarefaPatch(concluida=True)

    assert patch.model_dump(exclude_unset=True) == {"concluida": True}


def test_patch_aceita_descricao_nula():
    patch = TarefaPatch(descricao=None)

    assert patch.model_dump(exclude_unset=True) == {"descricao": None}


@pytest.mark.parametrize("campo", ["titulo", "prioridade", "concluida"])
def test_patch_rejeita_null_em_campo_obrigatorio(campo):
    with pytest.raises(ValidationError, match=f"{campo} não pode ser null"):
        TarefaPatch(**{campo: None})


def test_patch_rejeita_campo_desconhecido():
    with pytest.raises(ValidationError):
        TarefaPatch(campo_inexistente=1)
