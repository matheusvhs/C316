from fastapi import FastAPI

from backend.app.routers import home, tarefas

app = FastAPI(title="C316 API")

app.include_router(home.router)
app.include_router(tarefas.router)
