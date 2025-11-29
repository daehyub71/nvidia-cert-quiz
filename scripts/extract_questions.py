#!/usr/bin/env python3
"""
Question Extraction Script

Extracts questions from exam images using GPT-4o Vision API.
Processes both English and Korean versions and merges them.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
from openai import OpenAI
import base64

# Load environment variables
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# Configuration
SOURCE_DIR = Path("/Users/sunchulkim/src/nvidia_시험준비")
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "questions.json"


def get_openai_client() -> OpenAI:
    """Get OpenAI client."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment")
    return OpenAI(api_key=api_key)


def encode_image(image_path: Path) -> str:
    """Encode image to base64."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extract_questions_from_image(client: OpenAI, image_path: Path, language: str) -> List[Dict]:
    """Extract questions from a single image using GPT-4o Vision."""
    print(f"  Processing: {image_path.name} ({language})")

    base64_image = encode_image(image_path)

    lang_instruction = "The text is in Korean." if language == "ko" else "The text is in English."

    prompt = f"""Analyze this exam question image. {lang_instruction}

Extract ALL questions visible in the image. For each question, provide:
1. The complete question text (preserve exact wording)
2. All answer options (A, B, C, D, etc.)
3. The correct answer index (0 for A, 1 for B, 2 for C, 3 for D)
   - Look for checkmarks, circles, highlights, or other markings indicating the correct answer
4. The topic category (e.g., "Machine Learning Fundamentals", "Deep Learning", "LLMs", "Transformers", "NLP", "Training Techniques", "Model Architecture", etc.)

Return as JSON:
{{
    "questions": [
        {{
            "question_text": "Full question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "category": "Category name"
        }}
    ]
}}

Important:
- Extract ALL questions in the image (usually 4-6 questions per image)
- Preserve exact wording including technical terms
- correct_answer is 0-indexed (A=0, B=1, C=2, D=3)
- If correct answer cannot be determined, set to -1
- Category should be a high-level AI/ML topic"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}",
                                "detail": "high",
                            },
                        },
                    ],
                }
            ],
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)
        questions = result.get("questions", [])

        # Add metadata
        for q in questions:
            q["source_image"] = image_path.name
            q["language"] = language

            # Extract day number from filename
            stem = image_path.stem.lower()
            if "day" in stem:
                try:
                    day_num = int(stem.split("day")[1].split("_")[0])
                    q["source_day"] = day_num
                except (IndexError, ValueError):
                    q["source_day"] = 0

        print(f"    Extracted {len(questions)} questions")
        return questions

    except Exception as e:
        print(f"    ERROR: {e}")
        return []


def merge_language_versions(en_questions: List[Dict], ko_questions: List[Dict]) -> List[Dict]:
    """Merge English and Korean questions into bilingual format."""
    merged = []

    # Simple merge by index (assuming same order)
    max_len = max(len(en_questions), len(ko_questions))

    for i in range(max_len):
        en_q = en_questions[i] if i < len(en_questions) else None
        ko_q = ko_questions[i] if i < len(ko_questions) else None

        if en_q and ko_q:
            # Merge both versions
            merged.append({
                "question_text_en": en_q["question_text"],
                "question_text_ko": ko_q["question_text"],
                "options_en": en_q["options"],
                "options_ko": ko_q["options"],
                "correct_answer": en_q["correct_answer"] if en_q["correct_answer"] != -1 else ko_q["correct_answer"],
                "category": en_q.get("category", ko_q.get("category", "General")),
                "source_day": en_q.get("source_day", ko_q.get("source_day", 0)),
                "source_image_en": en_q["source_image"],
                "source_image_ko": ko_q["source_image"],
                "difficulty": "medium",  # Default, can be updated based on stats later
            })
        elif en_q:
            # English only
            merged.append({
                "question_text_en": en_q["question_text"],
                "question_text_ko": "",  # To be translated later
                "options_en": en_q["options"],
                "options_ko": [],
                "correct_answer": en_q["correct_answer"],
                "category": en_q.get("category", "General"),
                "source_day": en_q.get("source_day", 0),
                "source_image_en": en_q["source_image"],
                "source_image_ko": "",
                "difficulty": "medium",
            })
        elif ko_q:
            # Korean only
            merged.append({
                "question_text_en": "",  # To be translated later
                "question_text_ko": ko_q["question_text"],
                "options_en": [],
                "options_ko": ko_q["options"],
                "correct_answer": ko_q["correct_answer"],
                "category": ko_q.get("category", "General"),
                "source_day": ko_q.get("source_day", 0),
                "source_image_en": "",
                "source_image_ko": ko_q["source_image"],
                "difficulty": "medium",
            })

    return merged


