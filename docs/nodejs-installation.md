# Node.js 설치 가이드 (GUI, OS별)

본 프로젝트는 LTS(Long Term Support) 버전의 Node.js 사용을 권장합니다. 아래 안내는 명령줄 도구(nvm 등) 대신 인스톨러(Installer)나 운영체제의 앱 스토어 같은 GUI 중심 경로를 안내합니다.

권장 사양
- 권장 버전: 최신 LTS (예: 20.x 또는 22.x의 LTS)
- 포함 구성: Node.js + npm(기본 포함)

설치 후 확인(공통)
- 설치 완료 후 한 번은 터미널/명령 프롬프트를 열어 버전을 확인하세요.
  - macOS/Linux: 터미널에서 `node -v`, `npm -v`
  - Windows: PowerShell 또는 명령 프롬프트에서 `node -v`, `npm -v`

1) macOS
A. 다운로드 및 설치
- 공식 사이트: https://nodejs.org/
- 상단의 LTS 버튼을 클릭 → "macOS 인스톨러(.pkg)" 다운로드
- 다운로드한 .pkg 파일 더블클릭 → 설치 마법사 지시에 따라 설치

B. 문제 해결 팁
- PATH 인식이 되지 않을 때: 설치 후 새 터미널을 열거나 재로그인하세요.
- Apple Silicon(M1/M2/M3)도 .pkg(Universal) 설치로 자동으로 대응됩니다.

2) Windows
A. 다운로드 및 설치
- 공식 사이트: https://nodejs.org/
- LTS → "Windows 인스톨러(.msi)" 다운로드
- .msi 더블클릭 → 설치 마법사 지시에 따라 설치
  - (선택) 설치 옵션에서 추가 구성요소 체크는 기본값 유지 권장

B. 문제 해결 팁
- 방화벽/보안 소프트웨어가 설치를 차단할 수 있으니, 관리자 권한으로 설치해 보세요.

3) Linux(데스크톱 배포판, GUI 선호)
A. 앱 스토어(소프트웨어 센터) 사용
- Ubuntu, Pop!_OS 등 GNOME 기반: "소프트웨어"(Software, Software Center) 앱 실행 → "Node.js" 또는 "Node.js LTS" 검색 → 설치
- Fedora: "GNOME Software"에서 동일하게 검색/설치
- Linux Mint: "소프트웨어 관리자"에서 검색/설치

B. 참고 사항
- 일부 배포판의 GUI 저장소에는 구버전이 등록되어 있을 수 있습니다. 본 프로젝트는 최신 LTS 권장이며, GUI 저장소 버전이 너무 오래된 경우에는 공식 사이트의 안내 또는 nvm 같은 도구(CLI)를 검토해야 합니다. 본 문서는 GUI 우선 원칙으로 구성되어 있으므로, CLI 도구 상세는 다루지 않습니다.

자주 묻는 질문(FAQ)
- Q. npm은 따로 설치해야 하나요? → A. 아닙니다. Node.js 설치에 기본 포함됩니다.
- Q. 버전이 너무 오래되었습니다. → A. 최신 LTS 재설치(덮어쓰기) 또는 OS 앱 스토어 업데이트를 진행하세요.
- Q. 여러 버전을 함께 쓰고 싶습니다. → A. GUI만으로는 제한적입니다. 이 경우에만 nvm(명령줄) 같은 버전 관리 도구를 고려하세요.
