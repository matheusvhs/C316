from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import FRONTEND_ORIGIN
from backend.app.routers import home, tarefas

app = FastAPI(title="C316 API")

# O frontend roda em outra origem (Vite em :5173); sem CORS o navegador
# bloqueia as respostas da API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(home.router)
app.include_router(tarefas.router)
