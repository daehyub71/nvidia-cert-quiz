"""Questions API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.schemas.question import Question, QuestionCreate, Language, Difficulty
from app.core.database import get_supabase_client

router = APIRouter()


@router.get("/", response_model=List[Question])
async def get_questions(
    category: Optional[str] = None,
    difficulty: Optional[Difficulty] = None,
    limit: int = Query(default=50, le=100),
    offset: int = 0,
):
    """Get questions with optional filters."""
    supabase = get_supabase_client()

    query = supabase.table("nq_questions").select("*")

    if category:
        query = query.eq("category", category)
    if difficulty:
        query = query.eq("difficulty", difficulty.value)

    query = query.range(offset, offset + limit - 1)

    response = query.execute()
    return response.data


@router.get("/categories")
async def get_categories():
    """Get all question categories."""
    supabase = get_supabase_client()

    response = supabase.table("nq_questions").select("category").execute()
    categories = list(set(q["category"] for q in response.data))
    return {"categories": sorted(categories)}


@router.get("/random", response_model=List[Question])
async def get_random_questions(
    count: int = Query(default=10, ge=5, le=20),
    category: Optional[str] = None,
    difficulty: Optional[Difficulty] = None,
    exclude_ids: Optional[str] = None,
):
    """Get random questions for a quiz."""
    supabase = get_supabase_client()

    # Build query - Supabase doesn't have native random, so we'll fetch more and shuffle
    query = supabase.table("nq_questions").select("*")

    if category:
        query = query.eq("category", category)
    if difficulty:
        query = query.eq("difficulty", difficulty.value)
    if exclude_ids:
        ids = exclude_ids.split(",")
        query = query.not_.in_("id", ids)

    response = query.execute()

    import random
    questions = response.data
    random.shuffle(questions)

    return questions[:count]


@router.get("/{question_id}", response_model=Question)
async def get_question(question_id: str):
    """Get a specific question by ID."""
    supabase = get_supabase_client()

    response = supabase.table("nq_questions").select("*").eq("id", question_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Question not found")

    return response.data


@router.post("/", response_model=Question)
async def create_question(question: QuestionCreate):
    """Create a new question (admin only)."""
    supabase = get_supabase_client()

    response = supabase.table("nq_questions").insert(question.model_dump()).execute()

    return response.data[0]


@router.get("/{question_id}/stats")
async def get_question_stats(question_id: str):
    """Get statistics for a specific question."""
    supabase = get_supabase_client()

    response = supabase.table("nq_question_stats").select("*").eq("question_id", question_id).single().execute()

    if not response.data:
        return {
            "question_id": question_id,
            "total_attempts": 0,
            "correct_count": 0,
            "accuracy_rate": 0.0,
        }

    return response.data
