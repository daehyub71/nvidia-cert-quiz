"""FastAPI main application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.api import questions, quiz, bookmarks, stats, users, wrong_answers, explanations


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    settings = get_settings()
    print(f"Starting NVIDIA Cert Quiz API ({settings.environment})")
    yield
    # Shutdown
    print("Shutting down NVIDIA Cert Quiz API")


settings = get_settings()

app = FastAPI(
    title="NVIDIA Cert Quiz API",
    description="API for NVIDIA Generative AI LLMs certification exam preparation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(questions.router, prefix="/api/v1/questions", tags=["Questions"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["Quiz"])
app.include_router(bookmarks.router, prefix="/api/v1/bookmarks", tags=["Bookmarks"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["Statistics"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(wrong_answers.router, prefix="/api/v1/wrong-answers", tags=["Wrong Answers"])
app.include_router(explanations.router, prefix="/api/v1/explanations", tags=["Explanations"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "NVIDIA Cert Quiz API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "environment": settings.environment}
