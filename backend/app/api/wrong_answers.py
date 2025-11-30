"""Wrong Answers API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_supabase_client

router = APIRouter()


def device_id_to_uuid(device_id: str) -> str:
    """Convert device ID string to deterministic UUID."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, device_id))


@router.get("/")
async def get_wrong_answers(
    user_id: str,
    reviewed: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
):
    """
    Get user's wrong answers with question details.

    Args:
        user_id: User ID
        reviewed: Filter by review status (True/False/None for all)
        limit: Maximum number of results
        offset: Offset for pagination
    """
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    # Build query
    query = supabase.table("nq_wrong_answers").select("*").eq("user_id", user_uuid)

    if reviewed is not None:
        query = query.eq("reviewed", reviewed)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    wrong_response = query.execute()

    if not wrong_response.data:
        return []

    # Get question details
    question_ids = list(set(w["question_id"] for w in wrong_response.data))
    questions_response = supabase.table("nq_questions").select("*").in_("id", question_ids).execute()

    questions_map = {q["id"]: q for q in questions_response.data}

    result = []
    for wrong in wrong_response.data:
        question = questions_map.get(wrong["question_id"])
        if question:
            result.append({
                "id": wrong["id"],
                "question": question,
                "selected_answer": wrong["selected_answer"],
                "reviewed": wrong.get("reviewed", False),
                "attempted_at": wrong["created_at"],
            })

    return result


@router.get("/count")
async def get_wrong_answers_count(user_id: str, reviewed: Optional[bool] = None):
    """Get count of wrong answers for a user."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    query = supabase.table("nq_wrong_answers").select("id", count="exact").eq("user_id", user_uuid)

    if reviewed is not None:
        query = query.eq("reviewed", reviewed)

    response = query.execute()

    return {
        "total": response.count or 0,
        "reviewed": reviewed,
    }


@router.patch("/{wrong_answer_id}/review")
async def mark_as_reviewed(wrong_answer_id: str, user_id: str):
    """Mark a wrong answer as reviewed."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    response = supabase.table("nq_wrong_answers").update({
        "reviewed": True,
        "reviewed_at": datetime.utcnow().isoformat(),
    }).eq("id", wrong_answer_id).eq("user_id", user_uuid).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Wrong answer not found")

    return {"message": "Marked as reviewed", "id": wrong_answer_id}


@router.patch("/{wrong_answer_id}/unreview")
async def mark_as_unreviewed(wrong_answer_id: str, user_id: str):
    """Mark a wrong answer as not reviewed (for re-study)."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    response = supabase.table("nq_wrong_answers").update({
        "reviewed": False,
        "reviewed_at": None,
    }).eq("id", wrong_answer_id).eq("user_id", user_uuid).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Wrong answer not found")

    return {"message": "Marked as unreviewed", "id": wrong_answer_id}


@router.delete("/{wrong_answer_id}")
async def delete_wrong_answer(wrong_answer_id: str, user_id: str):
    """Delete a specific wrong answer entry."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    response = supabase.table("nq_wrong_answers").delete().eq("id", wrong_answer_id).eq("user_id", user_uuid).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Wrong answer not found")

    return {"message": "Wrong answer deleted"}


@router.delete("/")
async def clear_all_wrong_answers(user_id: str, reviewed_only: bool = False):
    """Clear all wrong answers for a user."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    query = supabase.table("nq_wrong_answers").delete().eq("user_id", user_uuid)

    if reviewed_only:
        query = query.eq("reviewed", True)

    response = query.execute()

    return {
        "message": "Wrong answers cleared",
        "deleted_count": len(response.data) if response.data else 0,
    }
