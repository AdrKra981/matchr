"""
Covers the token check itself.

The endpoint tests override get_current_user, so without this file nothing
exercises the real dependency — which is how an exception handler that caught
the wrong class went unnoticed.
"""
import datetime
from datetime import timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

from app.auth import deps
from app.auth.security import JWT_ALGORITHM, JWT_SECRET, create_access_token
from app.main import app

# Without this, an unhandled exception is re-raised out of the client instead
# of becoming a response — a 500 regression would surface as an error rather
# than as a failed assertion about the status code.
client = TestClient(app, raise_server_exceptions=False)

PROTECTED = "/auth/me"


def sign(payload, secret=JWT_SECRET, algorithm=JWT_ALGORITHM):
    return jwt.encode(payload, secret, algorithm=algorithm)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_protected_endpoint_requires_a_token():
    assert client.get(PROTECTED).status_code in (401, 403)


BAD_TOKENS = [
    ("garbage", "not-a-token"),
    ("empty-ish", "x"),
    ("tampered signature", sign({"sub": "1"})[:-4] + "AAAA"),
    ("signed with another secret", sign({"sub": "1"}, secret="attacker-secret")),
    ("expired", sign({"sub": "1", "exp": datetime.datetime.now(timezone.utc) - timedelta(hours=1)})),
    ("alg=none forgery", sign({"sub": "1"}, secret=None, algorithm="none")),
]


@pytest.mark.parametrize("case, token", BAD_TOKENS, ids=[c for c, _ in BAD_TOKENS])
def test_bad_tokens_are_rejected_with_401(case, token):
    """
    Regression guard for the PyJWKError bug.

    Each of these raises a different PyJWT exception — DecodeError,
    InvalidSignatureError, ExpiredSignatureError, InvalidAlgorithmError. They
    share only the PyJWTError base class, so catching anything narrower turns
    them into unhandled 500s. The expired case is the one real users hit.
    """
    r = client.get(PROTECTED, headers=auth(token))
    assert r.status_code == 401, f"{case} produced {r.status_code}, not 401"


def test_valid_token_resolves_the_user(monkeypatch):
    monkeypatch.setattr(
        deps, "get_user_by_id",
        lambda user_id: {"id": user_id, "email": "tester@example.com"},
    )
    r = client.get(PROTECTED, headers=auth(create_access_token(7)))
    assert r.status_code == 200
    assert r.json() == {"id": 7, "email": "tester@example.com"}


def test_token_for_a_deleted_user_is_rejected(monkeypatch):
    monkeypatch.setattr(deps, "get_user_by_id", lambda user_id: None)
    r = client.get(PROTECTED, headers=auth(create_access_token(999)))
    assert r.status_code == 401
