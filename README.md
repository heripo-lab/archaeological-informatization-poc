# 「대형 언어 모델(LLM)을 활용한 고고학 정보화 연구 – 발굴조사보고서의 메타데이터 자동 추출 파이프라인 개념 검증」 PoC (스냅샷)

본 저장소는 『헤리티지: 역사와 과학』 제58권 제3호(2025년 9월 30일) 게재 논문 「대형 언어 모델(LLM)을 활용한 고고학 정보화 연구 – 발굴조사보고서의 메타데이터 자동 추출 파이프라인 개념 검증」에서 구현한 PoC 코드의 “스냅샷”입니다. 학술적·기술적 투명성을 위해 소스코드를 공개합니다. 다만 이 저장소는 연구 시점의 기록 보존 목적이며, 추가 개발이나 제3자의 기여(Contribution)는 받지 않습니다.

- [논문 다운로드](https://poc.heripo.com/KCI_FI003244876.pdf)
- [디지털 부록 바로가기](https://poc.heripo.com)
- [논문 요약 영상 시청](https://youtu.be/iyAXYahDiT0)
- [PoC 시연 영상 시청](https://youtu.be/PCKKLPBP78w)
- [heripo engine - 프로덕션급 엔진 오픈소스](https://github.com/heripo-lab/heripo-engine)
- [heripo engine 온라인 데모 체험](https://engine-demo.heripo.com)
- [리서치 레이더(heripo) 구독하러 가기](https://heripo.com/research-radar/subscribe)

## 🚀 heripo engine - 프로덕션급 엔진 공개

본 논문의 PoC 연구 이후 2026년 1월 28일, 핵심 기술을 발전시켜 **[heripo engine](https://github.com/heripo-lab/heripo-engine)** 오픈소스 프로젝트를 공개했습니다.

- **GitHub**: https://github.com/heripo-lab/heripo-engine
- **온라인 데모**: https://engine-demo.heripo.com (로컬 설치 없이 바로 체험 가능)

### 주요 개선사항

본 PoC와 비교하여 다음과 같은 발전이 이루어졌습니다:

- ✅ **OCR 지원**: Docling SDK를 활용한 고품질 OCR로 스캔 문서도 처리 가능
- ✅ **Apple Silicon 최적화**: M1/M2/M3/M4/M5 칩에서 GPU 가속 지원
- ✅ **프로덕션급 설계**: TypeScript 기반 모노레포, 100% 테스트 커버리지
- ✅ **확장 가능한 파이프라인**: 원천 데이터 추출 → 데이터 원장 → 표준화 → 온톨로지
- ✅ **범용 LLM 지원**: OpenAI, Anthropic, Google 등 다양한 LLM 프로바이더 지원

heripo engine은 본 PoC의 개념을 검증 수준을 넘어 실제 운영 가능한 시스템으로 발전시킨 결과물입니다. 자세한 내용은 [heripo engine 저장소](https://github.com/heripo-lab/heripo-engine)를 참고하세요.

## 스냅샷 공지 및 유의사항(반드시 읽어주세요)
- 본 코드는 연구의 아이디어와 가능성 검증에 초점을 둔 PoC로, 프로덕션 수준의 안정성·보안·코드 품질을 보장하지 않습니다.
- 현재 저장소는 유지보수하지 않으며, 이슈나 PR은 받지 않습니다. 연구 기록의 공개가 목적입니다.
- 코드 일부(특히 화면/프론트엔드)는 LLM 보조 도구를 활용해 빠르게 작성했으며, 정교한 디자인 패턴을 따르지 않습니다. 페이지 단일 파일에 로직이 몰려 있는 등 실험적 구조가 존재합니다.
  - 저는 시니어 소프트웨어 엔지니어로, 웹 프론트엔드를 전문적으로 다루고 있습니다만,
  - 본 저장소의 코드 품질이 저의 프론트엔드 엔지니어링 전문성을 대변하지는 않습니다.
- TypeScript/Next.js 선택은 연구자의 익숙함과 실험 편의성 때문입니다. 실전 적용 시에는 상황에 더 적합한 언어/프레임워크를 선택하세요.
- 본 코드는 아래 “보고서 3종”에 맞추어 실험적으로 구성되었으며, 다른 형식의 보고서에는 최적화되어 있지 않습니다. 다만 OCR이 필요하지 않은 대부분의 보고서에서는 대체로 동작합니다.
  - 백제역사문화연구원, 2025, 『부여 화지산 백제과원 및 둘레길 조성사업부지내 유적』.
  - 일영문화유산연구원, 2025, 『제주 항파두리 항몽유적 내성지(7차)』.
  - 겨레문화유산연구원, 2025, 『공주 석장리 구석기 유적(14차)』.
- OCR은 지원하지 않습니다. 최신 보고서도 텍스트가 아웃라인 처리된 경우가 있어 OCR이 필요한 사례가 생길 수 있으니 참고하세요.
- 반드시 로컬 환경에서만 테스트하세요. 서버에 배포하거나 인터넷 공개 환경에서 실행하지 마세요.
  - 보안: 종속성 업데이트/취약점으로 인해 예기치 않은 보안 이슈가 발생할 수 있습니다.
  - 비용: OpenAI API 호출 비용이 클 수 있습니다(실행 시 수만원대 과금 가능). 로컬에서 제한적으로, 테스트 수준으로만 실행하세요.

## 오픈소스 공개 목적 및 책임 한계
- 이 저장소 공개의 1차 목적은 연구의 투명성과 학술적 기록 공유입니다. 코드를 공개했다고 해서 실행을 권장하거나 요구하는 것은 아닙니다.
- 다만 코드를 공개하는 순간 누구나 실행이 가능해지므로, 최소한의 실행 안내를 제공합니다.
- 이 코드를 실행함으로써 발생할 수 있는 보안·비용·데이터 보호·법적 이슈 등 모든 리스크와 책임은 전적으로 실행자 본인에게 있습니다. 저장소 소유자는 어떠한 책임도 지지 않습니다.
- 소프트웨어 및 코딩에 대한 기본 지식과 경험이 있는 사용자만 제한적으로 실행하기를 권장합니다.

## 후속 오픈소스 프로젝트

본 논문의 연구 이후, 핵심 기술을 발전시켜 다양한 오픈소스 프로젝트를 진행하고 있습니다.

### 공식 후속 연구 프로젝트 (예정)

본 논문의 직접적인 후속 연구로, **발굴조사보고서에서 메타데이터를 추출하여 학술적으로 의미있는 데이터를 생성하는 프로젝트**를 개발 중입니다. 본 PoC에서 검증한 개념을 프로덕션 수준으로 고도화하여, 고고학 연구의 디지털 전환에 실질적으로 기여할 수 있는 도구로 발전시킬 예정입니다.

- **현재 상태**: 개발 중
- **공개 예정**: 서비스 가능 수준 완성 시 오픈소스로 전환
- **목표**: 발굴조사보고서 메타데이터 자동 추출 및 구조화 시스템

### 관련 오픈소스 프로젝트

본 논문의 핵심 개념(LLM 기반 문서 처리 파이프라인)을 다른 도메인으로 확장한 프로젝트들입니다. 학술 논문의 직접적인 후속은 아니지만, 연구 과정에서 파생된 실용적 결과물로서 지속적으로 운영하고 있습니다.

#### LLM Newsletter Kit

범용 AI 뉴스레터 자동화 엔진입니다. 본 논문에서 개발한 메타데이터 추출 파이프라인의 개념을 확장하여, 크롤링 → 분석 → 콘텐츠 생성 → 저장의 전체 과정을 자동화하는 타입 안전 툴킷으로 발전시켰습니다.

- **저장소**: https://github.com/heripo-lab/llm-newsletter-kit-core
- **npm 패키지**: `@llm-newsletter-kit/core`
- **특징**: TypeScript 기반, Provider 패턴으로 모든 컴포넌트 교체 가능, 100% 테스트 커버리지
- **라이선스**: Apache-2.0

#### Heripo Research Radar

문화유산 분야 AI 뉴스레터 서비스입니다. LLM Newsletter Kit의 실제 운영 사례이자 레퍼런스 구현체로, 62개 크롤링 타겟에서 콘텐츠를 수집하여 주간 뉴스레터를 자동 생성합니다.

- **저장소**: https://github.com/heripo-lab/heripo-research-radar
- **npm 패키지**: `@heripo/research-radar`
- **서비스**: https://heripo.com/research-radar/subscribe
- **운영 지표**: 발행당 $0.2-1 비용, 24/7 완전 자동화, 15% CTR
- **라이선스**: Apache-2.0

앞으로도 핵심 기술들을 지속적으로 발전시키고, 학계와 업계의 '공동 자산'으로 만들어가겠습니다.

---

## 연구 배경 및 논문 요약

본 섹션은 문서 길이와 가독성을 위해 docs 하위 파일로 분리되었습니다. 아래 링크에서 전체 내용을 확인하세요.
- [연구 배경 및 논문 요약 보기](./docs/research-background-and-paper-summary.md)

---

## 운영체제 지원(OS Support)
- 지원: macOS, Linux
- 미지원: Windows 네이티브 환경(Windows PowerShell/명령 프롬프트에서 직접 실행)
- Windows 사용자는 WSL(Windows Subsystem for Linux) 사용을 권장합니다.
  - WSL이란? Windows에서 가벼운 Linux 환경을 구동할 수 있게 하는 기능으로, 별도의 무거운 가상머신 없이 Linux를 사용할 수 있습니다.
  - WSL 설치 가이드: https://learn.microsoft.com/ko-kr/windows/wsl/install
  - WSL 소개: https://learn.microsoft.com/ko-kr/windows/wsl/about
- 미지원 사유
  - 본 프로젝트는 애초에 개인 논문 연구용으로 macOS 환경을 기준으로 개발되었습니다.
  - 오픈소스 공개의 주된 목적은 연구 투명성 공유이며, 전문 개발지식이 없는 사용자에게 실행을 권하지 않습니다. 공개 준비 과정에서도 추가 호환성(특히 Windows 네이티브) 확보는 진행하지 않았습니다.
  - Docker 제공도 검토했으나, Windows 사용자에게는 오히려 진입 장벽이 될 수 있어 제공하지 않습니다.
- 문의: 그래도 반드시 실행해야 하는 사유가 있으신 분은 kimhongyeon89@gmail.com 으로 연락 바랍니다.

## 빠른 시작(Quick Start)
아래 절차는 “로컬 단발성 테스트”를 위한 안내입니다. 배포/운영 목적 사용은 금지합니다.

1) 필수 소프트웨어
- Node.js: LTS 버전 권장(버전 종속성 크지 않음)
  - 설치 가이드(GUI 중심): [Node.js 설치 가이드](./docs/nodejs-installation.md)
- Python: 시스템에 설치 필요
  - 설치 가이드(GUI 중심): [Python 설치 가이드](./docs/python-installation.md)

2) 저장소 클론 및 의존성 설치
- 저장소 클론 후 프로젝트 루트에서 실행:
  - `npm install`
  - 설치 시 자동 실행되는 preinstall 스크립트가 다음을 수행합니다:
    - 데이터/임베딩 파일 다운로드: `scripts/download-glossary-embeddings.js` → `data/glossary-embeddings.json` 저장(대용량 파일)
    - Python 가상환경 생성 및 의존성 설치: `scripts/setup-python-env.js` → `.venv` 생성 후 `src/modules/pdf-process/requirements.txt` 설치

3) 환경 변수 설정(중요)
- 루트의 `.env.local.example`를 복사해 `.env.local` 파일을 생성하고 OpenAI API 키를 입력하세요.
  - 발급 가이드: [OpenAI API 키 발급 가이드](./docs/openai-api-key.md)
  - 예시:
    - `OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxx`
  - 중요: API 키 관리와 사용량/비용 관리는 실행자 본인의 책임이며, 저장소 소유자는 책임지지 않습니다.
- 민감 정보는 절대 커밋/공개하지 마세요. `.env.local`은 `.gitignore`에 포함되어 있습니다.

4) 빌드 및 실행(개발 서버 대신 빌드 실행 권장)
- 빌드: `npm run build`
- 실행: `npm start`
- 브라우저에서 접속: http://localhost:3000

5) 실행 시 주의사항(반복 강조)
- 로컬에서 제한적으로만 테스트하세요. 서버 업로드/배포 금지.
- OpenAI API 과금에 주의하세요. 대용량 PDF 처리 시 토큰 사용량이 급증합니다.

---

## 소스코드 개요와 처리 흐름
PoC는 “PDF 업로드 → PDF 텍스트/이미지 추출(파이썬) → 이미지-캡션 매핑(규칙/LLM) → 본문 분석 및 구조화(LLM) → SQLite 저장 → 대화형 질의응답(LLM+사전)”의 파이프라인으로 동작합니다.

1) 프론트엔드(UI)
- 파일 업로드/처리 페이지: `src/app/page.tsx`
  - PDF 업로드(최대 500MB), 페이지 유형(PageType: 단면/양면), 실제 첫 페이지(realFirstPage) 입력
  - 업로드 후 정형화 API 호출(`/api/report/standardize`), 처리 상태 폴링 지원

2) 업로드 API
- `POST /api/report/upload` → 업로드 파일을 프로젝트 루트의 `uploads/`에 저장하고 `reportId` 반환
  - 구현: `src/app/api/report/upload/route.ts`

3) 정형화(Standardize) API
- `POST /api/report/standardize` → 업로드된 PDF를 처리하여 구조화 수행
  - 구현: `src/app/api/report/standardize/route.ts`
  - 파라미터: `reportId`, `pageType`(1/2), `realFirstPage`(offset)
  - 내부에서 `standardizeReport()` 호출: `src/app/api/report/standardize/standardize-report.ts`

4) PDF 처리(파이썬 호출)
- Node에서 파이썬 스크립트 실행: `src/modules/pdf-process/index.ts`
  - `.venv/bin/python`으로 `src/modules/pdf-process/pdf-extractor.py` 호출
  - 참고: Windows 네이티브 환경은 지원하지 않습니다. Windows 사용자는 WSL(Ubuntu) 환경에서 실행해 주세요.
  - 결과(JSON): 텍스트/이미지 좌표, 페이지 정보 등
