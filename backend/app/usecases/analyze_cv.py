from app.ai.embeddings import embed
from app.cv.extractor import extract_text
from app.repository.cv_repository import save_cv


def analyze_cv(user_id: int, file_bytes: bytes, filename: str) -> dict:
    text = extract_text(file_bytes)
    embedding = embed(text)
    cv_id = save_cv(user_id, filename, text, embedding)
    return {"chars": len(text), "embedding_dim": len(embedding), "id": cv_id}