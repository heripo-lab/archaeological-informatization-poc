/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const https = require('https');

const URL = 'https://files.heripo.com/archaelogical-informatization-poc/glossary-embeddings.json';
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DEST_PATH = path.join(DATA_DIR, 'glossary-embeddings.json');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadWithProgress(url, destPath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destPath);
    let received = 0;
    let total = 0;
    let lastPrintedAt = 0;

    const req = https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirects
        res.resume();
        return resolve(downloadWithProgress(res.headers.location, destPath));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} 받음`));
      }

      total = Number(res.headers['content-length'] || 0);

      process.stdout.write(`다운로드 시작: ${url}\n`);
      process.stdout.write(`저장 위치: ${destPath}\n`);
      if (total) {
        process.stdout.write(`총 용량: ${formatBytes(total)}\n`);
      }

      res.on('data', chunk => {
        received += chunk.length;

        // 진행률 바 출력(100ms 간격)
        const now = Date.now();
        if (now - lastPrintedAt > 100) {
          lastPrintedAt = now;
          if (total > 0) {
            const percent = (received / total) * 100;
            const barWidth = 30;
            const filled = Math.floor((percent / 100) * barWidth);
            const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));
            const line = `\r[${bar}] ${percent.toFixed(1)}% (${formatBytes(received)}/${formatBytes(total)})`;
            process.stdout.write(line);
          } else {
            const line = `\r수신: ${formatBytes(received)} (총 용량 정보를 가져올 수 없음)`;
            process.stdout.write(line);
          }
        }
      });

      res.on('end', () => {
        if (total > 0 && received < total) {
          process.stdout.write('\n경고: 조기 종료 감지. 파일이 손상되었을 수 있습니다.\n');
        } else {
          process.stdout.write('\n다운로드 완료.\n');
        }
        resolve();
      });

      res.on('error', err => {
        reject(err);
      });

      res.pipe(fileStream);
    });

    req.on('error', err => {
      reject(err);
    });

    fileStream.on('finish', () => {
      fileStream.close();
    });
  });
}

(async () => {
  try {
    ensureDir(DATA_DIR);

    // 이미 파일이 있고 사이즈가 충분하면 스킵
    if (fs.existsSync(DEST_PATH)) {
      const stat = fs.statSync(DEST_PATH);
      if (stat.size > 100 * 1024 * 1024) {
        console.log(`이미 존재: ${DEST_PATH} (${formatBytes(stat.size)}). 스킵합니다.`);
        process.exit(0);
      } else {
        console.log('기존 파일이 너무 작아 재다운로드합니다.');
        try {
          fs.unlinkSync(DEST_PATH);
        } catch {}
      }
    }

    await downloadWithProgress(URL, DEST_PATH);
  } catch (e) {
    console.error('다운로드 실패:', e.message || e);
    process.exit(1);
  }
})();
