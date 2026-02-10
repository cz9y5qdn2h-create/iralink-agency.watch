from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="Watch Opportunities API",
    version="0.1.0",
    description="API pour la veille de montres et les opportunités d'achat.",
)


class Watch(BaseModel):
    id: str
    brand: str
    model: str
    reference: str
    market_price_eur: float


class Opportunity(BaseModel):
    watch_id: str
    score: float
    estimated_margin_eur: float
    reason: str


class AlertIn(BaseModel):
    email: str
    min_score: float = 0.7
    brand: str | None = None


WATCHES = [
    Watch(
        id="w_001",
        brand="Rolex",
        model="Submariner Date",
        reference="126610LN",
        market_price_eur=11950,
    ),
    Watch(
        id="w_002",
        brand="Omega",
        model="Speedmaster Professional",
        reference="310.30.42.50.01.001",
        market_price_eur=6200,
    ),
]

OPPORTUNITIES = [
    Opportunity(
        watch_id="w_001",
        score=0.91,
        estimated_margin_eur=1250,
        reason="Prix vendeur inférieur à la médiane marketplace.",
    )
]


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/watches", response_model=list[Watch])
def list_watches() -> list[Watch]:
    return WATCHES


@app.get("/watches/{watch_id}", response_model=Watch)
def get_watch(watch_id: str) -> Watch:
    for watch in WATCHES:
        if watch.id == watch_id:
            return watch
    raise HTTPException(status_code=404, detail="Watch not found")


@app.get("/opportunities", response_model=list[Opportunity])
def list_opportunities() -> list[Opportunity]:
    return OPPORTUNITIES


@app.post("/alerts", status_code=201)
def create_alert(alert: AlertIn) -> dict[str, str | float | None]:
    return {
        "status": "created",
        "email": alert.email,
        "min_score": alert.min_score,
        "brand": alert.brand,
    }
