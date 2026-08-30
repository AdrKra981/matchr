import logging

from app.observability.request_id import RequestIdFilter
from pythonjsonlogger import jsonlogger


def setup_logging(level: str = "INFO"):
    handler = logging.StreamHandler()
    handler.setFormatter(
        jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    )
    handler.addFilter(RequestIdFilter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)