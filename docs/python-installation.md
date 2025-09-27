# Python 설치 가이드 (GUI, OS별)

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

본 프로젝트는 로컬에서 Python을 사용합니다. 아래 안내는 명령줄 설치(Homebrew/apt 등) 대신 공식 인스톨러나 운영체제 앱 스토어 같은 GUI 중심 경로를 안내합니다.

권장 사양
- 권장 버전: Python 3.10 이상(3.12 권장)
- 패키지 관리자: pip(기본 포함), venv(가상환경) 사용

설치 후 확인(공통)
- 설치 완료 후 한 번은 버전을 확인하세요.
  - macOS/Linux: 터미널에서 `python3 --version`, `pip3 --version`
  - Windows: PowerShell에서 `python --version`, `pip --version`

1) macOS
A. python.org 인스톨러(권장)
- 공식 다운로드: https://www.python.org/downloads/macos/
- "macOS 64-bit universal2 installer"(.pkg) 다운로드
- .pkg 더블클릭 → 설치 마법사 지시에 따라 설치
- 설치가 끝나면 "Python Launcher" 앱과 IDLE가 함께 설치됩니다.

B. 문제 해결 팁
- PATH 인식이 되지 않을 때: 새 터미널을 열거나 재로그인하세요.
- 기존/시스템 Python과 혼재 시: 터미널에서는 `python3`, `pip3`로 접근하는 것이 일반적입니다.

2) Linux(데스크톱 배포판, GUI 선호)
A. 앱 스토어(소프트웨어 센터) 사용
- Ubuntu/Pop!_OS: "소프트웨어"(Software Center) 실행 → "Python 3" 검색 → 설치(또는 IDLE 포함 패키지 선택)
- Fedora: "GNOME Software" 실행 → "Python 3" 검색 → 설치
- Linux Mint: "소프트웨어 관리자"에서 "Python 3" 검색 → 설치

B. 참고 사항
- 대부분의 Linux에는 이미 Python 3가 포함되어 있습니다. 버전이 너무 낮으면 앱 스토어를 통해 최신 버전을 설치하세요. 앱 스토어에 최신이 없으면 CLI(pyenv/apt 등) 방식을 별도로 검토해야 합니다(본 문서 범위 밖).

가상환경(venv) 간단 안내
- 본 저장소는 `npm install` 시 자동으로 `.venv`를 생성하고 필요한 파이썬 패키지를 설치하는 스크립트를 포함하고 있습니다(scripts/setup-python-env.js).
- 직접 가상환경을 만들고 싶다면(선택):
  1) 터미널 열기 → 프로젝트 루트로 이동
  2) `python3 -m venv .venv` (Windows는 `python -m venv .venv`)
  3) 활성화: macOS/Linux `source .venv/bin/activate`, Windows PowerShell `.venv\Scripts\Activate.ps1`
  4) 비활성화: `deactivate`

자주 묻는 질문(FAQ)
- Q. macOS에서 Homebrew로 설치해도 되나요? → A. 가능하지만 본 프로젝트 문서는 GUI 우선 원칙을 따릅니다. 간단히 진행하려면 python.org 인스톨러(.pkg)를 권장합니다.
- Q. Python 2도 필요한가요? → A. 아닙니다. Python 3만 있으면 됩니다.
- Q. pip가 보이지 않아요. → A. 최신 python.org 인스톨러에는 pip가 포함됩니다. 터미널에서 `pip3 --version`(macOS/Linux) 또는 `pip --version`(Windows)으로 확인하세요.
