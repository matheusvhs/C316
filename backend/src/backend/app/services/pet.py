from datetime import date

from sqlalchemy.orm import Session

from backend.app.core.erros import BusinessRuleError, ConflictError, NotFoundError
from backend.app.models import Especie, Pet
from backend.app.repositories import CuidadoRepository, PetRepository
from backend.app.schemas import Idade, PetCreate, PetResumo, PetUpdate

NOME_REPETIDO = "Já existe um pet com este nome"
CUIDADO_ANTES_DO_NASCIMENTO = "O cuidado não pode ser anterior ao nascimento do pet"


def calcular_idade(nascimento: date, hoje: date) -> Idade:
    meses = (hoje.year - nascimento.year) * 12 + hoje.month - nascimento.month
    if hoje.day < nascimento.day:
        meses -= 1
    return Idade(anos=meses // 12, meses=meses % 12)


class PetService:
    def __init__(self, session: Session) -> None:
        self.pets = PetRepository(session)
        self.cuidados = CuidadoRepository(session)

    def listar(
        self, busca: str | None = None, especie: Especie | None = None
    ) -> list[Pet]:
        return self.pets.listar(busca=busca.strip() if busca else None, especie=especie)

    def obter(self, pet_id: int) -> Pet:
        pet = self.pets.obter(pet_id)
        if pet is None:
            raise NotFoundError("Pet não encontrado")
        return pet

    def criar(self, dados: PetCreate) -> Pet:
        self._garantir_nome_livre(dados.nome)
        return self.pets.criar(dados)

    def atualizar(self, pet_id: int, dados: PetUpdate) -> Pet:
        pet = self.obter(pet_id)
        self._garantir_nome_livre(dados.nome, pet_id)
        primeiro = self.cuidados.totais_do_pet(pet_id).primeiro
        if primeiro is not None and primeiro < dados.data_nascimento:
            raise BusinessRuleError(CUIDADO_ANTES_DO_NASCIMENTO)
        return self.pets.atualizar(pet, dados)

    def remover(self, pet_id: int) -> None:
        pet = self.obter(pet_id)
        if self.cuidados.existe_para_pet(pet_id):
            raise ConflictError("Exclua os cuidados antes de remover o pet")
        self.pets.remover(pet)

    def resumo(self, pet_id: int, hoje: date | None = None) -> PetResumo:
        pet = self.obter(pet_id)
        totais = self.cuidados.totais_do_pet(pet_id)
        return PetResumo(
            idade=calcular_idade(pet.data_nascimento, hoje or date.today()),
            total_gasto=totais.total_gasto,
            quantidade_cuidados=totais.quantidade,
            ultimo_cuidado=totais.ultimo,
        )

    def _garantir_nome_livre(self, nome: str, pet_id: int | None = None) -> None:
        existente = self.pets.obter_por_nome(nome)
        if existente is not None and existente.id != pet_id:
            raise ConflictError(NOME_REPETIDO)
