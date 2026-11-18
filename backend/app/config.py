from pathlib import Path
import os

from dotenv import load_dotenv

# Look for .env in project root, or in current working dir
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"
LOCAL_ENV = Path(".env")

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
elif LOCAL_ENV.exists():
    load_dotenv(dotenv_path=LOCAL_ENV)
else:
    load_dotenv()


class Settings:
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_index: str = os.getenv("PINECONE_INDEX", "scholarlens")
    pinecone_namespace: str = os.getenv("PINECONE_NAMESPACE", "scholarship-docs")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "900"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    top_k: int = int(os.getenv("TOP_K", "5"))
    min_score: float = float(os.getenv("MIN_SCORE", "0.25"))
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "20"))
    cors_origins: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
    data_dir: str = os.getenv("DATA_DIR", "data")
    # Auth
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-production-use-a-long-random-string").strip()
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "").strip().strip('"').strip("'")


settings = Settings()
