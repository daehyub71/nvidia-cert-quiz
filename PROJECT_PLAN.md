# NVIDIA Cert Quiz - 프로젝트 기획안

> NVIDIA 인증 제너레이티브 AI LLMs 자격증 시험 준비 앱

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | nvidia-cert-quiz |
| **목적** | Coursera NVIDIA 자격증 과정 문제 풀이 및 학습 앱 |
| **GitHub** | https://github.com/daehyub71/nvidia-cert-quiz |
| **배포** | Google Cloud Run |
| **기술 스택** | React Native (Expo) + FastAPI + Supabase |

---

## 핵심 기능

### 1. 시험 모드
- 문제 수 선택: **5 / 10 / 15 / 20문제**
- 출제 범위: 전체 랜덤 / 오답 문제만 / 북마크 문제만
- 언어 전환: 영어 ↔ 한국어 (토글 버튼)
- 시험 중 정답 표시 없음 → 완료 후 채점

### 2. 결과 및 해설
- 점수 및 정답률 표시
- 문제별 정오답 확인
- **LLM 기반 상세 해설** (GPT-4o-mini)
- 해설 저장 (캐싱)

### 3. 오답 노트
- 틀린 문제 자동 저장
- 복습 완료 표시
- 오답 문제만 재시험 가능

### 4. 북마크
- 어려운 문제 표시
- 북마크 문제만 재시험 가능

### 5. 학습 통계
- 총 학습 진도 (문제 수, 정답률)
- 시험 이력 (회차별 점수 추이)
- 문제별 난이도 (정답률 기반 자동 계산)

### 6. 사용자 인증
- **선택적 로그인** (D 옵션)
  - 비로그인: 기기 ID 기반으로 즉시 시작
  - 로그인 시: 데이터 클라우드 동기화

---

## 인프라 (기존 리소스 공유)

> **비용 절감**: 기존 `seoul-location-services-app` 프로젝트의 Supabase/Upstash 인스턴스 공유

| 서비스 | 프로젝트 ID | 리전 | 비고 |
|--------|------------|------|------|
| **Supabase** | `xptueenuumxhmhkantdl` | ap-northeast-2 (Seoul) | PostgreSQL + Auth |
| **Upstash Redis** | `enhanced-pegasus-30420` | - | 캐싱 (선택사항) |
| **Cloud Run** | 신규 생성 | asia-northeast3 (Seoul) | Backend API |

### 테이블 네이밍 컨벤션
기존 프로젝트와 충돌 방지를 위해 `nq_` 프리픽스 사용:
- `nq_questions` (문제 은행)
- `nq_users` (사용자)
- `nq_quiz_history` (시험 이력)
- `nq_bookmarks` (북마크)
- `nq_wrong_answers` (오답 노트)
- `nq_explanations` (해설 캐시)
- `nq_question_stats` (문제 통계)

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Mobile App (React Native + Expo)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 시험모드 │ │ 결과/해설│ │ 오답노트 │ │ 통계     │ │ 북마크   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API (HTTPS)
┌────────────────────────────▼────────────────────────────────────────┐
│                    Backend (FastAPI on Cloud Run)                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ Question API │ │ Quiz API     │ │ LLM Service  │                 │
│  │ (문제 조회)  │ │ (시험/채점)  │ │ (해설 생성)  │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│              Shared Infrastructure (기존 리소스 공유)                │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │ Supabase (PostgreSQL)│  │ OpenAI GPT-4o-mini   │                 │
│  │ xptueenuumxhmhkantdl │  │ - 해설 생성          │                 │
│  │ - nq_* 테이블        │  │ - 문제 추출 (1회)    │                 │
│  │ - 기존 테이블과 분리 │  │                      │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│  ┌──────────────────────┐                                           │
│  │ Upstash Redis (선택) │                                           │
│  │ - API 응답 캐싱      │                                           │
│  └──────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 데이터 소스

### 이미지 파일 구조
- **위치**: `/Users/sunchulkim/src/nvidia_시험준비/`
- **총 이미지**: 60개 (30개 문제 세트 × 영어/한국어)
- **예상 문제 수**: ~150문제 (이미지당 5문제)

### 파일 명명 규칙
```
day{N}_{question_num}_{lang}.png
- N: 일자 (2~15)
- question_num: 문제 번호 (1, 2)
- lang: e (English) / h (한글)

예: day2_1_e.png, day2_1_h.png
```

