# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NVIDIA Cert Quiz** - NVIDIA 인증 제너레이티브 AI LLMs 자격증 시험 준비 앱

| 항목 | 내용 |
|------|------|
| GitHub | https://github.com/daehyub71/nvidia-cert-quiz |
| Frontend | https://web-six-cyan-91.vercel.app |
| Backend | https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app |
| Frontend Stack | React + Vite + TypeScript |
| Backend Stack | FastAPI + Python 3.11 |
| Database | Supabase (PostgreSQL) |
| LLM | OpenAI GPT-4o-mini |
| Frontend 배포 | Vercel |
| Backend 배포 | Google Cloud Run (asia-northeast3) |

## Common Commands

### Backend

```bash
cd backend
source venv/bin/activate

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Deploy to Cloud Run
gcloud builds submit --config cloudbuild.yaml
```

### Web Frontend

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod --yes
```

## Architecture

### System Flow
```
Web App (Vercel) → FastAPI (Cloud Run) → Supabase (PostgreSQL)
                                       ↘ OpenAI (해설 생성)
```

### Key Features
- **시험 모드**: 1/3/5/10문제 선택, 랜덤 출제
- **채점 및 해설**: GPT-4o-mini 기반 상세 해설 (영/한 실시간 전환)
- **오답 노트**: 틀린 문제 자동 저장
- **북마크**: 어려운 문제 표시
- **통계**: 학습 진도, 정답률 추이, 카테고리별 분석
- **다국어**: 실시간 영어/한국어 전환 지원

## Project Structure

```
nvidia-cert-quiz/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry
│   │   ├── api/                 # API endpoints
│   │   │   ├── questions.py
│   │   │   ├── quiz.py
│   │   │   ├── bookmarks.py
│   │   │   ├── wrong_answers.py
│   │   │   ├── explanations.py
│   │   │   ├── stats.py
│   │   │   └── users.py
│   │   ├── core/                # Config, utils
│   │   ├── schemas/             # Pydantic schemas
│   │   └── services/            # Business logic
│   │       ├── supabase_service.py
│   │       └── openai_service.py
│   ├── scripts/                 # Data extraction
│   ├── Dockerfile               # Cloud Run container
│   ├── cloudbuild.yaml          # Cloud Build config
│   └── requirements.txt
│
├── web/
│   ├── src/
│   │   ├── pages/               # React pages
│   │   │   ├── Home.tsx
│   │   │   ├── ExamSetup.tsx
│   │   │   ├── ExamSession.tsx
│   │   │   ├── ExamResult.tsx
│   │   │   ├── Bookmarks.tsx
│   │   │   └── WrongAnswers.tsx
│   │   ├── components/          # Reusable components
│   │   ├── stores/              # Zustand stores
│   │   │   └── quizStore.ts
│   │   ├── services/            # API client
│   │   │   └── api.ts
│   │   └── types/               # TypeScript types
│   │       └── index.ts
│   ├── vercel.json              # Vercel config
│   └── package.json
│
└── data/
    ├── questions.json           # Original question bank
    ├── all_questions.json       # All questions from API (302)
    └── all_questions.md         # Markdown format for NotebookLM
```

## Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
ENVIRONMENT=development
```

### Web (.env)
```bash
VITE_API_URL=http://localhost:8000
```

### Web (.env.production)
```bash
VITE_API_URL=https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app
```

## Database Schema (Supabase)

### Core Tables (nq_ prefix)
- `nq_questions` - 문제 은행 (302문제)
- `nq_users` - 사용자 (기기 ID 기반)
- `nq_quiz_history` - 시험 이력
- `nq_bookmarks` - 북마크
- `nq_wrong_answers` - 오답 노트
- `nq_explanations` - LLM 해설 캐시
- `nq_question_stats` - 문제별 통계

## API Endpoints

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/v1/questions/all` | GET | 전체 문제 조회 (검증 없음) |
| `/api/v1/questions/random` | GET | 랜덤 문제 조회 |
| `/api/v1/questions/categories` | GET | 카테고리 목록 |
| `/api/v1/quiz/start` | POST | 퀴즈 시작 |
| `/api/v1/quiz/submit` | POST | 퀴즈 제출/채점 |
| `/api/v1/bookmarks` | GET/POST/DELETE | 북마크 관리 |
| `/api/v1/wrong-answers` | GET | 오답 목록 |
| `/api/v1/explanations/{id}` | GET | AI 해설 조회 |
| `/api/v1/stats/user/{id}` | GET | 사용자 통계 |

## Deployment

### Backend (Cloud Run)

```bash
cd backend

# Secrets are managed via Google Secret Manager
# - supabase-url
# - supabase-key
# - supabase-service-role-key
# - openai-api-key

# Deploy
gcloud builds submit --config cloudbuild.yaml
```

### Frontend (Vercel)

```bash
cd web

# Environment variable is set in Vercel
# VITE_API_URL=https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app

# Deploy
vercel --prod --yes
```

## Data Source

- **소스**: Coursera NVIDIA Generative AI LLMs 인증 과정
- **문제 수**: 302문제
- **카테고리**: 46개 (Machine Learning, Deep Learning, LLMs, Transformers 등)
- **언어**: 영어/한국어 완전 지원
- **데이터 파일**: `data/all_questions.json`, `data/all_questions.md`

## Development Notes

- 문제와 답변 모두 영어/한국어 버전을 DB에 저장
- 언어 토글 시 페이지 새로고침 없이 실시간 전환
- 해설은 OpenAI API로 생성 후 DB에 캐싱
- 모바일 반응형 디자인 (iOS Safe Area 지원)
- 100% 점수 시 confetti 효과 + 특별 이미지 표시 (`canvas-confetti` 라이브러리)
- 일부 문제의 `options_ko`/`options_en`이 비어있어 `/questions/all`은 Pydantic 검증 없이 반환
