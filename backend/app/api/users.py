"""Users API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from app.core.database import get_supabase_client

router = APIRouter()


class UserCreate(BaseModel):
    """Schema for creating/registering a user."""
    device_id: str
    display_name: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    display_name: Optional[str] = None
    email: Optional[str] = None


class UserResponse(BaseModel):
    """User response model."""
    id: str
    device_id: str
    display_name: Optional[str]
    email: Optional[str]
    created_at: datetime
    last_active_at: datetime


@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    """
    Register a new user or return existing user by device_id.
    Supports anonymous device-based registration.
    """
    supabase = get_supabase_client()

    # Check if user already exists
    existing = supabase.table("nq_users").select("*").eq("device_id", user.device_id).execute()

    if existing.data:
        # Update last_active_at and return existing user
        supabase.table("nq_users").update({
            "last_active_at": datetime.utcnow().isoformat()
        }).eq("device_id", user.device_id).execute()
        return existing.data[0]

    # Create new user
    user_data = {
        "id": str(uuid.uuid4()),
        "device_id": user.device_id,
        "display_name": user.display_name or f"User_{user.device_id[:8]}",
        "created_at": datetime.utcnow().isoformat(),
        "last_active_at": datetime.utcnow().isoformat(),
    }

    response = supabase.table("nq_users").insert(user_data).execute()

    return response.data[0]


@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    """Get user profile by ID."""
    supabase = get_supabase_client()

    response = supabase.table("nq_users").select("*").eq("id", user_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")

    return response.data


@router.get("/by-device/{device_id}", response_model=UserResponse)
async def get_user_by_device(device_id: str):
    """Get user by device ID."""
    supabase = get_supabase_client()

    response = supabase.table("nq_users").select("*").eq("device_id", device_id).single().execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Update last_active_at
    supabase.table("nq_users").update({
        "last_active_at": datetime.utcnow().isoformat()
    }).eq("device_id", device_id).execute()

    return response.data


@router.patch("/profile/{user_id}", response_model=UserResponse)
async def update_user_profile(user_id: str, update: UserUpdate):
    """Update user profile."""
    supabase = get_supabase_client()

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    response = supabase.table("nq_users").update(update_data).eq("id", user_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")

    return response.data[0]


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user and all associated data."""
    supabase = get_supabase_client()

    # Delete related data first (cascade should handle this, but being explicit)
    supabase.table("nq_bookmarks").delete().eq("user_id", user_id).execute()
    supabase.table("nq_wrong_answers").delete().eq("user_id", user_id).execute()
    supabase.table("nq_quiz_history").delete().eq("user_id", user_id).execute()

    # Delete user
    response = supabase.table("nq_users").delete().eq("id", user_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}