### 문제 추출 방식
- **GPT-4o Vision** 사용
- 이미지에서 문제, 보기, 정답 자동 추출
- JSON 형태로 문제 은행 구축

---

## 문제 데이터 구조

```json
{
  "question_id": "day2_1_q1",
  "day": 2,
  "question_number": 1,
  "question_text_en": "What is the primary goal of a regression algorithm in machine learning?",
  "question_text_kr": "머신러닝에서 회귀 알고리즘의 주요 목표는 무엇인가요?",
  "options": [
    {
      "id": "A",
      "text_en": "To assign input data into predefined categories or classes.",
      "text_kr": "입력 데이터를 미리 정의된 범주나 클래스에 할당하는 것."
    },
    {
      "id": "B",
      "text_en": "To predict a continuous numerical value based on input features.",
      "text_kr": "입력 특성을 기반으로 연속적인 수치를 예측하는 것."
    },
    {
      "id": "C",
      "text_en": "To group similar data points together based on their inherent patterns.",
      "text_kr": "고유한 패턴을 기반으로 유사한 데이터 포인트를 그룹화하는 것."
    },
    {
      "id": "D",
      "text_en": "To discover hidden structures in unlabeled data.",
      "text_kr": "레이블이 없는 데이터에서 숨겨진 구조를 발견하는 것."
    }
  ],
  "correct_answer": "B",
  "category": "Machine Learning Basics",
  "image_source": "day2_1_e.png",
  "difficulty": null,
  "explanation_en": null,
  "explanation_kr": null
}
```

---

## 데이터베이스 스키마 (Supabase)

### questions (문제 은행)
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id VARCHAR(50) UNIQUE NOT NULL,
  day INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text_en TEXT NOT NULL,
  question_text_kr TEXT,
  options JSONB NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  category VARCHAR(100),
  image_source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);
```

### quiz_history (시험 이력)
```sql
CREATE TABLE quiz_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_number INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  score_percent DECIMAL(5,2) NOT NULL,
  time_spent_seconds INTEGER,
  question_ids UUID[] NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### question_stats (문제별 통계)
```sql
CREATE TABLE question_stats (
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE PRIMARY KEY,
  total_attempts INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  difficulty_score DECIMAL(3,2) GENERATED ALWAYS AS (
    CASE WHEN total_attempts > 0
    THEN 1.0 - (correct_count::DECIMAL / total_attempts)
    ELSE 0.5 END
  ) STORED
);
```

### bookmarks (북마크)
```sql
CREATE TABLE bookmarks (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);
```

### wrong_answers (오답 노트)
```sql
CREATE TABLE wrong_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer CHAR(1) NOT NULL,
  quiz_history_id UUID REFERENCES quiz_history(id) ON DELETE CASCADE,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id, quiz_history_id)
);
```

### explanations (해설 캐시)
```sql
CREATE TABLE explanations (
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE PRIMARY KEY,
  explanation_en TEXT,
  explanation_kr TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API 설계

### Question API
| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/questions` | GET | 문제 목록 조회 (페이징) |
| `/api/questions/{id}` | GET | 단일 문제 조회 |
| `/api/questions/random` | GET | 랜덤 문제 조회 (?count=10) |
| `/api/questions/stats` | GET | 전체 문제 통계 |

### Quiz API
| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/quiz/start` | POST | 시험 시작 (문제 세트 생성) |
| `/api/quiz/submit` | POST | 시험 제출 및 채점 |
| `/api/quiz/history` | GET | 시험 이력 조회 |
| `/api/quiz/{id}` | GET | 특정 시험 결과 조회 |

### User API
| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/users/register` | POST | 기기 등록 |
| `/api/users/profile` | GET | 프로필 조회 |
| `/api/users/stats` | GET | 학습 통계 |

### Bookmark API
| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/bookmarks` | GET | 북마크 목록 |
| `/api/bookmarks/{question_id}` | POST | 북마크 추가 |
| `/api/bookmarks/{question_id}` | DELETE | 북마크 삭제 |

### Wrong Answer API
| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/wrong-answers` | GET | 오답 목록 |
| `/api/wrong-answers/{id}/review` | PATCH | 복습 완료 표시 |

