"""Quiz API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from app.schemas.question import (
    QuizConfig,
    QuizSubmission,
    QuizResult,
    QuestionResult,
    QuestionResponse,
    ExplanationRequest,
    Explanation,
    Language,
)
from app.core.database import get_supabase_client
from app.services.openai_service import generate_explanation

router = APIRouter()


@router.post("/start", response_model=dict)
async def start_quiz(config: QuizConfig, user_id: str = "anonymous"):
    """Start a new quiz session."""
    supabase = get_supabase_client()

    # Build query for random questions
    query = supabase.table("nq_questions").select("*")

    if config.categories:
        query = query.in_("category", config.categories)
    if config.difficulty:
        query = query.eq("difficulty", config.difficulty.value)

    # If wrong_answers_only, get user's wrong answers
    if config.wrong_answers_only and user_id != "anonymous":
        wrong_response = supabase.table("nq_wrong_answers").select("question_id").eq("user_id", user_id).execute()
        wrong_ids = [w["question_id"] for w in wrong_response.data]
        if wrong_ids:
            query = query.in_("id", wrong_ids)

    # Exclude bookmarked if requested
    if config.exclude_bookmarked and user_id != "anonymous":
        bookmarked_response = supabase.table("nq_bookmarks").select("question_id").eq("user_id", user_id).execute()
        bookmarked_ids = [b["question_id"] for b in bookmarked_response.data]
        if bookmarked_ids:
            query = query.not_.in_("id", bookmarked_ids)

    response = query.execute()

    import random
    questions = response.data
    random.shuffle(questions)
    questions = questions[:config.question_count]

    if len(questions) < config.question_count:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough questions available. Found {len(questions)}, requested {config.question_count}",
        )

    # Create quiz session
    quiz_id = str(uuid.uuid4())
    quiz_session = {
        "id": quiz_id,
        "user_id": user_id,
        "question_ids": [q["id"] for q in questions],
        "config": config.model_dump(),
        "started_at": datetime.utcnow().isoformat(),
        "status": "in_progress",
    }

    supabase.table("nq_quiz_history").insert(quiz_session).execute()

    # Format questions for response (hide answers)
    lang = config.language.value
    formatted_questions = []
    for q in questions:
        formatted_questions.append(QuestionResponse(
            id=q["id"],
            question_text=q[f"question_text_{lang}"],
            options=q[f"options_{lang}"],
            category=q["category"],
            difficulty=q["difficulty"],
        ))

    return {
        "quiz_id": quiz_id,
        "questions": [q.model_dump() for q in formatted_questions],
        "total_questions": len(formatted_questions),
    }


@router.post("/submit", response_model=QuizResult)
async def submit_quiz(submission: QuizSubmission, user_id: str = "anonymous"):
    """Submit quiz answers and get results."""
    supabase = get_supabase_client()

    # Get quiz session
    quiz_response = supabase.table("nq_quiz_history").select("*").eq("id", submission.quiz_id).single().execute()

    if not quiz_response.data:
        raise HTTPException(status_code=404, detail="Quiz session not found")

    quiz_session = quiz_response.data

    # Get questions
    question_ids = quiz_session["question_ids"]
    questions_response = supabase.table("nq_questions").select("*").in_("id", question_ids).execute()
    questions_map = {q["id"]: q for q in questions_response.data}

    # Calculate results
    results = []
    correct_count = 0
    wrong_answers = []

    lang = quiz_session["config"].get("language", "ko")

    for answer in submission.answers:
        question = questions_map.get(answer.question_id)
        if not question:
            continue

        is_correct = answer.selected_answer == question["correct_answer"]
        if is_correct:
            correct_count += 1
        else:
            wrong_answers.append({
                "user_id": user_id,
                "question_id": answer.question_id,
                "selected_answer": answer.selected_answer,
                "created_at": datetime.utcnow().isoformat(),
            })

        results.append(QuestionResult(
            question_id=question["id"],
            question_text=question[f"question_text_{lang}"],
            options=question[f"options_{lang}"],
            correct_answer=question["correct_answer"],
            selected_answer=answer.selected_answer,
            is_correct=is_correct,
        ))

        # Update question stats
        stats_response = supabase.table("nq_question_stats").select("*").eq("question_id", question["id"]).execute()
        if stats_response.data:
            stats = stats_response.data[0]
            supabase.table("nq_question_stats").update({
                "total_attempts": stats["total_attempts"] + 1,
                "correct_count": stats["correct_count"] + (1 if is_correct else 0),
            }).eq("question_id", question["id"]).execute()
        else:
            supabase.table("nq_question_stats").insert({
                "question_id": question["id"],
                "total_attempts": 1,
                "correct_count": 1 if is_correct else 0,
            }).execute()

    # Save wrong answers
    if wrong_answers and user_id != "anonymous":
        for wa in wrong_answers:
            # Upsert to avoid duplicates
            existing = supabase.table("nq_wrong_answers").select("id").eq("user_id", user_id).eq("question_id", wa["question_id"]).execute()
            if not existing.data:
                supabase.table("nq_wrong_answers").insert(wa).execute()

    # Update quiz session
    supabase.table("nq_quiz_history").update({
        "status": "completed",
        "score": correct_count,
        "total_time_seconds": submission.total_time_seconds,
        "completed_at": datetime.utcnow().isoformat(),
    }).eq("id", submission.quiz_id).execute()

    return QuizResult(
        quiz_id=submission.quiz_id,
        user_id=user_id,
        score=correct_count,
        total_questions=len(results),
        percentage=round(correct_count / len(results) * 100, 1) if results else 0,
        results=results,
        completed_at=datetime.utcnow(),
    )


@router.post("/explanation", response_model=Explanation)
async def get_explanation(request: ExplanationRequest):
    """Get AI-generated explanation for a question."""
    supabase = get_supabase_client()

    # Check cache first
    cached = supabase.table("nq_explanations").select("*").eq("question_id", request.question_id).execute()

    if cached.data:
        return Explanation(
            question_id=request.question_id,
            explanation_en=cached.data[0]["explanation_en"],
            explanation_ko=cached.data[0]["explanation_ko"],
            created_at=cached.data[0]["created_at"],
        )

    # Get question
    question_response = supabase.table("nq_questions").select("*").eq("id", request.question_id).single().execute()

    if not question_response.data:
        raise HTTPException(status_code=404, detail="Question not found")

    question = question_response.data

    # Generate explanation using OpenAI
    explanation_en, explanation_ko = await generate_explanation(question)

    # Cache the explanation
    explanation_data = {
        "question_id": request.question_id,
        "explanation_en": explanation_en,
        "explanation_ko": explanation_ko,
        "created_at": datetime.utcnow().isoformat(),
    }

    supabase.table("nq_explanations").insert(explanation_data).execute()

    return Explanation(**explanation_data)


@router.get("/history")
async def get_quiz_history(user_id: str, limit: int = 10):
    """Get user's quiz history."""
    supabase = get_supabase_client()

    response = supabase.table("nq_quiz_history").select("*").eq("user_id", user_id).eq("status", "completed").order("completed_at", desc=True).limit(limit).execute()

    return response.data
