# 새이파리 육묘장 관리 (Windows 데스크톱 앱)

채소 모종 육묘장의 거래·재고·미수금·파종/출하 일정을 단일 PC에서 오프라인으로 관리하는 Electron 데스크톱 앱입니다. Claude 디자인 단계의 시안과 `육묘장_관리_프로그램_기획서.md` 문서를 그대로 구현했습니다.

## 주요 기능

- **거래 입력 + 거래명세서 출력** — 한글 초성 검색(`ㅊㅇㄱㅊ`), 부분 일치 검색, 즐겨찾는 품목, 거래 템플릿. A4 2부(보관용/고객용) 인쇄 미리보기.
- **거래처 관리** — 거래 이력, 미수금 명세, 거래처별 단가표(일반가/단골가/도매가), 수금 입력.
- **재고 / 품목 관리** — 안전재고 미달 경고, 신규 품목 등록·수정.
- **파종 / 출하 일정** — 캘린더·리스트 뷰, 출하 예정일 자동 계산(품종별 표준 육묘 기간).
- **매출 통계 + CSV 내보내기** — 품목/거래처/일별 매출, 전체 백업 JSON.
- **자동 백업** — 프로그램 시작 시 1회, 30일치 자동 보관.
- **완전 오프라인** — React, ReactDOM, Babel 모두 로컬 번들. 외부 통신 없음.

## 기술 스택

- **Electron 31** (Chromium 기반 데스크톱 셸)
- **React 18** (UMD 빌드, `src/vendor/`에 동봉)
- **@babel/standalone** (런타임 JSX 트랜스파일, `src/vendor/`에 동봉)
- **electron-builder** (Windows NSIS 인스톨러 + Portable EXE)
- **데이터 저장**: 사용자 폴더의 JSON 파일 (`%APPDATA%\새이파리 육묘장 관리\data\saeipari.json`)

## 개발 실행

```bash
npm install
npm start
```

## Windows 빌드

윈도우 PC에서:

```bash
npm install
npm run build:win        # NSIS 인스톨러(.exe) + 포터블 빌드 모두
npm run build:portable   # 포터블 EXE만 (설치 없이 실행)
```

산출물은 `dist/` 폴더에 생성됩니다.
- `새이파리-1.0.0-x64.exe` — 설치형
- `새이파리-1.0.0-portable.exe` — 포터블 (USB로 옮겨 실행 가능)

리눅스/macOS에서 윈도우용 빌드를 만들려면 [Wine과 Mono](https://www.electron.build/multi-platform-build)가 필요합니다.

## 데이터 파일 위치

- **데이터**: `%APPDATA%\새이파리 육묘장 관리\data\saeipari.json`
- **자동 백업**: `%APPDATA%\새이파리 육묘장 관리\backups\saeipari_YYYY-MM-DD.json` (30일치)
- 앱 메뉴 → 파일 → "데이터 폴더 열기" 로 바로 이동 가능.

## 단축키

| 단축키 | 동작 |
|---|---|
| Ctrl+N | 새 거래 입력 |
| Ctrl+P | 인쇄 |

## 사업장 정보 (시드)

- 상호: 새이파리 / 대표: 윤준수
- 사업자등록번호: 364-98-01268
- 주소: 전주시 덕진구 화전동 692-15
- 전화: 010-3433-3282 / 팩스: 0504-204-5632
- 농협 계좌: 352-1981-0292-63

설정 화면에서 첫 실행 시 시드 데이터가 자동으로 들어갑니다. 실제 거래처·품목 데이터로 교체해 사용하세요.

## 디렉터리 구조

```
.
├── main.js                  # Electron 메인 프로세스
├── preload.js               # contextBridge (IPC)
├── package.json             # electron-builder 설정 포함
├── src/
│   ├── index.html           # 렌더러 진입
│   ├── styles.css           # 디자인 시스템 (녹색/베이지)
│   ├── store.js             # 영속화 레이어
│   ├── seed.js              # 초기 시드 + 한글 초성 헬퍼
│   ├── icons.jsx            # Lucide 스타일 아이콘
│   ├── app.jsx              # 앱 셸·라우팅
│   ├── screens/             # 페이지별 화면 컴포넌트
│   └── vendor/              # React/ReactDOM/Babel UMD (오프라인용)
├── scripts/                 # 헤드리스 스모크 테스트
└── build/                   # electron-builder 리소스 (아이콘 등)
```
