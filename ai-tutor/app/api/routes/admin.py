"""
API Routes for Admin Test Case Generation (`/api/admin/generate-tests`).
Triggered by the Go API Gateway when an admin requests AI-generated test cases
for a new or existing competitive programming problem.
"""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.test_generator_service import TestGeneratorService

logger = logging.getLogger("ai-tutor.routes.admin")

router = APIRouter(prefix="/api/admin", tags=["Admin API"])


class GenerateTestsRequest(BaseModel):
    """Payload sent from the Go API Gateway asking for 9 additional ranked test cases."""
    title: str = Field(..., description="Problem title")
    description: str = Field(..., description="Full problem statement and requirements")
    sample_stdin: str = Field("", description="Admin provided sample standard input")
    sample_expected_output: str = Field("", description="Admin provided sample expected standard output")


class TestCaseItem(BaseModel):
    """A single ranked test case for the problem evaluation suite."""
    stdin: str
    expected_output: str
    difficulty_rank: int
    is_sample: bool = False


class GenerateTestsResponse(BaseModel):
    """Response containing exactly 10 ranked test cases (1 sample + 9 generated)."""
    test_cases: List[TestCaseItem]


@router.post(
    "/generate-tests",
    status_code=status.HTTP_200_OK,
    response_model=GenerateTestsResponse,
    summary="Generate 9 ranked test cases via GPT-4o Problem Setter"
)
async def generate_test_cases(req: GenerateTestsRequest):
    """
    Synchronous endpoint invoked by the Go `api-gateway` (`POST /api/v1/admin/problems/generate-tests`).
    Returns exactly 10 test cases ranked by difficulty (Rank 1 sample + Ranks 2–10 AI generated).
    """
    logger.info(f"[AdminRoute] Received test case generation request for: '{req.title}'")

    try:
        cases = await TestGeneratorService.generate_test_cases(
            title=req.title,
            description=req.description,
            sample_stdin=req.sample_stdin,
            sample_expected_output=req.sample_expected_output
        )
        return GenerateTestsResponse(test_cases=cases)
    except Exception as e:
        logger.error(f"[AdminRoute] Error during test case generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate test cases: {str(e)}"
        )
