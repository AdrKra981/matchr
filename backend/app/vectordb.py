from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

qdrant = QdrantClient(host="qdrant", port=6333)
COLLECTION = "jobs"

def ensure_collection():
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(
            COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )