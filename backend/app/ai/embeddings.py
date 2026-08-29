from functools import lru_cache

from openai import OpenAI

EMBED_MODEL = "text-embedding-3-small"

@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    return OpenAI()

def embed(text: str) -> list[float]:
    response = get_client().embeddings.create(model=EMBED_MODEL, input=text)
    return response.data[0].embedding