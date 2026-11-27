from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models import Especie, Pet
from backend.app.schemas import PetCreate, PetUpdate


def _escapar_like(texto: str) -> str:
    return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class PetRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def listar(
        self, busca: str | None = None, especie: Especie | None = None
    ) -> list[Pet]:
        consulta = select(Pet).order_by(func.lower(Pet.nome), Pet.id)
        if busca:
            consulta = consulta.where(
                Pet.nome.ilike(f"%{_escapar_like(busca)}%", escape="\\")
            )
        if especie is not None:
            consulta = consulta.where(Pet.especie == especie)
        return list(self.session.scalars(consulta))

    def obter(self, pet_id: int) -> Pet | None:
        return self.session.get(Pet, pet_id)

    def obter_por_nome(self, nome: str) -> Pet | None:
        consulta = select(Pet).where(func.lower(Pet.nome) == nome.lower())
        return self.session.scalars(consulta).first()

    def criar(self, dados: PetCreate) -> Pet:
        pet = Pet(**dados.model_dump())
        self.session.add(pet)
        self.session.commit()
        self.session.refresh(pet)
        return pet

    def atualizar(self, pet: Pet, dados: PetUpdate) -> Pet:
        for campo, valor in dados.model_dump().items():
            setattr(pet, campo, valor)
        self.session.commit()
        self.session.refresh(pet)
        return pet

    def remover(self, pet: Pet) -> None:
        self.session.delete(pet)
        self.session.commit()
