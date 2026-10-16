"""Flexx Commerce API - FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, cart, catalog, content, orders
from app.seed import seed


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Create the schema and load the catalogue on first boot so the project
    # runs end-to-end with a single command.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Backend for the Flexx storefront: catalogue, reviews, cart, coupons, "
        "checkout and order tracking."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Cart-Token"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return a single readable message instead of Pydantic's nested array."""
    first = exc.errors()[0] if exc.errors() else {}
    location = ".".join(str(part) for part in first.get("loc", [])[1:]) or "request"
    message = first.get("msg", "Invalid request")
    return JSONResponse(status_code=422, content={"detail": f"{location}: {message}"})


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


for router in (catalog.router, cart.router, orders.router, auth.router, content.router):
    app.include_router(router, prefix=settings.api_prefix)
