"""OpenAI service for question extraction and explanation generation."""
import base64
from pathlib import Path
from typing import Tuple, List, Dict, Any
from openai import OpenAI

from app.core.config import get_settings


def get_openai_client() -> OpenAI:
    """Get OpenAI client instance."""
    settings = get_settings()
    return OpenAI(api_key=settings.openai_api_key)


def encode_image_to_base64(image_path: str) -> str:
    """Encode image to base64 string."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


async def extract_questions_from_image(image_path: str) -> List[Dict[str, Any]]:
    """
    Extract questions from an image using GPT-4o Vision.

    Args:
        image_path: Path to the image file

    Returns:
        List of extracted questions with options and answers
    """
    client = get_openai_client()
    base64_image = encode_image_to_base64(image_path)

    # Determine language from filename
    is_korean = "_h" in image_path.lower() or "_H" in image_path

    prompt = """Analyze this image containing exam questions. Extract ALL questions with their options and correct answers.

For each question, provide:
1. The full question text
2. All answer options (A, B, C, D, etc.)
3. The correct answer (indicated by a checkmark, highlight, or other marking in the image)
4. The topic/category (e.g., "Machine Learning", "Deep Learning", "LLMs", "Transformers", etc.)

Return the data in this exact JSON format:
{
    "questions": [
        {
            "question_text": "Full question text here",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "correct_answer": 0,  // 0-indexed (0 for A, 1 for B, etc.)
            "category": "Category name"
        }
    ]
}

Important:
- Extract ALL questions visible in the image
- Preserve the exact wording of questions and options
- The correct_answer should be the 0-based index of the correct option
- If you cannot determine the correct answer, set it to -1
- Be thorough and accurate"""

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

    import json
    result = json.loads(response.choices[0].message.content)

    # Add metadata
    path = Path(image_path)
    for q in result.get("questions", []):
        q["source_image"] = path.name
        q["language"] = "ko" if is_korean else "en"

        # Extract day number from filename (e.g., day2_1_e.png -> 2)
        if "day" in path.stem.lower():
            try:
                day_num = int(path.stem.lower().split("day")[1].split("_")[0])
                q["source_day"] = day_num
            except (IndexError, ValueError):
                q["source_day"] = 0

    return result.get("questions", [])


async def generate_explanation(question: Dict[str, Any]) -> Tuple[str, str]:
    """
    Generate AI explanation for a question in both English and Korean.

    Args:
        question: Question data from database

    Returns:
        Tuple of (explanation_en, explanation_ko)
    """
    client = get_openai_client()

    # Build context
    options_en = question.get("options_en", [])
    options_ko = question.get("options_ko", [])
    correct_idx = question.get("correct_answer", 0)

    prompt = f"""You are an expert instructor for the NVIDIA Certified Generative AI LLMs Associate exam.

Question (English): {question.get('question_text_en', '')}
Question (Korean): {question.get('question_text_ko', '')}

Options (English):
{chr(10).join(f'{chr(65+i)}. {opt}' for i, opt in enumerate(options_en))}

Options (Korean):
{chr(10).join(f'{chr(65+i)}. {opt}' for i, opt in enumerate(options_ko))}

Correct Answer: {chr(65 + correct_idx)}

Please provide a comprehensive explanation for why the correct answer is right and why the other options are wrong.

Provide the explanation in BOTH English and Korean in this JSON format:
{{
    "explanation_en": "Detailed explanation in English...",
    "explanation_ko": "상세한 한국어 설명..."
}}

The explanation should:
1. Explain the key concept being tested
2. Why the correct answer is right
3. Why each incorrect option is wrong
4. Any helpful tips for remembering this concept"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
        response_format={"type": "json_object"},
    )

    import json
    result = json.loads(response.choices[0].message.content)

    return result.get("explanation_en", ""), result.get("explanation_ko", "")


async def translate_question(question_text: str, options: List[str], source_lang: str) -> Tuple[str, List[str]]:
    """
    Translate question and options to the target language.

    Args:
        question_text: Question text to translate
        options: List of option texts
        source_lang: Source language ('en' or 'ko')

    Returns:
        Tuple of (translated_question, translated_options)
    """
    client = get_openai_client()

    target_lang = "Korean" if source_lang == "en" else "English"
    source_lang_full = "English" if source_lang == "en" else "Korean"

    prompt = f"""Translate the following exam question from {source_lang_full} to {target_lang}.
Maintain technical accuracy and use proper terminology for AI/ML concepts.

Question: {question_text}

Options:
{chr(10).join(f'{chr(65+i)}. {opt}' for i, opt in enumerate(options))}

Return as JSON:
{{
    "question": "Translated question",
    "options": ["Translated option A", "Translated option B", ...]
}}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    import json
    result = json.loads(response.choices[0].message.content)

    return result.get("question", ""), result.get("options", [])
