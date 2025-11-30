# NVIDIA Cert Quiz

NVIDIA 인증 제너레이티브 AI LLMs 자격증 시험 준비 앱

[![React](https://img.shields.io/badge/React-Vite-61DAFB)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688)](https://fastapi.tiangolo.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000)](https://vercel.com)
[![Cloud Run](https://img.shields.io/badge/Backend-Cloud%20Run-4285F4)](https://cloud.google.com/run)

[English README](README.md)

## 라이브 데모

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | https://web-six-cyan-91.vercel.app |
| 백엔드 API | https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app |
| API 문서 | https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app/docs |

## 주요 기능

- **시험 모드**: 1/3/5/10문제 선택, 랜덤 출제
- **AI 해설**: GPT-4o-mini 기반 상세 문제 해설 (영/한 지원)
- **오답 노트**: 틀린 문제 자동 저장 및 복습
- **북마크**: 어려운 문제 표시
- **학습 통계**: 정답률 추이, 카테고리별 분석
- **다국어**: 실시간 영어/한국어 전환

## 기술 스택

### 프론트엔드 (Web)
- React 18 + TypeScript
- Vite (빌드 도구)
- Zustand (상태 관리)
- React Router (라우팅)
- Lucide React (아이콘)

### 백엔드
- FastAPI (Python 3.11)
- Supabase (PostgreSQL)
- OpenAI GPT-4o-mini (해설 생성)
- Google Cloud Run (서버리스 배포)

### 인프라
- **프론트엔드 배포**: Vercel
- **백엔드 배포**: Google Cloud Run (asia-northeast3, 서울)
- **데이터베이스**: Supabase PostgreSQL
- **시크릿 관리**: Google Secret Manager

## 시작하기

### 사전 요구사항
- Node.js 18+
- Python 3.11+
- Supabase 계정
- OpenAI API Key
- Google Cloud SDK (배포 시)

### 백엔드 설정

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 환경 설정
cp .env.example .env
# .env 파일에 다음 정보 입력:
# - SUPABASE_URL
# - SUPABASE_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY

# 개발 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드 설정

```bash
cd web
npm install

# 환경 설정 (프로덕션용)
echo "VITE_API_URL=http://localhost:8000" > .env

# 개발 서버 실행
npm run dev
```

### 데이터베이스 설정

Supabase에서 다음 테이블을 생성합니다:

- `questions` - 문제 은행
- `users` - 사용자 정보
- `quiz_history` - 퀴즈 이력
- `bookmarks` - 북마크
- `wrong_answers` - 오답 노트
- `explanations` - AI 해설 캐시

## 배포

### 백엔드 (Cloud Run)

```bash
cd backend

# GCP 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 시크릿 생성 (최초 1회)
echo -n "YOUR_SUPABASE_URL" | gcloud secrets create supabase-url --data-file=-
echo -n "YOUR_SUPABASE_KEY" | gcloud secrets create supabase-key --data-file=-
echo -n "YOUR_OPENAI_KEY" | gcloud secrets create openai-api-key --data-file=-

# 배포
gcloud builds submit --config cloudbuild.yaml
```

### 프론트엔드 (Vercel)

```bash
cd web

# Vercel 환경 변수 설정
vercel env add VITE_API_URL production
# 입력: https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app

# 배포
vercel --prod --yes
```

## 프로젝트 구조

```
nvidia-cert-quiz/
├── backend/              # FastAPI 서버
│   ├── app/
│   │   ├── api/          # API 엔드포인트
│   │   ├── core/         # 설정, 유틸리티
│   │   ├── models/       # DB 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   └── services/     # 비즈니스 로직
│   ├── scripts/          # 데이터 추출 스크립트
│   ├── Dockerfile        # Cloud Run 컨테이너
│   ├── cloudbuild.yaml   # Cloud Build 설정
│   └── requirements.txt
│
├── web/                  # React 웹 앱
│   ├── src/
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── stores/       # Zustand 스토어
│   │   ├── services/     # API 클라이언트
│   │   └── types/        # TypeScript 타입
│   ├── vercel.json       # Vercel 설정
│   └── package.json
│
└── data/                 # 문제 데이터
    └── questions.json
```

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/v1/questions/random` | GET | 랜덤 문제 조회 |
| `/api/v1/quiz/start` | POST | 퀴즈 시작 |
| `/api/v1/quiz/submit` | POST | 퀴즈 제출/채점 |
| `/api/v1/bookmarks` | GET/POST/DELETE | 북마크 관리 |
| `/api/v1/wrong-answers` | GET | 오답 목록 |
| `/api/v1/explanations/{id}` | GET | AI 해설 조회 |
| `/api/v1/stats/user/{id}` | GET | 사용자 통계 |

## 데이터 소스

Coursera [NVIDIA 인증 제너레이티브 AI LLMs](https://www.coursera.org/specializations/exam-prep-nca-genl-nvidia-certified-generative-ai-llms-associate) 과정의 연습 문제를 기반으로 합니다.

- 총 150문제
- 영어/한국어 완전 지원
- 46개 카테고리 (Machine Learning, Deep Learning, LLMs, Transformers 등)

## 관련 링크

- [프로젝트 기획안](docs/PROJECT_PLAN.md)
- [API 문서 (Swagger)](https://nvidia-cert-quiz-api-wxhce7qcyq-du.a.run.app/docs)

## 라이선스

MIT License
