import logging
import os

from rq import Queue, Worker

from app.ai.rerank import get_encoder
from app.ai.sparse import get_model
from app.observability.logging_config import setup_logging
from app.tasks.queue import redis_conn

logger = logging.getLogger(__name__)


def main():
    setup_logging(os.getenv("LOG_LEVEL", "INFO"))

    # Rozgrzewka modeli przy starcie workera — ładujemy raz do RAM,
    # żeby pierwszy job (rerank) nie płacił cold startu.
    logger.info("warming up models")
    get_encoder()   # cross-encoder (jina multilingual)
    get_model()     # BM25 (fastembed)
    logger.info("models ready, starting worker")

    Worker([Queue("matchr", connection=redis_conn)], connection=redis_conn).work()


if __name__ == "__main__":
    main()
