from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from backend.app.core.erros import ConflictError
from backend.app.db.session import SessionLocal
from backend.app.models import Especie, TipoCuidado
from backend.app.schemas import CuidadoCreate, PetCreate
from backend.app.services import CuidadoService, PetService


def _dados(hoje: date) -> list[tuple[PetCreate, list[CuidadoCreate]]]:
    def dia(deslocamento: int) -> date:
        return hoje + timedelta(days=deslocamento)

    return [
        (
            PetCreate(
                nome="Rex",
                especie=Especie.CACHORRO,
                raca="Vira-lata",
                data_nascimento=date(2020, 1, 15),
                peso_kg=Decimal("12.50"),
            ),
            [
                CuidadoCreate(
                    tipo=TipoCuidado.VACINA,
                    data=dia(-370),
                    custo=Decimal("120.00"),
                    descricao="V10",
                    proxima_data=dia(-5),
                ),
                CuidadoCreate(
                    tipo=TipoCuidado.VERMIFUGO,
                    data=dia(-87),
                    custo=Decimal("35.90"),
                    proxima_data=dia(3),
                ),
                CuidadoCreate(
                    tipo=TipoCuidado.BANHO,
                    data=dia(-14),
                    custo=Decimal("60.00"),
                    descricao="Banho e tosa",
                ),
            ],
        ),
        (
            PetCreate(
                nome="Mia",
                especie=Especie.GATO,
                data_nascimento=date(2022, 5, 10),
                peso_kg=Decimal("4.20"),
            ),
            [
                CuidadoCreate(
                    tipo=TipoCuidado.CONSULTA,
                    data=dia(-40),
                    custo=Decimal("150.00"),
                    descricao="Check-up anual",
                ),
                CuidadoCreate(
                    tipo=TipoCuidado.ANTIPULGAS,
                    data=dia(-10),
                    custo=Decimal("89.90"),
                    proxima_data=dia(20),
                ),
                CuidadoCreate(
                    tipo=TipoCuidado.VACINA,
                    data=dia(-30),
                    custo=Decimal("95.00"),
                    descricao="V4 felina",
                    proxima_data=dia(335),
                ),
            ],
        ),
    ]


def popular(sessao: Session, hoje: date | None = None) -> list[str]:
    pets = PetService(sessao)
    cuidados = CuidadoService(sessao)
    mensagens = []
    for dados_pet, dados_cuidados in _dados(hoje or date.today()):
        try:
            pet = pets.criar(dados_pet)
        except ConflictError:
            mensagens.append(f"{dados_pet.nome} já existe, nada foi alterado.")
            continue
        for dados_cuidado in dados_cuidados:
            cuidados.criar(pet.id, dados_cuidado)
        mensagens.append(f"{pet.nome} cadastrado com {len(dados_cuidados)} cuidados.")
    return mensagens


def main() -> None:
    with SessionLocal() as sessao:
        for mensagem in popular(sessao):
            print(mensagem)


if __name__ == "__main__":
    main()
