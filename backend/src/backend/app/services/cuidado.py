from datetime import date

from sqlalchemy.orm import Session

from backend.app.core.erros import BusinessRuleError, NotFoundError
from backend.app.models import Cuidado, Pet, TipoCuidado
from backend.app.repositories import CuidadoRepository
from backend.app.schemas import Alerta, CuidadoCreate, CuidadoUpdate, StatusAlerta
from backend.app.services.pet import CUIDADO_ANTES_DO_NASCIMENTO, PetService

DIAS_PARA_PROXIMO = 7


def classificar(dias_restantes: int) -> StatusAlerta:
    if dias_restantes < 0:
        return StatusAlerta.VENCIDO
    if dias_restantes <= DIAS_PARA_PROXIMO:
        return StatusAlerta.PROXIMO
    return StatusAlerta.EM_DIA


class CuidadoService:
    def __init__(self, session: Session) -> None:
        self.cuidados = CuidadoRepository(session)
        self.pets = PetService(session)

    def listar(self, pet_id: int, tipo: TipoCuidado | None = None) -> list[Cuidado]:
        self.pets.obter(pet_id)
        return self.cuidados.listar_por_pet(pet_id, tipo)

    def obter(self, cuidado_id: int) -> Cuidado:
        cuidado = self.cuidados.obter(cuidado_id)
        if cuidado is None:
            raise NotFoundError("Cuidado não encontrado")
        return cuidado

    def criar(self, pet_id: int, dados: CuidadoCreate) -> Cuidado:
        pet = self.pets.obter(pet_id)
        self._validar(pet, dados)
        return self.cuidados.criar(pet_id, dados)

    def atualizar(self, cuidado_id: int, dados: CuidadoUpdate) -> Cuidado:
        cuidado = self.obter(cuidado_id)
        self._validar(cuidado.pet, dados)
        return self.cuidados.atualizar(cuidado, dados)

    def remover(self, cuidado_id: int) -> None:
        self.cuidados.remover(self.obter(cuidado_id))

    def alertas(self, pet_id: int, hoje: date | None = None) -> list[Alerta]:
        self.pets.obter(pet_id)
        hoje = hoje or date.today()
        alertas = []
        for cuidado in self.cuidados.mais_recentes_com_proxima_data(pet_id):
            dias_restantes = (cuidado.proxima_data - hoje).days
            alertas.append(
                Alerta(
                    cuidado_id=cuidado.id,
                    tipo=cuidado.tipo,
                    descricao=cuidado.descricao,
                    proxima_data=cuidado.proxima_data,
                    dias_restantes=dias_restantes,
                    status=classificar(dias_restantes),
                )
            )
        return alertas

    @staticmethod
    def _validar(pet: Pet, dados: CuidadoCreate | CuidadoUpdate) -> None:
        if dados.tipo == TipoCuidado.VACINA and not dados.descricao:
            raise BusinessRuleError("Informe o nome da vacina")
        if dados.data < pet.data_nascimento:
            raise BusinessRuleError(CUIDADO_ANTES_DO_NASCIMENTO)
