# Investment Starter

한국/미국 주식 포트폴리오를 관리하고 분석하는 웹 애플리케이션입니다. 섹터별 목표 비중 설정, 실시간 시세 조회, 리밸런싱 추천, 수익률 분석, 관심종목 모니터링 등의 기능을 제공합니다.

## 주요 기능

### 포트폴리오 관리
- 총 투자 예산(KRW) 설정 및 섹터별/종목별 목표 비중 배분
- 매수·매도 거래 기록 관리 (날짜, 수량, 단가, 통화)
- KRX(한국) 및 NYSE/NASDAQ(미국) 시장 지원
- USD/KRW 환율 자동 반영

### 시각화 및 분석
- 자산 트리맵 (섹터·종목별 비중 시각화)
- 섹터 도넛 차트
- 목표 vs 실제 비중 비교 바 차트
- 섹터/종목별 수익률 바 차트
- 비중 이탈 감지 및 알림

### 리밸런싱
- 목표 비중 대비 현재 시장 비중 비교
- 매수/매도 추천 및 예상 거래 금액 산출
- 매도 시 실현 손익 계산

### 수익률
- 전체 포트폴리오 손익 및 수익률
- 종목별·섹터별 수익 분석
- 최고/최저 수익 종목 표시

### 관심종목 (Watchlist)
- 매수 전 종목 모니터링
- 매수 희망 구간(상한/하한) 설정
- 진입 가능 상태 실시간 표시 (진입 OK / 대기 / 하회 / 미설정)

### 데이터 관리
- JSON 형식 포트폴리오 백업 및 복원
- 종목 디렉토리에서 종목 일괄 추가
- IndexedDB 기반 로컬 저장 (localStorage 자동 마이그레이션)

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite |
| 스타일링 | Tailwind CSS 4 |
| 상태관리 | Zustand |
| 차트 | Recharts |
| 저장소 | IndexedDB (idb-keyval) |
| 라우팅 | React Router DOM 7 |
| 배포 | Vercel (Serverless Functions) |
| 테스트 | Vitest |
| 린트 | ESLint + TypeScript ESLint |

## 프로젝트 구조

```
├── api/
│   └── yahoo.ts              # Yahoo Finance 프록시 (Vercel Serverless)
├── src/
│   ├── components/            # UI 컴포넌트
│   │   ├── AssetTreemap.tsx          # 자산 트리맵 차트
│   │   ├── SectorDonutChart.tsx      # 섹터 도넛 차트
│   │   ├── WeightCompareBarChart.tsx # 비중 비교 차트
│   │   ├── SectorReturnBarChart.tsx  # 섹터 수익률 차트
│   │   ├── StockReturnBarChart.tsx   # 종목 수익률 차트
│   │   ├── SectorManager.tsx         # 섹터 관리
│   │   ├── CompanyManager.tsx        # 종목 관리
│   │   ├── PurchaseForm.tsx          # 매수/매도 입력
│   │   ├── WatchlistForm.tsx         # 관심종목 추가
│   │   ├── WatchlistItemRow.tsx      # 관심종목 행
│   │   ├── BudgetForm.tsx            # 예산 설정
│   │   ├── WeightTable.tsx           # 비중 테이블
│   │   ├── DataBackup.tsx            # 데이터 백업/복원
│   │   ├── DeviationBadge.tsx        # 비중 이탈 뱃지
│   │   ├── EntryZoneBadge.tsx        # 진입 구간 뱃지
│   │   └── Layout.tsx                # 레이아웃 (하단 탭 네비게이션)
│   ├── pages/                 # 페이지
│   │   ├── HomePage.tsx              # 대시보드
│   │   ├── SettingsPage.tsx          # 설정 (예산, 섹터, 종목, 백업)
│   │   ├── StockDetailPage.tsx       # 종목 상세 및 거래 내역
│   │   ├── RebalancePage.tsx         # 리밸런싱
│   │   ├── ReturnsPage.tsx           # 수익률 분석
│   │   ├── StockDirectoryPage.tsx    # 종목 디렉토리
│   │   └── WatchlistPage.tsx         # 관심종목
│   ├── stores/                # 상태 관리 (Zustand)
│   │   ├── portfolioStore.ts         # 포트폴리오 (섹터, 종목, 거래, 예산)
│   │   ├── marketStore.ts            # 시세 및 환율
│   │   ├── watchlistStore.ts         # 관심종목
│   │   └── stockDirectoryStore.ts    # 종목 디렉토리
│   ├── utils/                 # 유틸리티
│   │   ├── calc.ts                   # 비중·수익률·리밸런싱 계산
│   │   ├── api.ts                    # Yahoo Finance API 호출 및 환율
│   │   └── storage.ts                # IndexedDB 저장소 어댑터
│   ├── data/
│   │   └── stocks.ts                 # 기본 종목 데이터 (37종목)
│   └── types/
│       └── portfolio.ts              # TypeScript 타입 정의
├── docs/
│   └── prd3.md                # 관심종목 기능 PRD
├── vercel.json                # Vercel 배포 설정
└── vite.config.ts             # Vite 빌드 설정
```

## 페이지 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | HomePage | 대시보드 (예산, 환율, 포트폴리오 요약) |
| `/settings` | SettingsPage | 예산·섹터·종목 설정, 백업 |
| `/stock/:companyId` | StockDetailPage | 종목 상세 및 거래 내역 |
| `/rebalance` | RebalancePage | 리밸런싱 추천 |
| `/returns` | ReturnsPage | 수익률 분석 |
| `/directory` | StockDirectoryPage | 종목 디렉토리 |
| `/watchlist` | WatchlistPage | 관심종목 모니터링 |

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 테스트

```bash
npm test
```

### 배포

Vercel에 연결하여 자동 배포됩니다. `vercel.json`에 SPA 라우팅 및 Yahoo Finance API 프록시 설정이 포함되어 있습니다.

## API

Yahoo Finance API를 Vercel Serverless Function을 통해 프록시하여 실시간 주가 및 환율 데이터를 조회합니다.

- **엔드포인트**: `/api/yahoo/*`
- **캐시**: 60초
- **지원 시장**: KRX (.KS), NYSE, NASDAQ
- **환율 폴백**: open.er-api.com, fawazahmed0 CDN
