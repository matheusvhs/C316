from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Enum, String, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database import Base
from backend.app.schemas.tarefa import Prioridade


class DataHoraUTC(TypeDecorator):
    """Data e hora sempre devolvidas em UTC.

    O Postgres devolve no fuso da sessão e o SQLite (usado nos testes) perde o
    fuso; assim a API responde igual nos dois.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class TarefaModel(Base):
    __tablename__ = "tarefas"
    # No SQLite, impede reaproveitar o id de uma tarefa removida (o Postgres
    # já não reaproveita).
    __table_args__ = ({"sqlite_autoincrement": True},)

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(120))
    descricao: Mapped[str | None] = mapped_column(String(500))
    prioridade: Mapped[Prioridade] = mapped_column(
        Enum(
            Prioridade,
            name="prioridade",
            native_enum=False,
            create_constraint=True,
            length=5,
            values_callable=lambda enum: [p.value for p in enum],
        )
    )
    concluida: Mapped[bool] = mapped_column(Boolean)
    criada_em: Mapped[datetime] = mapped_column(DataHoraUTC())
    atualizada_em: Mapped[datetime] = mapped_column(DataHoraUTC())
