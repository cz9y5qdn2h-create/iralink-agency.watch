"""Minimal FastAPI app entrypoint used for package validation."""

from fastapi import FastAPI

app = FastAPI(title="Iralink Agency Watch")


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


def main() -> None:
    """Run local API server."""
    import uvicorn

    uvicorn.run("iralink_agency_watch.app:app", host="0.0.0.0", port=8000, reload=False)
