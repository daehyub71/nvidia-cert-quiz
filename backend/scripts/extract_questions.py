#!/usr/bin/env python3
"""
Extract questions from exam images using GPT-4o Vision.

Usage:
    python scripts/extract_questions.py --input-dir /path/to/images --output data/questions.json
"""
import asyncio
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.openai_service import extract_questions_from_image, translate_question


async def process_image_pair(en_image: Path, ko_image: Path) -> List[Dict[str, Any]]:
    """Process a pair of English and Korean images."""
    print(f"Processing: {en_image.name} + {ko_image.name}")

    # Extract from English image
    en_questions = await extract_questions_from_image(str(en_image))

    # Extract from Korean image
    ko_questions = await extract_questions_from_image(str(ko_image))

    # Merge questions
    merged = []
    for i, en_q in enumerate(en_questions):
        merged_q = {
            "question_text_en": en_q.get("question_text", ""),
            "question_text_ko": ko_questions[i].get("question_text", "") if i < len(ko_questions) else "",
            "options_en": en_q.get("options", []),
            "options_ko": ko_questions[i].get("options", []) if i < len(ko_questions) else [],
            "correct_answer": en_q.get("correct_answer", 0),
            "category": en_q.get("category", "General"),
            "source_day": en_q.get("source_day", 0),
            "source_image": en_q.get("source_image", ""),
        }

        # If Korean version is missing, translate
        if not merged_q["question_text_ko"]:
            ko_text, ko_opts = await translate_question(
                merged_q["question_text_en"],
                merged_q["options_en"],
                "en"
            )
            merged_q["question_text_ko"] = ko_text
            merged_q["options_ko"] = ko_opts

        merged.append(merged_q)

    return merged


async def main():
    parser = argparse.ArgumentParser(description="Extract questions from exam images")
    parser.add_argument("--input-dir", type=str, required=True, help="Directory containing exam images")
    parser.add_argument("--output", type=str, default="data/questions.json", help="Output JSON file")
    parser.add_argument("--single", type=str, help="Process single image (for testing)")

    args = parser.parse_args()

    if args.single:
        # Process single image
        questions = await extract_questions_from_image(args.single)
        print(json.dumps(questions, indent=2, ensure_ascii=False))
        return

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Input directory not found: {input_dir}")
        sys.exit(1)

    # Find all image pairs
    all_questions = []
    en_images = sorted(input_dir.glob("*_e.png")) + sorted(input_dir.glob("*_e.jpg"))

    for en_image in en_images:
        # Find corresponding Korean image
        ko_image = en_image.with_name(en_image.name.replace("_e.", "_h."))

        if ko_image.exists():
            try:
                questions = await process_image_pair(en_image, ko_image)
                all_questions.extend(questions)
                print(f"  Extracted {len(questions)} questions")
            except Exception as e:
                print(f"  Error processing {en_image.name}: {e}")
        else:
            print(f"  Warning: No Korean version found for {en_image.name}")
            try:
                questions = await extract_questions_from_image(str(en_image))
                # Translate to Korean
                for q in questions:
                    ko_text, ko_opts = await translate_question(
                        q.get("question_text", ""),
                        q.get("options", []),
                        "en"
                    )
                    all_questions.append({
                        "question_text_en": q.get("question_text", ""),
                        "question_text_ko": ko_text,
                        "options_en": q.get("options", []),
                        "options_ko": ko_opts,
                        "correct_answer": q.get("correct_answer", 0),
                        "category": q.get("category", "General"),
                        "source_day": q.get("source_day", 0),
                        "source_image": q.get("source_image", ""),
                    })
                print(f"  Extracted {len(questions)} questions (translated)")
            except Exception as e:
                print(f"  Error: {e}")

    # Save to output file
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"questions": all_questions}, f, indent=2, ensure_ascii=False)

    print(f"\nTotal questions extracted: {len(all_questions)}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    asyncio.run(main())
