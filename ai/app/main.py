from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth import require_user_id
from app.chat import build_reply
from app.indexer import user_index

app = FastAPI(title="FinanzasApp AI Service")
router = APIRouter(prefix="/ai")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


class MessageRequest(BaseModel):
    message: str | None = None


class MessageResponse(BaseModel):
    reply: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.post("/chatbot/message", response_model=MessageResponse)
def chatbot_message(payload: MessageRequest, user_id: int = Depends(require_user_id)) -> dict:
    message = payload.message

    if message is None:
        raise HTTPException(status_code=400, detail="El mensaje es obligatorio")

    if not message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    question = message.strip()
    documents = user_index.retrieve(user_id, question)

    return {"reply": build_reply(question, documents)}


@router.post("/chatbot/clear")
def chatbot_clear(user_id: int = Depends(require_user_id)) -> dict:
    user_index.clear(user_id)

    return {"status": "ok"}


app.include_router(router)
