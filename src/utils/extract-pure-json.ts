import fs from 'fs';
import path from 'path';

const extractPureJSON = <T = { [key: string]: unknown }>(raw: string): T => {
  try {
    return JSON.parse(
      raw
        .replace(/^```(json)?/gm, '') // 코드블록 시작 제거
        .replace(/```$/gm, '') // 코드블록 종료 제거
        .trim(),
    ) as T;
  } catch (error: any) {
    fs.writeFileSync(path.join(process.cwd(), `public/pdf-result/error.json`), raw, 'utf-8');

    throw new Error(error);
  }
};

export default extractPureJSON;
