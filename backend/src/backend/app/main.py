from fastapi import FastAPI

from backend.app.routers import cuidados, health, pets
from backend.app.routers.erros import registrar_handlers

app = FastAPI(
    title="PetCare API",
    description="Carteira de cuidados do pet: cadastro, histórico e alertas.",
    version="0.1.0",
)

registrar_handlers(app)
app.include_router(health.router)
app.include_router(pets.router)
app.include_router(cuidados.router)
