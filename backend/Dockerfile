FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install basic build tools if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1. Install PyTorch CPU-only version first (~180MB instead of 540MB CUDA version)
# 2. Increase pip timeout and retries for slow or fluctuating internet
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 \
    torch --index-url https://download.pytorch.org/whl/cpu

# 3. Install remaining dependencies
RUN pip install --no-cache-dir --default-timeout=1000 --retries 10 -r requirements.txt

# Pre-download the sentence-transformers model inside the image so it doesn't download on container start
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY app ./app
COPY create_admin.py ./create_admin.py

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