- 파이썬 의존성: `src/modules/pdf-process/requirements.txt`

5) 이미지-캡션 매핑
- 규칙 기반(기본): `src/modules/caption-extract-mapper/captionExtractMapperWithRule.ts`
- LLM 기반(옵션): `src/modules/caption-extract-mapper/captionExtractMapperWithLLM.ts`
- 공통 엔트리: `src/modules/caption-extract-mapper/index.ts`

6) 본문 분석 및 데이터 구성(LLM)
- 메인 엔트리: `src/modules/make-data/index.ts`
  - 유적 개요 추출: `makeExcavatedSiteData.ts` → 목차 기반으로 “조사 내용” 시작/다음 장 추정, 이미지 캡션 근거로 이미지 연결, 누적 병합 로직 포함
  - 트렌치/유구/유물 추출: `makeTrenchFeatureArtifactData.ts` → 2페이지 단위로 분할 분석하며 누적 병합 및 재시도 로직 포함
- 공통 LLM 호출 유틸: `src/libs/open-ai.ts` (`OPENAI_API_KEY` 필요)
- JSON 파싱 유틸: `src/utils/extract-pure-json.ts`(LLM 출력의 코드블록 제거 및 오류 시 raw 보존)

7) 데이터 저장(SQLite)
- DB 삽입: `src/modules/insert-database/index.ts`
  - 파일: `data/excavation.db` (없으면 생성)
  - 중복/누락 ID 정제, 참조 무결성 보조 매핑 수행 후 `excavated_sites`, `trenches`, `features`, `artifacts`에 삽입

