import os

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = "llama3.1:8b"
EMBEDDING_MODEL = "nomic-embed-text"

JWT_SECRET = os.getenv("JWT_SECRET", "finanzasapp-dev-secret")

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.getenv(
    "DB_PATH",
    os.path.join(_PROJECT_ROOT, "backend", "data", "finanzas.db"),
)

VECTOR_STORE = os.getenv("VECTOR_STORE", "memory")
CHROMA_PATH = os.getenv("CHROMA_PATH", os.path.join(_PROJECT_ROOT, "chroma_data"))

RETRIEVAL_LIMIT = 8
CHAT_HISTORY_LIMIT = int(os.getenv("CHAT_HISTORY_LIMIT", "10"))

KNOWLEDGE_DIR = os.getenv(
    "KNOWLEDGE_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge"),
)
KNOWLEDGE_LIMIT = int(os.getenv("KNOWLEDGE_LIMIT", "4"))
