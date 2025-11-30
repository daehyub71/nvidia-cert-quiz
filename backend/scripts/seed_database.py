#!/usr/bin/env python3
"""
Seed the database with extracted questions.

Usage:
    python scripts/seed_database.py --input data/questions.json
"""
import json
import argparse
from pathlib import Path
import sys
import uuid

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import get_supabase_client


def seed_questions(questions_file: str, clear_existing: bool = False):
    """Seed questions into the database."""
    supabase = get_supabase_client()

    # Load questions from JSON
    with open(questions_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])
    print(f"Loaded {len(questions)} questions from {questions_file}")

    if clear_existing:
        print("Clearing existing questions...")
        supabase.table("nq_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("nq_question_stats").delete().neq("question_id", "00000000-0000-0000-0000-000000000000").execute()

    # Insert questions
    success_count = 0
    error_count = 0

    for i, q in enumerate(questions):
        try:
            # Always generate new UUID (DB uses UUID type)
            question_id = str(uuid.uuid4())

            # Build question data matching the actual DB schema
            question_data = {
                "id": question_id,
                "question_text_en": q.get("question_text_en", ""),
                "question_text_ko": q.get("question_text_ko", ""),
                "options_en": q.get("options_en", []),
                "options_ko": q.get("options_ko", []),
                "correct_answer": q.get("correct_answer", 0),
                "category": q.get("category", "General"),
                "difficulty": q.get("difficulty", "medium"),
            }

            # Only add source_day if the column exists in DB
            # (Comment out if not needed)
            # question_data["source_day"] = q.get("source_day", 0)

            # Validate
            if not question_data["question_text_en"]:
                print(f"  Skipping question {i+1}: No English text")
                error_count += 1
                continue

            if len(question_data["options_en"]) < 2:
                print(f"  Skipping question {i+1}: Not enough options")
                error_count += 1
                continue

            # Insert
            supabase.table("nq_questions").insert(question_data).execute()
            success_count += 1

            if (i + 1) % 10 == 0:
                print(f"  Processed {i + 1}/{len(questions)}...")

        except Exception as e:
            print(f"  Error inserting question {i+1}: {e}")
            error_count += 1

    print(f"\nSeeding complete:")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")


def main():
    parser = argparse.ArgumentParser(description="Seed database with questions")
    parser.add_argument("--input", type=str, default="data/questions.json", help="Input JSON file")
    parser.add_argument("--clear", action="store_true", help="Clear existing questions before seeding")

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    seed_questions(str(input_path), args.clear)


if __name__ == "__main__":
    main()
