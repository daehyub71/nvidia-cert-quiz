# NVIDIA Cert Quiz

A study app for NVIDIA Certified Generative AI LLMs Associate exam preparation.

[![React](https://img.shields.io/badge/React-Vite-61DAFB)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)](https://fastapi.tiangolo.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000)](https://vercel.com)
[![Cloud Run](https://img.shields.io/badge/Backend-Cloud%20Run-4285F4)](https://cloud.google.com/run)

[한국어 README](README_KO.md)

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://web-six-cyan-91.vercel.app |
| Backend API | https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app |
| API Docs | https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app/docs |

## Features

- **Quiz Mode**: Select 1/3/5/10 questions, randomly generated
- **AI Explanations**: Detailed explanations powered by GPT-4o-mini (EN/KO)
- **Wrong Answer Review**: Automatically save incorrect answers for review
- **Bookmarks**: Mark difficult questions for later
- **Statistics**: Track accuracy trends and category performance
- **Bilingual**: Real-time English/Korean language switching

## Tech Stack

### Frontend (Web)
- React 18 + TypeScript
- Vite (Build tool)
- Zustand (State management)
- React Router (Routing)
- Lucide React (Icons)

### Backend
- FastAPI (Python 3.11)
- Supabase (PostgreSQL)
- OpenAI GPT-4o-mini (Explanation generation)
- Google Cloud Run (Serverless deployment)

### Infrastructure
- **Frontend Deployment**: Vercel
- **Backend Deployment**: Google Cloud Run (asia-northeast3, Seoul)
- **Database**: Supabase PostgreSQL
- **Secrets**: Google Secret Manager

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase Account
- OpenAI API Key
- Google Cloud SDK (for deployment)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd web
npm install

# Configure environment (for production)
echo "VITE_API_URL=http://localhost:8000" > .env

# Run development server
npm run dev
```

### Database Setup

Create the following tables in Supabase:

- `questions` - Question bank
- `users` - User information
- `quiz_history` - Quiz history
- `bookmarks` - Bookmarks
- `wrong_answers` - Wrong answer notes
- `explanations` - AI explanation cache

## Deployment

### Backend (Cloud Run)

```bash
cd backend

# Set GCP project
gcloud config set project YOUR_PROJECT_ID

# Create secrets (first time only)
echo -n "YOUR_SUPABASE_URL" | gcloud secrets create supabase-url --data-file=-
echo -n "YOUR_SUPABASE_KEY" | gcloud secrets create supabase-key --data-file=-
echo -n "YOUR_OPENAI_KEY" | gcloud secrets create openai-api-key --data-file=-

# Deploy
gcloud builds submit --config cloudbuild.yaml
```

### Frontend (Vercel)

```bash
cd web

# Set Vercel environment variable
vercel env add VITE_API_URL production
# Enter: https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app

# Deploy
vercel --prod --yes
```

## Project Structure

```
nvidia-cert-quiz/
├── backend/              # FastAPI server
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Config, utilities
│   │   ├── models/       # DB models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── scripts/          # Data extraction scripts
│   ├── Dockerfile        # Cloud Run container
│   ├── cloudbuild.yaml   # Cloud Build config
│   └── requirements.txt
│
├── web/                  # React web app
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── stores/       # Zustand stores
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   ├── vercel.json       # Vercel config
│   └── package.json
│
└── data/                 # Question data
    └── questions.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/questions/random` | GET | Get random questions |
| `/api/v1/quiz/start` | POST | Start a quiz |
| `/api/v1/quiz/submit` | POST | Submit quiz for grading |
| `/api/v1/bookmarks` | GET/POST/DELETE | Manage bookmarks |
| `/api/v1/wrong-answers` | GET | Get wrong answers list |
| `/api/v1/explanations/{id}` | GET | Get AI explanation |
| `/api/v1/stats/user/{id}` | GET | Get user statistics |

## Data Source

Based on practice questions from Coursera [NVIDIA Certified Generative AI LLMs](https://www.coursera.org/specializations/exam-prep-nca-genl-nvidia-certified-generative-ai-llms-associate) course.

- 150 questions total
- Full English/Korean support
- 46 categories (Machine Learning, Deep Learning, LLMs, Transformers, etc.)

## Related Links

- [Project Plan](docs/PROJECT_PLAN.md)
- [API Documentation (Swagger)](https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app/docs)

## License

MIT License
