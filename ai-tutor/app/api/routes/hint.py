"""
API Routes for the AI Tutor (Virtual TA) microservice.
Provides the `/api/hint` asynchronous endpoint triggered by the AST Service
when a submission receives a 'Wrong Answer' (WA) verdict from the Judge Worker.
"""

import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field
from app.services.tutor_service import TutorService

logger = logging.getLogger("ai-tutor.routes")

router = APIRouter(prefix="/api", tags=["Virtual TA"])


class HintRequest(BaseModel):
    """Payload sent by the AST Service asking for a Socratic intervention."""
    submission_id: str = Field(..., description="UUID string of the submission requiring Virtual TA assistance")


class HintAcceptedResponse(BaseModel):
    """Immediate acknowledgment response confirming asynchronous background processing."""
    message: str
    submission_id: str


@router.post(
    "/hint",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=HintAcceptedResponse,
    summary="Trigger asynchronous Virtual TA Socratic hint generation"
)
async def request_socratic_hint(req: HintRequest, background_tasks: BackgroundTasks):
    """
    Asynchronous endpoint invoked by `ast-service` upon structural deviation detection / Wrong Answer verdict.

    Flow:
    1. Accepts `submission_id` from the request body.
    2. Enqueues background task to execute `TutorService.process_submission_hint` (Socratic pedagogy pipeline).
    3. Returns `202 Accepted` immediately without blocking caller, enabling non-blocking choreography.
    """
    logger.info(f"[HintRoute] Enqueuing Virtual TA Socratic intervention for submission: {req.submission_id}")

    try:
        background_tasks.add_task(TutorService.process_submission_hint, req.submission_id)
        return HintAcceptedResponse(
            message="Virtual TA Socratic hint generation queued successfully.",
            submission_id=req.submission_id
        )
    except Exception as e:
        logger.error(f"[HintRoute] Failed to enqueue hint generation task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue Virtual TA background task."
        )
