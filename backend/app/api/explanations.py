"""Explanations API endpoints."""
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.schemas.question import ExplanationRequest, Explanation, Language
from app.core.database import get_supabase_client
from app.services.openai_service import generate_explanation

router = APIRouter()


@router.get("/{question_id}")
async def get_explanation(question_id: str, language: Language = Language.KOREAN):
    """
    Get AI-generated explanation for a question.
    Returns cached explanation if available, otherwise generates new one.
    """
    supabase = get_supabase_client()

    # Check cache first
    cached = supabase.table("nq_explanations").select("*").eq("question_id", question_id).execute()

    if cached.data:
        explanation = cached.data[0]
        return {
            "question_id": question_id,
            "explanation": explanation[f"explanation_{language.value}"],
            "explanation_en": explanation["explanation_en"],
            "explanation_ko": explanation["explanation_ko"],
            "created_at": explanation["created_at"],
            "cached": True,
        }

    # Get question
    question_response = supabase.table("nq_questions").select("*").eq("id", question_id).single().execute()

    if not question_response.data:
        raise HTTPException(status_code=404, detail="Question not found")

    question = question_response.data

    # Generate explanation using OpenAI
    explanation_en, explanation_ko = await generate_explanation(question)

    # Cache the explanation
    explanation_data = {
        "question_id": question_id,
        "explanation_en": explanation_en,
        "explanation_ko": explanation_ko,
        "created_at": datetime.utcnow().isoformat(),
    }

    supabase.table("nq_explanations").insert(explanation_data).execute()

    return {
        "question_id": question_id,
        "explanation": explanation_data[f"explanation_{language.value}"],
        "explanation_en": explanation_en,
        "explanation_ko": explanation_ko,
        "created_at": explanation_data["created_at"],
        "cached": False,
    }


@router.post("/generate")
async def generate_new_explanation(request: ExplanationRequest, force: bool = False):
    """
    Generate a new explanation for a question.
    If force=True, regenerates even if cached version exists.
    """
    supabase = get_supabase_client()

    # Check if already exists
    if not force:
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

    # Generate explanation
    explanation_en, explanation_ko = await generate_explanation(question)

    # Upsert the explanation
    explanation_data = {
        "question_id": request.question_id,
        "explanation_en": explanation_en,
        "explanation_ko": explanation_ko,
        "created_at": datetime.utcnow().isoformat(),
    }

    # Delete existing if force
    if force:
        supabase.table("nq_explanations").delete().eq("question_id", request.question_id).execute()

    supabase.table("nq_explanations").insert(explanation_data).execute()

    return Explanation(**explanation_data)


@router.delete("/{question_id}")
async def delete_explanation(question_id: str):
    """Delete cached explanation for a question."""
    supabase = get_supabase_client()

    response = supabase.table("nq_explanations").delete().eq("question_id", question_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Explanation not found")

    return {"message": "Explanation deleted", "question_id": question_id}
