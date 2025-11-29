# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NVIDIA Cert Quiz** - NVIDIA 인증 제너레이티브 AI LLMs 자격증 시험 준비 앱

| 항목 | 내용 |
|------|------|
| GitHub | https://github.com/daehyub71/nvidia-cert-quiz |
| 배포 | Google Cloud Run |
| Frontend | React Native (Expo) |
| Backend | FastAPI |
| Database | Supabase (PostgreSQL) |
| LLM | OpenAI GPT-4o-mini |

## Common Commands

### Backend

```bash
cd backend
source venv/bin/activate

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Extract questions from images (one-time)
python scripts/extract_questions.py

# Seed database
python scripts/seed_database.py

# Deploy to Cloud Run
gcloud builds submit --config cloudbuild.yaml
```

### Mobile (React Native)

```bash
cd mobile

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Build for production
eas build --platform all
```

## Architecture

### System Flow
```
Mobile App (Expo) → FastAPI (Cloud Run) → Supabase (PostgreSQL)
                                       ↘ OpenAI (해설 생성)
```

### Key Features
- **시험 모드**: 5/10/15/20문제 선택, 랜덤 출제
- **채점 및 해설**: LLM 기반 상세 해설
- **오답 노트**: 틀린 문제 자동 저장
- **북마크**: 어려운 문제 표시
- **통계**: 학습 진도, 정답률 추이

## Project Structure

```
nvidia-cert-quiz/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry
│   │   ├── api/                 # API endpoints
│   │   ├── models/              # Pydantic schemas
│   │   └── services/            # Business logic
│   ├── scripts/                 # Data extraction
│   └── requirements.txt
│
├── mobile/
│   ├── app/                     # Expo Router pages
│   ├── components/              # React components
│   ├── services/                # API client
│   └── stores/                  # Zustand stores
│
└── data/
    └── questions.json           # Question bank
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

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Database Schema

### Core Tables
- `questions` - 문제 은행 (~150문제)
- `users` - 사용자 (기기 ID 또는 이메일)
- `quiz_history` - 시험 이력
- `bookmarks` - 북마크
- `wrong_answers` - 오답 노트
- `explanations` - LLM 해설 캐시
- `question_stats` - 난이도 통계

## API Endpoints

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/questions/random` | GET | 랜덤 문제 조회 |
| `/api/quiz/start` | POST | 시험 시작 |
| `/api/quiz/submit` | POST | 시험 제출/채점 |
| `/api/bookmarks` | GET/POST/DELETE | 북마크 관리 |
| `/api/wrong-answers` | GET | 오답 목록 |
| `/api/explanations/{id}` | GET | 해설 조회 |

## Data Source

- **위치**: `/Users/sunchulkim/src/nvidia_시험준비/`
- **이미지 수**: 60개 (영어/한국어 각 30세트)
- **예상 문제 수**: ~150문제
- **추출 방식**: GPT-4o Vision

## Development Notes

- Question images already have answers marked (●)
- Use Vision LLM to extract text and correct answers
- Support both English and Korean languages
- Mobile-first responsive design
- Offline caching for question bank (online for explanations)
