# Node.js 설치 가이드 (GUI, OS별)

중요: 운영체제 지원 안내
- 본 PoC는 macOS와 Linux에서의 실행만을 공식적으로 지원합니다.
- Windows 네이티브 환경(Windows PowerShell/명령 프롬프트에서 직접 실행)은 지원하지 않습니다. Windows 사용자는 WSL(Windows Subsystem for Linux)에서 Ubuntu 등 Linux 배포판을 설치한 뒤, WSL 터미널에서 프로젝트를 실행해 주세요.
  - WSL이란? Windows에서 가벼운 Linux 환경을 구동할 수 있게 하는 기능입니다. 별도 가상머신 UI 없이 Windows와 나란히 Linux를 사용할 수 있습니다.
  - WSL 설치 가이드: https://learn.microsoft.com/ko-kr/windows/wsl/install
  - WSL 소개: https://learn.microsoft.com/ko-kr/windows/wsl/about
- 왜 Windows 네이티브를 지원하지 않나요?
  - 본 저장소는 개인 논문 연구용으로 macOS 기반 환경에 맞추어 만들어졌습니다.
  - 오픈소스 공개는 연구 투명성 공유가 목적이며, 전문 개발지식이 없는 사용자에게 실행을 권하지 않습니다. 공개 준비 과정에서도 추가 호환성 확보(특히 Windows 네이티브)는 진행하지 않았습니다.
  - Docker 제공도 고려했으나, Windows 사용자에게는 오히려 진입 장벽이 될 수 있어 제공하지 않습니다.
- 그래도 꼭 실행해 보고 싶으시다면: kimhongyeon89@gmail.com 으로 연락 주세요.

---

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

2) Linux(데스크톱 배포판, GUI 선호)
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