### Explanation API
| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/explanations/{question_id}` | GET | 해설 조회 (없으면 LLM 생성) |

---

## 화면 설계

> **디자인 소스**: `docs/stitch_home_dashboard/` 디렉토리의 Stitch 디자인 파일 기준

### 화면 목록

| 화면 | 디자인 파일 | 설명 |
|------|------------|------|
| 홈 대시보드 | [home/dashboard/screen.png](docs/stitch_home_dashboard/home/dashboard/screen.png) | 학습 현황, 메뉴 네비게이션 |
| 시험 설정 | [exam_mode_setup/screen.png](docs/stitch_home_dashboard/exam_mode_setup/screen.png) | 문제 수, 출제 범위, 언어 선택 |
| 시험 진행 | [exam_session/screen.png](docs/stitch_home_dashboard/exam_session/screen.png) | 문제 풀이, 진행률, 북마크 |
| 결과 및 해설 | [exam_results_&_explanation/screen.png](docs/stitch_home_dashboard/exam_results_&_explanation/screen.png) | 점수, 문제별 결과, AI 해설 |
| 북마크 | [bookmarks/screen.png](docs/stitch_home_dashboard/bookmarks/screen.png) | 북마크한 문제 목록 |
| 오답 노트 | [incorrect_answers/review/screen.png](docs/stitch_home_dashboard/incorrect_answers/review/screen.png) | 틀린 문제 목록, 복습 기능 |

### 1. 홈 대시보드
![홈 대시보드](docs/stitch_home_dashboard/home/dashboard/screen.png)

**주요 구성 요소:**
- 학습 현황 (총 문제 수, 진도율, 정답률)
- 시험 시작 버튼
- 오답 노트, 북마크, 통계, 설정 네비게이션
- 최근 시험 결과 요약

### 2. 시험 설정
![시험 설정](docs/stitch_home_dashboard/exam_mode_setup/screen.png)

**주요 구성 요소:**
- 문제 수 선택 (5 / 10 / 15 / 20)
- 출제 범위 (전체 랜덤 / 오답 문제만 / 북마크 문제만)
- 언어 선택 (English / 한국어)
- 시험 시작 버튼

### 3. 시험 진행
![시험 진행](docs/stitch_home_dashboard/exam_session/screen.png)

**주요 구성 요소:**
- 문제 번호 및 진행률 표시
- 언어 전환 토글
- 북마크 버튼
- 문제 텍스트 및 선택지 (A, B, C, D)
- 이전/다음 네비게이션
- 문제 번호 인디케이터

### 4. 결과 및 해설
![결과 및 해설](docs/stitch_home_dashboard/exam_results_&_explanation/screen.png)

**주요 구성 요소:**
- 점수 표시 (정답 수 / 총 문제 수, 백분율)
- 소요 시간
- 문제별 정오답 표시 (✅/❌)
- AI 해설 (LLM 생성)
- 해설 보기, 다시 풀기, 홈으로 버튼

### 5. 북마크
![북마크](docs/stitch_home_dashboard/bookmarks/screen.png)

**주요 구성 요소:**
- 북마크한 문제 목록
- 문제 미리보기
- 북마크 해제 기능
- 북마크 문제만 시험 시작

### 6. 오답 노트
![오답 노트](docs/stitch_home_dashboard/incorrect_answers/review/screen.png)

**주요 구성 요소:**
- 틀린 문제 목록
- 내 답 vs 정답 표시
- 복습 완료 체크
- 오답 문제만 시험 시작

---

## 프로젝트 구조

```
nvidia-cert-quiz/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 엔트리포인트
│   │   ├── config.py            # 환경 설정
│   │   ├── database.py          # Supabase 연결
│   │   ├── api/
│   │   │   ├── questions.py     # Question API
│   │   │   ├── quiz.py          # Quiz API
│   │   │   ├── users.py         # User API
│   │   │   ├── bookmarks.py     # Bookmark API
│   │   │   ├── wrong_answers.py # Wrong Answer API
│   │   │   └── explanations.py  # Explanation API
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic 스키마
│   │   └── services/
│   │       ├── llm_service.py   # OpenAI 해설 생성
│   │       └── quiz_service.py  # 시험 로직
│   ├── scripts/
│   │   ├── extract_questions.py # Vision LLM 문제 추출
│   │   └── seed_database.py     # 초기 데이터 입력
│   ├── requirements.txt
│   ├── Dockerfile
│   └── cloudbuild.yaml
│
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx        # 홈 화면
│   │   │   ├── quiz.tsx         # 시험 화면
│   │   │   ├── results.tsx      # 결과 화면
│   │   │   ├── wrong-notes.tsx  # 오답 노트
│   │   │   ├── bookmarks.tsx    # 북마크
│   │   │   ├── stats.tsx        # 통계
│   │   │   └── settings.tsx     # 설정
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── QuestionCard.tsx
│   │   ├── OptionButton.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ScoreCard.tsx
│   │   └── ExplanationCard.tsx
│   ├── services/
│   │   └── api.ts               # API 클라이언트
│   ├── stores/
│   │   ├── quizStore.ts         # 시험 상태
│   │   └── userStore.ts         # 사용자 상태
│   ├── types/
│   │   └── index.ts
│   ├── app.json
│   └── package.json
│
├── data/
│   ├── images/                  # 원본 이미지 (심볼릭 링크)
│   └── questions.json           # 추출된 문제 은행
│
├── docs/
│   └── API.md                   # API 문서
│
├── CLAUDE.md
├── README.md
└── PROJECT_PLAN.md              # 이 파일
```

---

## 환경 변수

### Backend (.env)
```bash
# Supabase (기존 seoul-location-services-app 프로젝트 공유)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DATABASE_URL=postgresql://postgres.your-project-id:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# Upstash Redis (캐싱용, 선택사항)
UPSTASH_URL=https://your-instance.upstash.io
UPSTASH_TOKEN=your-upstash-token

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# App
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
# Production: https://nvidia-cert-quiz-xxx.run.app

