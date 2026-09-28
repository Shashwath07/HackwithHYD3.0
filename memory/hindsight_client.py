import os
from concurrent.futures import ThreadPoolExecutor


DEFAULT_BASE_URL = "https://api.hindsight.vectorize.io"

_client = None
_executor = ThreadPoolExecutor(max_workers=1)


def get_client():
    """Create the Hindsight Cloud client once."""
    global _client

    if _client is None:
        from hindsight_client import Hindsight

        api_key = os.getenv("HINDSIGHT_API_KEY")

        if not api_key:
            raise RuntimeError(
                "HINDSIGHT_API_KEY is missing. Add it to .env"
            )

        base_url = os.getenv(
            "HINDSIGHT_BASE_URL",
            DEFAULT_BASE_URL
        )

        _client = Hindsight(
            base_url=base_url,
            api_key=api_key
        )

    return _client


def run_hindsight(operation):
    """Run a Hindsight operation in the worker thread."""

    def execute():
        return operation(get_client())

    future = _executor.submit(execute)

    return future.result()