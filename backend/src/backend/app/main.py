from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.routers import cuidados, health, pets
from backend.app.routers.erros import registrar_handlers

app = FastAPI(
    title="PetCare API",
    description="Carteira de cuidados do pet: cadastro, histórico e alertas.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

registrar_handlers(app)
app.include_router(health.router)
app.include_router(pets.router)
app.include_router(cuidados.router)
