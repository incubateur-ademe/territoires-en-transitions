from functools import wraps
from time import time
from typing import Callable


def timeit(func_name: str = "function", print_if_longer_than: float = 0.0):
    def _timeit_decorator(func: Callable):
        @wraps(func)
        def _timeit_wrapper(*args, **kwargs):
            start = time()
            try:
                return func(*args, **kwargs)
            finally:
                duration_ms = (time() - start) * 1000
                if duration_ms > print_if_longer_than:
                    print(f"[{func_name}] Execution took {duration_ms} ms")

        return _timeit_wrapper

    return _timeit_decorator
