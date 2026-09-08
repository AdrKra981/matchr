import pytest

from app.eval.metrics import precision_at_k, recall_at_k, reciprocal_rank


@pytest.mark.parametrize("retrieved, relevant, k, expected", [
    ([1, 2, 3], [1, 2, 3], 3, 1.0),        
    ([9, 8, 7], [1, 2, 3], 3, 0.0),        
    ([1, 2, 9], [1, 2, 3], 3, 2/3),        
    ([1], [], 3, 0.0),                     
])
def test_recall_at_k(retrieved, relevant, k, expected):
    assert recall_at_k(retrieved, relevant, k) == pytest.approx(expected)


@pytest.mark.parametrize("retrieved, relevant, k, expected", [
    ([1, 2, 3], [1, 2, 3], 3, 1.0),        
    ([1, 9, 9], [1, 2, 3], 3, 1/3),        
    ([1, 2], [1, 2], 0, 0.0),              
])
def test_precision_at_k(retrieved, relevant, k, expected):
    assert precision_at_k(retrieved, relevant, k) == pytest.approx(expected)


@pytest.mark.parametrize("retrieved, relevant, expected", [
    ([1, 2, 3], [1], 1.0),                 
    ([9, 2, 3], [2], 0.5),                 
    ([9, 8, 7], [1], 0.0),                 
])
def test_reciprocal_rank(retrieved, relevant, expected):
    assert reciprocal_rank(retrieved, relevant) == pytest.approx(expected)