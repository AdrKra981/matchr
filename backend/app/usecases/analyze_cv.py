from app.repository.cv_repository import save_cv
from app.cv.extractor import extract_text
from app.ai.embeddings import embed

def analyze_cv(file_bytes: bytes, filename: str) -> dict:
    text = extract_text(file_bytes)
    embedding = embed(text)
    cv_id = save_cv(filename, text, embedding)
    return {"chars": len(text), "embedding_dim": len(embedding), "id": cv_id}