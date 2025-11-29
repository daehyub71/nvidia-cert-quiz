"""Statistics API endpoints."""
from fastapi import APIRouter
from typing import List

from app.schemas.question import UserStats
from app.core.database import get_supabase_client

router = APIRouter()


@router.get("/user/{user_id}", response_model=UserStats)
async def get_user_stats(user_id: str):
    """Get comprehensive statistics for a user."""
    supabase = get_supabase_client()

    # Get quiz history
    history_response = supabase.table("nq_quiz_history").select("*").eq("user_id", user_id).eq("status", "completed").execute()

    quizzes = history_response.data

    if not quizzes:
        return UserStats(
            total_quizzes=0,
            total_questions_answered=0,
            correct_answers=0,
            accuracy_percentage=0.0,
            category_stats={},
            difficulty_stats={},
            recent_scores=[],
        )

    # Calculate basic stats
    total_quizzes = len(quizzes)
    total_questions = sum(len(q.get("question_ids", [])) for q in quizzes)
    total_correct = sum(q.get("score", 0) for q in quizzes)

    # Get category and difficulty breakdown
    all_question_ids = []
    for quiz in quizzes:
        all_question_ids.extend(quiz.get("question_ids", []))

    questions_response = supabase.table("nq_questions").select("id, category, difficulty").in_("id", list(set(all_question_ids))).execute()

    category_stats = {}
    difficulty_stats = {}

    for q in questions_response.data:
        category = q["category"]
        difficulty = q["difficulty"]

        if category not in category_stats:
            category_stats[category] = {"total": 0, "correct": 0}
        category_stats[category]["total"] += 1

        if difficulty not in difficulty_stats:
            difficulty_stats[difficulty] = {"total": 0, "correct": 0}
        difficulty_stats[difficulty]["total"] += 1

    # Get recent scores (last 10)
    recent_quizzes = sorted(quizzes, key=lambda x: x.get("completed_at", ""), reverse=True)[:10]
    recent_scores = [q.get("score", 0) for q in recent_quizzes]

    return UserStats(
        total_quizzes=total_quizzes,
        total_questions_answered=total_questions,
        correct_answers=total_correct,
        accuracy_percentage=round(total_correct / total_questions * 100, 1) if total_questions > 0 else 0.0,
        category_stats=category_stats,
        difficulty_stats=difficulty_stats,
        recent_scores=recent_scores,
    )


@router.get("/wrong-answers/{user_id}")
async def get_wrong_answers(user_id: str, limit: int = 50):
    """Get user's wrong answers with question details."""
    supabase = get_supabase_client()

    # Get wrong answers
    wrong_response = supabase.table("nq_wrong_answers").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()

    if not wrong_response.data:
        return []

    # Get question details
    question_ids = [w["question_id"] for w in wrong_response.data]
    questions_response = supabase.table("nq_questions").select("*").in_("id", question_ids).execute()

    questions_map = {q["id"]: q for q in questions_response.data}

    result = []
    for wrong in wrong_response.data:
        question = questions_map.get(wrong["question_id"])
        if question:
            result.append({
                **question,
                "selected_answer": wrong["selected_answer"],
                "attempted_at": wrong["created_at"],
            })

    return result


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get top users by accuracy."""
    supabase = get_supabase_client()

    # Get all completed quizzes grouped by user
    response = supabase.table("nq_quiz_history").select("user_id, score, question_ids").eq("status", "completed").execute()

    user_stats = {}
    for quiz in response.data:
        user_id = quiz["user_id"]
        if user_id == "anonymous":
            continue

        if user_id not in user_stats:
            user_stats[user_id] = {"total": 0, "correct": 0}

        user_stats[user_id]["total"] += len(quiz.get("question_ids", []))
        user_stats[user_id]["correct"] += quiz.get("score", 0)

    # Calculate accuracy and sort
    leaderboard = []
    for user_id, stats in user_stats.items():
        if stats["total"] > 0:
            leaderboard.append({
                "user_id": user_id,
                "total_questions": stats["total"],
                "correct_answers": stats["correct"],
                "accuracy": round(stats["correct"] / stats["total"] * 100, 1),
            })

    leaderboard.sort(key=lambda x: (-x["accuracy"], -x["total_questions"]))

    return leaderboard[:limit]


@router.get("/daily-progress/{user_id}")
async def get_daily_progress(user_id: str, days: int = 7):
    """Get user's daily quiz progress."""
    supabase = get_supabase_client()
    from datetime import datetime, timedelta

    start_date = datetime.utcnow() - timedelta(days=days)

    response = supabase.table("nq_quiz_history").select("*").eq("user_id", user_id).eq("status", "completed").gte("completed_at", start_date.isoformat()).execute()

    # Group by date
    daily_stats = {}
    for quiz in response.data:
        date = quiz["completed_at"][:10]  # YYYY-MM-DD
        if date not in daily_stats:
            daily_stats[date] = {"quizzes": 0, "questions": 0, "correct": 0}

        daily_stats[date]["quizzes"] += 1
        daily_stats[date]["questions"] += len(quiz.get("question_ids", []))
        daily_stats[date]["correct"] += quiz.get("score", 0)

    return daily_stats
