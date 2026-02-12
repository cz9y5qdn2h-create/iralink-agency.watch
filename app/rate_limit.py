import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        key = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - settings.rate_limit_window_seconds

        history = self._hits[key]
        while history and history[0] < window_start:
            history.popleft()

        if len(history) >= settings.rate_limit_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
                headers={"Retry-After": str(settings.rate_limit_window_seconds)},
            )

        history.append(now)
        return await call_next(request)
