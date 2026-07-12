"""
Tutor Service module — Core logic for the Virtual Teaching Assistant (Virtual TA).
Implements Socratic pedagogy via OpenAI GPT-4o, guiding students with minimal edits
instead of providing direct solutions.

In alignment with Prof. Yutaka Watanobe's lab methodology:
- Uses Abstract Syntax Tree (AST) structural analysis (`ast_snapshot`) as context.
- Practices Socratic pedagogy (`guiding questions`, `minimal edits`).
- Records Educational Data Mining (EDM) metrics (`cognitive_effort_index`).
- Dispatches real-time hint notifications via Redis Pub/Sub (`submissions.events.<user_id>`).
"""

import base64
import json
import logging
from typing import Any, Dict
from openai import AsyncOpenAI
from app.core.config import settings
from app.db.database import get_redis
from app.repositories.submission_repo import SubmissionRepository

logger = logging.getLogger("ai-tutor.service")

# Initialize official OpenAI client
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

VIRTUAL_TA_SYSTEM_PROMPT = """You are a Virtual Teaching Assistant for a competitive programming platform. You practice Socratic pedagogy. You MUST NEVER give the full solution. Use the provided AST and code to point out logical flaws and provide a 'minimal edit' hint.

Pedagogical Rules:
1. NEVER output corrected code snippets that solve the bug directly.
2. Identify the exact line or logical block where the structural deviation occurs.
3. Ask a guiding Socratic question that helps the student bridge their Zone of Proximal Development (ZPD).
4. Focus on 'minimal edits' — guide the student on what conceptual shift is needed without writing code for them.
5. Keep your response concise, polite, and educational (under 150 words).

Respond ONLY with a valid JSON object matching this structure:
{
  "hint_text": "Socratic question/hint guiding towards minimal edit",
  "target_line": <integer line number if applicable, or null>,
  "confidence_score": <float between 0.0 and 1.0>
}"""


