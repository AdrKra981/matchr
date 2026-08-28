"""
Pins a test-only signing secret before any app module is imported.

app/auth/security.py reads JWT_SECRET into a module constant at import time, so
the suite would otherwise inherit whatever the developer happens to have in
their environment — or fall back to the 20-byte "dev-secret-change-me" default,
which is under the 32 bytes RFC 7518 requires for HS256 and makes PyJWT warn on
every sign and verify.

Setting it here makes the run hermetic and identical on every machine. These
tokens never leave the test process, so the value itself is arbitrary; it only
has to be long enough.
"""
import os

# Assigned, not setdefault: an ambient JWT_SECRET would make the suite's
# behaviour depend on the shell it was started from.
os.environ["JWT_SECRET"] = "test-only-signing-secret-with-at-least-32-bytes"
