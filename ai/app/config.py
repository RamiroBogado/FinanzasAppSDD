import os
import sys

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = "llama3.1:8b"
EMBEDDING_MODEL = "nomic-embed-text"

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    if os.getenv("PYTEST_CURRENT_TEST") or os.getenv("ENV") == "test" or "pytest" in sys.modules:
        JWT_SECRET = "test-secret"
    else:
        raise RuntimeError("JWT_SECRET environment variable is required")

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.getenv(
    "DB_PATH",
    os.path.join(_PROJECT_ROOT, "backend", "data", "finanzas.db"),
)

VECTOR_STORE = os.getenv("VECTOR_STORE", "memory")
CHROMA_PATH = os.getenv("CHROMA_PATH", os.path.join(_PROJECT_ROOT, "chroma_data"))

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")

if os.getenv("ENV") == "production" and not (TURSO_DATABASE_URL and TURSO_AUTH_TOKEN):
    print(
        "WARNING: TURSO_DATABASE_URL/TURSO_AUTH_TOKEN not set; AI uses local SQLite fallback",
        file=sys.stderr,
    )

RETRIEVAL_LIMIT = 12
CHAT_HISTORY_LIMIT = int(os.getenv("CHAT_HISTORY_LIMIT", "10"))

KNOWLEDGE_DIR = os.getenv(
    "KNOWLEDGE_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge"),
)
KNOWLEDGE_LIMIT = int(os.getenv("KNOWLEDGE_LIMIT", "2"))