class TutorService:
    """
    Virtual TA service class handling AI hint generation and Redis event publishing.
    """

    @classmethod
    async def process_submission_hint(cls, submission_id: str) -> None:
        """
        Main entry point invoked asynchronously when a submission receives a Wrong Answer (WA) verdict.
        Fetches code/AST, queries GPT-4o for a Socratic hint, updates PostgreSQL EDM metrics,
        and publishes the hint to Redis Pub/Sub for WebSocket delivery.
        """
        logger.info(f"[TutorService] Starting Socratic hint pipeline for submission: {submission_id}")

        # 1. Fetch metadata from PostgreSQL
        data = SubmissionRepository.fetch_submission_and_problem(submission_id)
        if not data:
            logger.error(f"[TutorService] Submission {submission_id} not found in database.")
            return

        user_id = data["user_id"]
        problem_id = data["problem_id"]
        language = data["language"]
        code_base64 = data["code_base64"]
        ast_snapshot = data.get("ast_snapshot", {})
        ast_complexity = data.get("ast_complexity_score")
        problem_title = data["problem_title"]
        problem_desc = data["problem_description"]
        tests_passed = data.get("tests_passed", 0)
        tests_total = data.get("tests_total", 0)
        # The specific hidden test case that caused the failure — critical for precise Socratic hints
        failed_test_stdin = data.get("failed_test_stdin") or ""
        failed_test_expected = data.get("failed_test_expected_output") or ""

        if data.get("status") == "Accepted":
            logger.info(f"[TutorService] Submission {submission_id} is Accepted. No Socratic error intervention needed.")
            return

        # 2. Decode Base64 source code (Critical Rule #1)
        try:
            code_bytes = base64.b64decode(code_base64)
            source_code = code_bytes.decode("utf-8", errors="replace")
        except Exception as e:
            logger.error(f"[TutorService] Failed to decode Base64 code for {submission_id}: {e}")
            return

        # 3. Generate Socratic hint via GPT-4o (or fallback/mock during offline/test mode)
        hint_text = await cls._generate_socratic_hint(
            submission_id=submission_id,
            problem_title=problem_title,
            problem_desc=problem_desc,
            language=language,
            source_code=source_code,
            ast_snapshot=ast_snapshot,
            tests_passed=tests_passed,
            tests_total=tests_total,
            failed_test_stdin=failed_test_stdin,
            failed_test_expected=failed_test_expected
        )

        # 4. Compute composite Educational Data Mining (EDM) cognitive_effort_index
        effort_index = SubmissionRepository.calculate_cognitive_effort_index(
            user_id=user_id,
            problem_id=problem_id,
            ast_complexity_score=ast_complexity
        )

        # 5. Save hint and EDM metrics back to PostgreSQL
        try:
            SubmissionRepository.update_hint_and_effort(
                submission_id=submission_id,
                hint_text=hint_text,
                cognitive_effort_index=effort_index
            )
            logger.info(f"[TutorService] Updated submission {submission_id} with Virtual TA hint and effort index: {effort_index}")
        except Exception as e:
            logger.error(f"[TutorService] Database persistence failed for {submission_id}: {e}")
            return

        # 6. Publish real-time event via Redis Pub/Sub to `submissions.events.<user_id>`
        cls._publish_redis_event(
            user_id=user_id,
            submission_id=submission_id,
            hint_text=hint_text,
            effort_index=effort_index
        )

    @classmethod
    async def _generate_socratic_hint(
        cls,
        submission_id: str,
        problem_title: str,
        problem_desc: str,
        language: str,
        source_code: str,
        ast_snapshot: Dict[str, Any],
        tests_passed: int = 0,
        tests_total: int = 0,
        failed_test_stdin: str = "",
        failed_test_expected: str = ""
    ) -> str:
        """
        Query OpenAI GPT-4o with strict Virtual TA directives.
        If API key is placeholder or request fails, return a safe pedagogical fallback.
        """
        # If running in offline test / scaffold mode without real key
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith("sk-placeholder"):
            logger.info(f"[TutorService] Offline mode: generating deterministic Socratic hint for {submission_id}")
            return (
                f"Virtual TA (Socratic Hint): Consider how your loop bounds and data structures in {language} "
                f"handle edge cases for '{problem_title}'. Notice any structural deviation in condition termination?"
            )

        # Build the failure context block for the Virtual TA prompt
        failure_context = ""
        score_line = f"Score: {tests_passed}/{tests_total} test cases passed."
        if failed_test_stdin:
            failure_context = f"""

Test Score: {score_line}
The student's code FAILED on this specific hidden test input:
--- Failed Test Input ---
{failed_test_stdin}
--- Expected Output ---
{failed_test_expected}
--- End of Test Context ---
Use this specific failing input to guide your Socratic hint. Point to what edge case the student's code is missing."""
        else:
            failure_context = f"\n{score_line}"

        user_prompt = f"""Problem Title: {problem_title}
Problem Description: {problem_desc}

Student's {language} Source Code:
```
{source_code}
```

gotreesitter AST Snapshot / Structural Deviations:
{json.dumps(ast_snapshot, indent=2)}{failure_context}

Please provide a Socratic pedagogical hint directing the student towards a minimal edit."""

        try:
            response = await openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": VIRTUAL_TA_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=300,
                temperature=0.3
            )
            raw_content = response.choices[0].message.content
            if not raw_content:
                raise ValueError("Empty response from OpenAI.")
            parsed = json.loads(raw_content)
            return parsed.get("hint_text", "Review your logical conditions and loop invariants carefully.")
        except Exception as e:
            logger.error(f"[TutorService] OpenAI API call failed for {submission_id}: {e}")
            return "Virtual TA: Check the boundary conditions of your algorithm and trace variable state on the first test case."

    @classmethod
    def _publish_redis_event(cls, user_id: str, submission_id: str, hint_text: str, effort_index: float) -> None:
        """
        Publish the Socratic hint payload to Redis Pub/Sub channel `submissions.events.<user_id>`.
        The websocket-service subscribes to this channel to push hints instantly to the user's browser.
        """
        channel = f"submissions.events.{user_id}"
        payload = {
            "type": "ai_hint",
            "submission_id": submission_id,
            "user_id": user_id,
            "ai_hint_given": True,
            "ai_hint_text": hint_text,
            "cognitive_effort_index": effort_index
        }
        try:
            redis_client = get_redis()
            redis_client.publish(channel, json.dumps(payload))
            logger.info(f"[TutorService] Published Virtual TA hint event to Redis channel: {channel}")
        except Exception as e:
            logger.error(f"[TutorService] Failed to publish Redis event on {channel}: {e}")
