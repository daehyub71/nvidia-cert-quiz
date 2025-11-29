# 🎓 NVIDIA Cert Quiz

NVIDIA 인증 제너레이티브 AI LLMs 자격증 시험 준비 앱

[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)](https://fastapi.tiangolo.com)
[![Deploy](https://img.shields.io/badge/Deploy-Cloud%20Run-orange)](https://cloud.google.com/run)

## ✨ 주요 기능

- 🎯 **시험 모드**: 5/10/15/20문제 선택, 랜덤 출제
- 📖 **AI 해설**: GPT-4o 기반 상세 문제 해설
- 📝 **오답 노트**: 틀린 문제 자동 저장 및 복습
- ⭐ **북마크**: 어려운 문제 표시
- 📊 **학습 통계**: 정답률 추이, 난이도 분석
- 🌐 **다국어**: 영어/한국어 전환

## 📱 스크린샷

(Coming Soon)

## 🏗️ 기술 스택

### Frontend
- React Native + Expo
- TypeScript
- Zustand (상태 관리)
- React Native Paper

### Backend
- FastAPI
- Supabase (PostgreSQL)
- OpenAI GPT-4o-mini
- Google Cloud Run

## 🚀 시작하기

### Prerequisites
- Node.js 18+
- Python 3.11+
- Expo CLI
- Supabase Account
- OpenAI API Key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run server
uvicorn app.main:app --reload --port 8000
```

### Mobile Setup

```bash
cd mobile
npm install

# Configure environment
cp .env.example .env
# Edit .env with API URL

# Run app
npx expo start
```

## 📂 프로젝트 구조

```
nvidia-cert-quiz/
├── backend/           # FastAPI 서버
│   ├── app/          # 애플리케이션 코드
│   ├── scripts/      # 데이터 추출 스크립트
│   └── tests/        # 테스트
├── mobile/           # React Native 앱
│   ├── app/          # Expo Router 페이지
│   ├── components/   # 재사용 컴포넌트
│   └── stores/       # 상태 관리
└── data/             # 문제 데이터
```

## 📊 데이터 소스

Coursera [NVIDIA 인증 제너레이티브 AI LLMs](https://www.coursera.org/specializations/exam-prep-nca-genl-nvidia-certified-generative-ai-llms-associate) 과정의 연습 문제를 기반으로 합니다.

- 총 ~150문제
- 영어/한국어 지원
- Machine Learning, Deep Learning, LLMs 등 다양한 주제

## 🔗 관련 링크

- [프로젝트 기획안](PROJECT_PLAN.md)
- [API 문서](docs/API.md)

## 📄 License

MIT License
