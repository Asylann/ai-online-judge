"""
AI Tutor (Virtual TA) microservice entrypoint for the AI Online Judge platform.
Implements clean layered Python architecture analogous to our Go microservices:
  core config -> db pools -> repositories -> services -> API routers -> main entrypoint

Aligns with Prof. Yutaka Watanobe's lab methodology:
- Educational Data Mining (EDM) metric logging (`cognitive_effort_index`)
- Socratic pedagogy and 'minimal edits' via OpenAI GPT-4o
- Asynchronous event push via Redis Pub/Sub (`submissions.events.<user_id>`)
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from app.core.config import settings
from app.db.database import init_db, close_db
from app.api.routes import hint

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai-tutor.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager controlling database pools and external connections.
    """
    logger.info("[ai-tutor] Starting Virtual TA microservice. Initializing connection pools...")
    init_db()
    yield
    logger.info("[ai-tutor] Shutting down Virtual TA microservice. Closing connection pools...")
    close_db()


app = FastAPI(
    title="AI Tutor — Virtual TA Microservice",
    description="Socratic pedagogical hint generator using OpenAI GPT-4o and gotreesitter AST context.",
    version="0.2.0",
    lifespan=lifespan
)

# Include routes
app.include_router(hint.router)


@app.get("/health", summary="Service Health Check", tags=["System"])
async def health_check():
    """Returns service health status for Docker Compose and Observer daemons."""
    return {
        "status": "ok",
        "service": "ai-tutor",
        "pedagogical_model": "Socratic Virtual TA (minimal edits)",
        "edm_enabled": True
    }


if __name__ == "__main__":
    logger.info(f"[ai-tutor] Launching Uvicorn server on port {settings.PORT}...")
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, log_level="info")
