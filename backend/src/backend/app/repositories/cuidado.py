from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models import Cuidado, TipoCuidado
from backend.app.schemas import CuidadoCreate, CuidadoUpdate


@dataclass(frozen=True)
class TotaisCuidados:
    total_gasto: Decimal
    quantidade: int
    ultimo: date | None
    primeiro: date | None


class CuidadoRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def listar_por_pet(
        self, pet_id: int, tipo: TipoCuidado | None = None
    ) -> list[Cuidado]:
        consulta = (
            select(Cuidado)
            .where(Cuidado.pet_id == pet_id)
            .order_by(Cuidado.data.desc(), Cuidado.id.desc())
        )
        if tipo is not None:
            consulta = consulta.where(Cuidado.tipo == tipo)
        return list(self.session.scalars(consulta))

    def obter(self, cuidado_id: int) -> Cuidado | None:
        return self.session.get(Cuidado, cuidado_id)

    def existe_para_pet(self, pet_id: int) -> bool:
        consulta = select(Cuidado.id).where(Cuidado.pet_id == pet_id).limit(1)
        return self.session.scalar(consulta) is not None

    def totais_do_pet(self, pet_id: int) -> TotaisCuidados:
        consulta = select(
            func.coalesce(func.sum(Cuidado.custo), 0),
            func.count(Cuidado.id),
            func.max(Cuidado.data),
            func.min(Cuidado.data),
        ).where(Cuidado.pet_id == pet_id)
        total, quantidade, ultimo, primeiro = self.session.execute(consulta).one()
        centavos = Decimal("0.01")
        return TotaisCuidados(
            Decimal(total).quantize(centavos), quantidade, ultimo, primeiro
        )

    def mais_recentes_com_proxima_data(self, pet_id: int) -> list[Cuidado]:
        ordem = (
            func.row_number()
            .over(
                partition_by=Cuidado.tipo,
                order_by=(Cuidado.data.desc(), Cuidado.id.desc()),
            )
            .label("ordem")
        )
        recentes = (
            select(Cuidado.id, ordem)
            .where(Cuidado.pet_id == pet_id, Cuidado.proxima_data.is_not(None))
            .subquery()
        )
        consulta = (
            select(Cuidado)
            .join(recentes, recentes.c.id == Cuidado.id)
            .where(recentes.c.ordem == 1)
            .order_by(Cuidado.proxima_data, Cuidado.id)
        )
        return list(self.session.scalars(consulta))

    def criar(self, pet_id: int, dados: CuidadoCreate) -> Cuidado:
        cuidado = Cuidado(pet_id=pet_id, **dados.model_dump())
        self.session.add(cuidado)
        self.session.commit()
        self.session.refresh(cuidado)
        return cuidado

    def atualizar(self, cuidado: Cuidado, dados: CuidadoUpdate) -> Cuidado:
        for campo, valor in dados.model_dump().items():
            setattr(cuidado, campo, valor)
        self.session.commit()
        self.session.refresh(cuidado)
        return cuidado

    def remover(self, cuidado: Cuidado) -> None:
        self.session.delete(cuidado)
        self.session.commit()
