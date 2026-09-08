def recall_at_k(retrieved: list[int], relevant: list[int], k: int) -> float:
    """Calculate recall at k."""
    if not relevant:
        return 0.0
    intersection = set(retrieved[:k]) & set(relevant)
    return len(intersection) / len(relevant)


def precision_at_k(retrieved: list[int], relevant: list[int], k: int) -> float:
    """Calculate precision at k."""
    if k == 0:
        return 0.0
    intersection = set(retrieved[:k]) & set(relevant)
    return len(intersection) / k


def reciprocal_rank(retrieved: list[int], relevant: list[int]) -> float:
    """Calculate reciprocal rank."""
    for i, job in enumerate(retrieved):
        if job in relevant:
            return 1 / (i + 1)
    return 0.0