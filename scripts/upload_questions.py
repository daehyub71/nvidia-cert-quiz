#!/usr/bin/env python3
"""
Upload Questions to Supabase

Reads extracted questions from JSON and uploads them to Supabase.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# Configuration
QUESTIONS_FILE = Path(__file__).parent.parent / "data" / "processed" / "questions.json"


def get_supabase_client() -> Client:
    """Get Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for admin operations

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")

    return create_client(url, key)


def main():
    """Upload questions to Supabase."""
    print("=" * 60)
    print("NVIDIA Cert Quiz - Upload Questions to Supabase")
    print("=" * 60)

    # Load questions
    if not QUESTIONS_FILE.exists():
        print(f"ERROR: Questions file not found: {QUESTIONS_FILE}")
        print("Run extract_questions.py first!")
        sys.exit(1)

    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])
    print(f"\nLoaded {len(questions)} questions from {QUESTIONS_FILE}")

    # Connect to Supabase
    client = get_supabase_client()
    print("Connected to Supabase")

    # Clear existing questions (optional - uncomment if needed)
    # print("\nClearing existing questions...")
    # client.table("nq_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    # Upload questions
    print("\nUploading questions...")
    success_count = 0
    error_count = 0

    for i, q in enumerate(questions):
        try:
            # Prepare data for Supabase
            question_data = {
                "question_text_en": q.get("question_text_en", ""),
                "question_text_ko": q.get("question_text_ko", ""),
                "options_en": q.get("options_en", []),
                "options_ko": q.get("options_ko", []),
                "correct_answer": q.get("correct_answer", 0),
                "category": q.get("category", "General"),
                "difficulty": q.get("difficulty", "medium"),
                "source_day": q.get("source_day"),
                "source_image_en": q.get("source_image_en", ""),
                "source_image_ko": q.get("source_image_ko", ""),
            }

            # Insert question
            client.table("nq_questions").insert(question_data).execute()
            success_count += 1

            if (i + 1) % 10 == 0:
                print(f"  Uploaded {i + 1}/{len(questions)} questions...")

        except Exception as e:
            error_count += 1
            print(f"  ERROR uploading question {i + 1}: {e}")

    print("\n" + "=" * 60)
    print("UPLOAD COMPLETE")
    print("=" * 60)
    print(f"Successfully uploaded: {success_count}")
    print(f"Errors: {error_count}")

    # Verify
    count_response = client.table("nq_questions").select("id", count="exact").execute()
    print(f"\nTotal questions in database: {count_response.count}")


if __name__ == "__main__":
    main()
