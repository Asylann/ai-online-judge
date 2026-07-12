"""
Submission Repository for the AI Tutor (Virtual TA) microservice.
Responsible for fetching student code (`code_base64`), AST structural deviations (`ast_snapshot`),
and problem descriptions (`problem`), as well as persisting Virtual TA hints (`ai_hint_text`)
and updating Educational Data Mining (EDM) metrics like `cognitive_effort_index`.
"""

import json
import logging
from typing import Any, Dict, Optional
from app.db.database import get_pg_pool

logger = logging.getLogger("ai-tutor.repo")


class SubmissionRepository:
    """
    Data access layer for submissions and problems in PostgreSQL.
    Aligns with Watanobe lab research on effort-based metrics and Socratic tutoring logs.
    """

    @classmethod
    def fetch_submission_and_problem(cls, submission_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch submission metadata along with joined problem details.
        Returns code_base64, language, ast_snapshot, problem description, user_id, and more.
        """
        query = """
            SELECT 
                s.id AS submission_id,
                s.user_id,
                s.problem_id,
                s.code_base64,
                s.language,
                s.status,
                s.tests_passed,
                s.tests_total,
                s.failed_test_stdin,
                s.failed_test_expected_output,
                s.ast_complexity_score,
                s.ast_snapshot,
                s.ai_hint_given,
                s.ai_hint_text,
                p.title AS problem_title,
                p.description AS problem_description,
                p.difficulty_score
            FROM submissions s
            JOIN problems p ON s.problem_id = p.id
            WHERE s.id = %s;
        """
        pool = get_pg_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (submission_id,))
                    row = cur.fetchone()
                    if not row:
                        return None
                    
                    # Map tuple/row to dictionary
                    col_names = [desc[0] for desc in cur.description]
                    data = dict(zip(col_names, row))
                    
                    # Ensure ast_snapshot is a dict if stored as string or JSONB
                    if isinstance(data.get("ast_snapshot"), str):
                        try:
                            data["ast_snapshot"] = json.loads(data["ast_snapshot"])
                        except Exception:
                            data["ast_snapshot"] = {}
                    elif data.get("ast_snapshot") is None:
                        data["ast_snapshot"] = {}
                        
                    # Convert UUID objects to string if needed
                    data["submission_id"] = str(data["submission_id"])
                    data["user_id"] = str(data["user_id"])
                    data["problem_id"] = str(data["problem_id"])
                    return data
        except Exception as e:
            logger.error(f"[SubmissionRepository] Error fetching submission {submission_id}: {e}")
            raise

    @classmethod
    def update_hint_and_effort(cls, submission_id: str, hint_text: str, cognitive_effort_index: float) -> bool:
        """
        Persist the generated Socratic hint and update the composite cognitive_effort_index (EDM).
        """
        query = """
            UPDATE submissions
            SET ai_hint_given = TRUE,
                ai_hint_text = %s,
                cognitive_effort_index = %s
            WHERE id = %s;
        """
        pool = get_pg_pool()
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (hint_text, cognitive_effort_index, submission_id))
                    return cur.rowcount > 0
        except Exception as e:
            logger.error(f"[SubmissionRepository] Error updating hint for submission {submission_id}: {e}")
            raise

    @classmethod
    def calculate_cognitive_effort_index(cls, user_id: str, problem_id: str, ast_complexity_score: Optional[float]) -> float:
        """
        Compute the cognitive_effort_index per Watanobe lab Educational Data Mining (EDM) framework.
        Tracks the student's struggle across multiple submission attempts within their Zone of Proximal Development (ZPD).
        
        Formula:
          attempt_count = total attempts by this user for this problem
          cognitive_effort_index = (attempt_count * 1.5) + (ast_complexity_score or 1.0)
        """
        query = """
            SELECT COUNT(*) FROM submissions
            WHERE user_id = %s AND problem_id = %s;
        """
        pool = get_pg_pool()
        attempt_count = 1
        try:
            with pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (user_id, problem_id))
                    row = cur.fetchone()
                    if row and row[0]:
                        attempt_count = int(row[0])
        except Exception as e:
            logger.warning(f"[SubmissionRepository] Failed to count attempts, defaulting to 1: {e}")

        complexity = ast_complexity_score if ast_complexity_score is not None else 1.0
        return round((attempt_count * 1.5) + complexity, 2)
