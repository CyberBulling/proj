"""HTTP API для привязки к сайту: один POST-эндпоинт чата поверх RAG."""

import os
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag_system import RAGSystem, config

app = FastAPI(title="Помощник по благоустройству", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rag: Optional[RAGSystem] = None


def get_rag() -> RAGSystem:
    """Ленивая инициализация одного экземпляра RAG (долгая загрузка индекса)."""
    global _rag
    if _rag is None:
        key = os.getenv("GIGACHAT_AUTHORIZATION_KEY")
        _rag = RAGSystem(config, key)
    return _rag


class ChatRequest(BaseModel):
    """Тело запроса: вопрос пользователя и число фрагментов для контекста."""

    question: str = Field(..., min_length=1)
    top_n: int = Field(5, ge=1, le=30)


class ChatResponse(BaseModel):
    """Ответ модели по материалам."""

    answer: str


@app.get("/health")
def health() -> dict:
    """Проверка живости сервиса (для балансировщика / мониторинга)."""
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """Возвращает ответ помощника по загруженным документам."""
    return ChatResponse(answer=get_rag().answer_query(req.question, top_n=req.top_n))