8) 결과 파일(디버깅/기록)
- `public/pdf-result/`에 중간/최종 산출물 JSON 저장
  - 예: `${reportId}.json`, `${reportId}-db-*.json`

9) 질의응답(LLM + 사전)
- API: `POST /api/chat` → DB 내용을 바탕으로 답변, 필요 시 한국 고고학 사전(임베딩 검색) 보조
  - 구현: `src/app/api/chat/route.ts`
  - 사전 검색: `src/libs/glossarySearchEngine.ts`(임베딩: `data/glossary-embeddings.json`)

---

## 환경 변수(.env.local)
- `OPENAI_API_KEY`: OpenAI API 키(필수)
  - 발급 가이드: [OpenAI API 키 발급 가이드](./docs/openai-api-key.md)
  - 중요: API 키 관리와 사용량/비용 관리는 실행자 본인의 책임이며, 저장소 소유자는 책임지지 않습니다.
- `.env.local.example`를 참고하여 `.env.local` 파일을 생성하세요. 민감 정보는 공개 저장소에 커밋하지 마세요.

## 데이터/파일 경로
- 업로드된 PDF: `uploads/` (임시 저장)
- 디버그/결과 JSON: `public/pdf-result/`
- SQLite DB: `data/excavation.db`
- 사전 임베딩: `data/glossary-embeddings.json`(preinstall 시 자동 다운로드)

