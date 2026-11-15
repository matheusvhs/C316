import os

# Fora do Compose a API fala com o Postgres exposto em localhost; dentro dele,
# o docker-compose.yml sobrescreve com o host `db`.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg://c316:c316@localhost:5432/c316"
)

# Origem liberada no CORS: o endereço de onde o frontend chama a API.
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
