"""Pydantic schemas for questions and quizzes."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Language(str, Enum):
    """Supported languages."""
    ENGLISH = "en"
    KOREAN = "ko"


class Difficulty(str, Enum):
    """Question difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionBase(BaseModel):
    """Base question model."""
    question_text_en: str
    question_text_ko: str
    options_en: List[str] = Field(..., min_length=4, max_length=6)
    options_ko: List[str] = Field(..., min_length=4, max_length=6)
    correct_answer: int = Field(..., ge=0, le=5)
    category: str
    difficulty: Difficulty = Difficulty.MEDIUM
    source_day: int
    source_image: str


class QuestionCreate(QuestionBase):
    """Schema for creating a question."""
    pass


class Question(QuestionBase):
    """Question with ID and timestamps."""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuestionResponse(BaseModel):
    """Question response for quiz (without answer)."""
    id: str
    question_text: str
    options: List[str]
    category: str
    difficulty: Difficulty


class QuizConfig(BaseModel):
    """Quiz configuration."""
    question_count: int = Field(default=10, ge=5, le=20)
    language: Language = Language.KOREAN
    categories: Optional[List[str]] = None
    difficulty: Optional[Difficulty] = None
    exclude_bookmarked: bool = False
    wrong_answers_only: bool = False


class QuizAnswer(BaseModel):
    """User's answer to a question."""
    question_id: str
    selected_answer: int = Field(..., ge=0, le=5)
    time_spent_seconds: int = Field(default=0, ge=0)


class QuizSubmission(BaseModel):
    """Quiz submission with all answers."""
    quiz_id: str
    answers: List[QuizAnswer]
    total_time_seconds: int


class QuestionResult(BaseModel):
    """Result for a single question."""
    question_id: str
    question_text: str
    options: List[str]
    correct_answer: int
    selected_answer: int
    is_correct: bool
    explanation: Optional[str] = None


class QuizResult(BaseModel):
    """Complete quiz result."""
    quiz_id: str
    user_id: str
    score: int
    total_questions: int
    percentage: float
    results: List[QuestionResult]
    completed_at: datetime


class BookmarkCreate(BaseModel):
    """Schema for creating a bookmark."""
    question_id: str
    note: Optional[str] = None


class Bookmark(BookmarkCreate):
    """Bookmark with metadata."""
    id: str
    user_id: str
    created_at: datetime


class ExplanationRequest(BaseModel):
    """Request for AI explanation."""
    question_id: str
    language: Language = Language.KOREAN


class Explanation(BaseModel):
    """AI-generated explanation."""
    question_id: str
    explanation_en: str
    explanation_ko: str
    created_at: datetime


class UserStats(BaseModel):
    """User statistics."""
    total_quizzes: int
    total_questions_answered: int
    correct_answers: int
    accuracy_percentage: float
    category_stats: dict
    difficulty_stats: dict
    recent_scores: List[int]
