from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth import require_user_id
from app.chat import build_reply
from app.config import CHAT_HISTORY_LIMIT
from app.indexer import user_index

app = FastAPI(title="FinanzasApp AI Service")
router = APIRouter(prefix="/ai")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


class MessageRequest(BaseModel):
    message: str | None = None
    history: list[dict] | None = None


class MessageResponse(BaseModel):
    reply: str


def _validated_history(history: list[dict] | None) -> list[dict]:
    turns = history or []

    for turn in turns:
        if not isinstance(turn, dict):
            raise HTTPException(status_code=400, detail="El historial contiene un turno inválido")

        role = turn.get("role")
        content = turn.get("content")

        if role not in ("user", "assistant"):
            raise HTTPException(status_code=400, detail="El historial contiene un rol inválido")

        if not isinstance(content, str) or not content.strip():
            raise HTTPException(status_code=400, detail="El historial contiene un turno vacío")

    return turns[-CHAT_HISTORY_LIMIT:]


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
    history = _validated_history(payload.history)
    documents = user_index.retrieve(user_id, question)

    return {"reply": build_reply(question, documents, history)}


@router.post("/chatbot/clear")
def chatbot_clear(user_id: int = Depends(require_user_id)) -> dict:
    user_index.clear(user_id)

    return {"status": "ok"}


app.include_router(router)