# Supabase Direct Access (선택사항 - 오프라인 캐싱용)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 개발 일정 (4주)

### Week 1: 문제 추출 + DB 구축
| 일자 | 작업 |
|------|------|
| Day 1 | 프로젝트 구조 생성, Supabase 설정 |
| Day 2 | GPT-4o Vision 문제 추출 스크립트 개발 |
| Day 3-4 | 60개 이미지에서 문제 추출 |
| Day 5 | 추출 데이터 검증 및 DB 입력 |

### Week 2: Backend API 개발
| 일자 | 작업 |
|------|------|
| Day 1 | FastAPI 프로젝트 구조, Question API |
| Day 2 | Quiz API (시작, 제출, 채점) |
| Day 3 | User/Bookmark/WrongAnswer API |
| Day 4 | LLM 해설 생성 서비스 |
| Day 5 | Cloud Run 배포, API 테스트 |

### Week 3: React Native 앱 개발
| 일자 | 작업 |
|------|------|
| Day 1 | Expo 프로젝트 설정, 네비게이션 |
| Day 2 | 홈 화면, 시험 설정 화면 |
| Day 3 | 시험 진행 화면 (문제 풀이) |
| Day 4 | 결과 화면, 해설 화면 |
| Day 5 | API 연동, 상태 관리 |

### Week 4: 추가 기능 + 완성
| 일자 | 작업 |
|------|------|
| Day 1 | 오답 노트 화면 |
| Day 2 | 북마크, 통계 화면 |
| Day 3 | 설정 화면, 언어 전환 |
| Day 4 | UI 폴리싱, 버그 수정 |
| Day 5 | 최종 테스트, 문서화 |

---

## 기술 스택 상세

### Frontend (Mobile)
| 항목 | 기술 |
|------|------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| State Management | Zustand |
| HTTP Client | Axios / TanStack Query |
| UI Components | React Native Paper / NativeWind |

### Backend
| 항목 | 기술 |
|------|------|
| Framework | FastAPI |
| Language | Python 3.11+ |
| Database | Supabase (PostgreSQL) |
| LLM | OpenAI GPT-4o-mini |
| Deployment | Google Cloud Run |
| Container | Docker |

### Infrastructure
| 항목 | 기술 |
|------|------|
| Database | Supabase |
| Backend Hosting | Google Cloud Run |
| CI/CD | Cloud Build |
| Secrets | Secret Manager |

---

## 비용 예상

| 항목 | 예상 비용 |
|------|----------|
| Supabase | Free tier (500MB DB) |
| Cloud Run | Free tier (2M requests/month) |
| OpenAI API | ~$5-10/month (해설 생성) |
| **총 예상** | **~$5-10/month** |

---

## 향후 확장 계획

1. **Day별 필터 기능**: 특정 Day 문제만 선택 가능
2. **푸시 알림**: 학습 리마인더
3. **소셜 기능**: 랭킹, 친구 초대
4. **추가 자격증**: 다른 NVIDIA 자격증 지원
5. **웹 버전**: React 웹앱 추가
