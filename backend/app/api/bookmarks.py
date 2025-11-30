"""Bookmarks API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from app.schemas.question import Bookmark, BookmarkCreate
from app.core.database import get_supabase_client

router = APIRouter()


def device_id_to_uuid(device_id: str) -> str:
    """Convert device ID string to deterministic UUID."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, device_id))


@router.get("/", response_model=List[Bookmark])
async def get_bookmarks(user_id: str):
    """Get all bookmarks for a user."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    response = supabase.table("nq_bookmarks").select("*").eq("user_id", user_uuid).order("created_at", desc=True).execute()

    return response.data


@router.post("/", response_model=Bookmark)
async def create_bookmark(bookmark: BookmarkCreate, user_id: str):
    """Create a new bookmark."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    # Ensure user exists in nq_users table (auto-create if not)
    existing_user = supabase.table("nq_users").select("id").eq("id", user_uuid).execute()
    if not existing_user.data:
        supabase.table("nq_users").insert({
            "id": user_uuid,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

    # Check if bookmark already exists
    existing = supabase.table("nq_bookmarks").select("*").eq("user_id", user_uuid).eq("question_id", bookmark.question_id).execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Bookmark already exists")

    bookmark_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_uuid,
        "question_id": bookmark.question_id,
        "note": bookmark.note,
        "created_at": datetime.utcnow().isoformat(),
    }

    response = supabase.table("nq_bookmarks").insert(bookmark_data).execute()

    return response.data[0]


@router.delete("/{question_id}")
async def delete_bookmark(question_id: str, user_id: str):
    """Delete a bookmark."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    response = supabase.table("nq_bookmarks").delete().eq("user_id", user_uuid).eq("question_id", question_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    return {"message": "Bookmark deleted successfully"}


@router.get("/questions")
async def get_bookmarked_questions(user_id: str):
    """Get all bookmarked questions with full details."""
    supabase = get_supabase_client()
    user_uuid = device_id_to_uuid(user_id)

    # Get bookmarks
    bookmarks_response = supabase.table("nq_bookmarks").select("question_id, note, created_at").eq("user_id", user_uuid).execute()

    if not bookmarks_response.data:
        return []

    # Get question details
    question_ids = [b["question_id"] for b in bookmarks_response.data]
    questions_response = supabase.table("nq_questions").select("*").in_("id", question_ids).execute()

    questions_map = {q["id"]: q for q in questions_response.data}

    result = []
    for bookmark in bookmarks_response.data:
        question = questions_map.get(bookmark["question_id"])
        if question:
            result.append({
                **question,
                "bookmark_note": bookmark["note"],
                "bookmarked_at": bookmark["created_at"],
            })

    return result
