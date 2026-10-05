from fastapi import APIRouter

router = APIRouter(tags=["home"])


@router.get("/")
def home():
    return {"message": "Hello, World!"}
