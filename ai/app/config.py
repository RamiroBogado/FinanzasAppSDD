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

RETRIEVAL_LIMIT = 8
