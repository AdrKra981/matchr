from openai import OpenAI

client = OpenAI()
EMBED_MODEL = "text-embedding-3-small"

def embed(text: str) -> list[float]:
    response = client.embeddings.create(model=EMBED_MODEL, input=text)
    return response.data[0].embedding