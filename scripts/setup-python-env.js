/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const venvDir = path.join(projectRoot, '.venv');
const isWindows = process.platform === 'win32';

// requirements 파일 경로 우선순위
const candidateRequirements = [
  path.join(projectRoot, 'src', 'modules', 'pdf-process', 'requirements.txt'),
  path.join(projectRoot, 'requirements.txt'),
];

function run(cmd, opts = {}) {
  try {
    execSync(cmd, {
      stdio: 'inherit',
      ...opts,
    });
    return true;
  } catch (e) {
    return false;
  }
}

function whichPython() {
  // macOS/Linux는 python3 우선
  if (!isWindows) {
    const candidates = ['python3', 'python'];
    for (const c of candidates) {
      const r = spawnSync('which', [c], { encoding: 'utf8' });
      if (r.status === 0 && r.stdout.trim()) return c;
    }
    return null;
  }

  // Windows는 py launcher → python → python3 순
  const candidates = [
    { cmd: 'py', args: ['-V'] },
    { cmd: 'python', args: ['-V'] },
    { cmd: 'python3', args: ['-V'] },
  ];
  for (const { cmd, args } of candidates) {
    const r = spawnSync(cmd, args, { encoding: 'utf8' });
    if (r.status === 0) return cmd;
  }
  return null;
}

function getVenvPythonPath() {
  return isWindows ? path.join(venvDir, 'Scripts', 'python.exe') : path.join(venvDir, 'bin', 'python');
}

function ensureRequirementsFile() {
  let reqPath = candidateRequirements.find(p => fs.existsSync(p));
  if (!reqPath) {
    // 기본 requirements 생성
    reqPath = candidateRequirements[0];
    const dir = path.dirname(reqPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      reqPath,
      [
        // pdfplumber가 pillow, pdfminer.six 등에 의존
        'pdfplumber>=0.11.0',
        'pillow>=10.0.0',
      ].join('\n'),
      'utf8',
    );
    console.log(`[setup] requirements.txt 생성: ${path.relative(projectRoot, reqPath)}`);
  }
  return reqPath;
}

function main() {
  console.log('[setup] Python 환경 준비 시작');

  const py = whichPython();
  if (!py) {
    if (isWindows) {
      console.error('[setup] Windows에서 Python이 감지되지 않았습니다.');
      console.error('다음 중 하나를 설치 후 다시 시도하세요:');
      console.error('- Microsoft Store에서 Python 설치');
      console.error('- https://www.python.org/downloads/ 에서 설치');
      console.error('- 설치 후 "py" 또는 "python" 명령이 PATH에 포함되어야 합니다.');
      process.exit(1);
    } else {
      console.error(
        '[setup] python3를 찾을 수 없습니다. macOS 기본 python3가 없다면 Xcode Command Line Tools 또는 Homebrew로 설치하세요: brew install python',
      );
      process.exit(1);
    }
  }

  const venvPython = getVenvPythonPath();
  const venvExists = fs.existsSync(venvPython);

  if (!venvExists) {
    console.log('[setup] 가상환경(.venv) 생성');
    const createCmd = isWindows ? `${py} -m venv .venv` : `${py} -m venv .venv`;
    if (!run(createCmd, { cwd: projectRoot })) {
      console.error('[setup] 가상환경 생성 실패');
      process.exit(1);
    }
  } else {
    console.log('[setup] 가상환경(.venv) 이미 존재');
  }

  // pip 업그레이드
  console.log('[setup] pip 업그레이드');
  if (!run(`"${venvPython}" -m pip install --upgrade pip`, { cwd: projectRoot })) {
    console.error('[setup] pip 업그레이드 실패');
    process.exit(1);
  }

  // requirements 설치
  const reqPath = ensureRequirementsFile();
  console.log(`[setup] 의존성 설치 (${path.relative(projectRoot, reqPath)})`);
  if (
    !run(`"${venvPython}" -m pip install -r "${reqPath}"`, {
      cwd: projectRoot,
    })
  ) {
    console.error('[setup] Python 의존성 설치 실패');
    process.exit(1);
  }

  // mac의 경우 python alias 안내(옵션)
  if (!isWindows) {
    // 별도 alias 필요 없이 런타임에서 .venv 경로를 직접 사용하므로 안내만 출력
    console.log('[setup] macOS: 런타임에서 .venv/bin/python을 사용합니다(별도 alias 불필요).');
  } else {
    console.log('[setup] Windows: 런타임에서 .venv\\Scripts\\python.exe를 사용합니다.');
  }

  console.log('[setup] Python 환경 준비 완료');
}

main();