def get_image_pairs() -> Dict[str, Dict[str, Path]]:
    """Get pairs of English and Korean images grouped by day and image number."""
    pairs = {}

    for img_path in SOURCE_DIR.glob("*.png"):
        stem = img_path.stem.lower()

        # Parse filename: day{N}_{num}_{lang}.png
        # Handle both lowercase _e/_h and uppercase _E/_H
        if "_e" in stem or "_E" in img_path.stem:
            lang = "en"
        elif "_h" in stem or "_H" in img_path.stem:
            lang = "ko"
        else:
            continue

        # Extract key (day and number)
        key = stem.replace("_e", "").replace("_h", "")

        if key not in pairs:
            pairs[key] = {}
        pairs[key][lang] = img_path

    return pairs


def main():
    """Main extraction process."""
    print("=" * 60)
    print("NVIDIA Cert Quiz - Question Extraction")
    print("=" * 60)

    # Setup
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    client = get_openai_client()

    # Get image pairs
    image_pairs = get_image_pairs()
    print(f"\nFound {len(image_pairs)} image pairs")

    all_questions = []
    extraction_log = []

    # Process each pair
    for key in sorted(image_pairs.keys()):
        pair = image_pairs[key]
        print(f"\n[{key}]")

        en_questions = []
        ko_questions = []

        # Extract English version
        if "en" in pair:
            en_questions = extract_questions_from_image(client, pair["en"], "en")

        # Extract Korean version
        if "ko" in pair:
            ko_questions = extract_questions_from_image(client, pair["ko"], "ko")

        # Merge
        merged = merge_language_versions(en_questions, ko_questions)
        all_questions.extend(merged)

        extraction_log.append({
            "key": key,
            "en_image": pair.get("en", Path()).name if "en" in pair else None,
            "ko_image": pair.get("ko", Path()).name if "ko" in pair else None,
            "en_count": len(en_questions),
            "ko_count": len(ko_questions),
            "merged_count": len(merged),
        })

    # Add unique IDs
    for i, q in enumerate(all_questions):
        q["id"] = f"nq_{i+1:04d}"

    # Save results
    output_data = {
        "metadata": {
            "extracted_at": datetime.utcnow().isoformat(),
            "source_dir": str(SOURCE_DIR),
            "total_questions": len(all_questions),
            "total_images": len(image_pairs) * 2,
        },
        "extraction_log": extraction_log,
        "questions": all_questions,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print("=" * 60)
    print(f"Total questions extracted: {len(all_questions)}")
    print(f"Output saved to: {OUTPUT_FILE}")

    # Summary by day
    day_counts = {}
    for q in all_questions:
        day = q.get("source_day", 0)
        day_counts[day] = day_counts.get(day, 0) + 1

    print("\nQuestions by day:")
    for day in sorted(day_counts.keys()):
        print(f"  Day {day}: {day_counts[day]} questions")

    # Summary by category
    category_counts = {}
    for q in all_questions:
        cat = q.get("category", "Unknown")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    print("\nQuestions by category:")
    for cat in sorted(category_counts.keys()):
        print(f"  {cat}: {category_counts[cat]} questions")


if __name__ == "__main__":
    main()