## 실행 비용/보안 관련 주의사항
- 과금: LLM 호출량이 많아질수록 비용이 급증합니다. 테스트 용도로만 제한적으로 실행하세요.
- 보안: 종속성 이슈로 인한 취약 가능성이 있습니다. 외부 서비스 배포 금지, 로컬 환경에서만 실행하세요.

## 의존성 스냅샷 및 호환성
- 본 저장소에는 논문 투고 시점의 종속성 스냅샷이 포함되어 있습니다:
  - `package.snapshot.json`, `package-lock.snapshot.json`
- 현재 `package.json`의 버전은 최소한의 패치 업데이트가 반영될 수 있으며, 스냅샷은 재현성 참고용으로 제공됩니다. 환경에 따라 설치/실행 결과가 달라질 수 있습니다.

## 알려진 제약/한계
- 이미지 기반(스캔) PDF 중 텍스트 추출이 불가한 경우는 지원하지 않습니다.
- 보고서 형식 편차가 크면 추출 품질이 저하될 수 있습니다.
- LLM 응답은 확률적이며, 일부 필드 추출이 누락되거나 오탐이 있을 수 있습니다.
- 프론트엔드 구조는 실험적이며, 정교한 설계/패턴을 따르지 않습니다.

## 라이선스
- MIT License(저장소 루트의 LICENSE 참조)
- 단, 본 저장소의 목적은 학술적 투명성 및 연구 기록 공개입니다. 실전/운영 환경 적용은 권장하지 않습니다.
