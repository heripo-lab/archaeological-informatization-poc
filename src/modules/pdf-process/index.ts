import { PDFData } from '@/models/pdf.model';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

type ResultPDFProcess =
  | {
      success: true;
      data: PDFData;
    }
  | {
      success: false;
      message: string;
    };

const pdfProcess = async (reportId: string, filepath: string): Promise<ResultPDFProcess> => {
  console.log('PDF 파일 처리 시작');

  // return getTempResult();
  return callPythonApi(reportId, filepath);
};

export default pdfProcess;

// Python 스크립트를 호출하여 PDF 처리 결과를 반환
const callPythonApi = async (reportId: string, filepath: string): Promise<ResultPDFProcess> => {
  try {
    const execPromise = promisify(exec);

    const pythonPath = path.join(process.cwd(), '.venv/bin/python');

    // PDF 처리 Python 스크립트 경로 (상대 경로로 설정)
    const scriptPath = path.join(process.cwd(), 'src/modules/pdf-process/pdf-extractor.py');

    console.log(`명령 ${scriptPath} "${filepath}" "${reportId}"`);

    // exec 명령에 maxBuffer 옵션 추가
    const { stdout, stderr } = await execPromise(`${pythonPath} ${scriptPath} "${filepath}" "${reportId}"`, {
      maxBuffer: 1024 * 1024 * 1000, // 1000MB로 버퍼 크기 증가
    });

    if (stderr && !stderr.includes('CropBox missing from /Page, defaulting to MediaBox')) {
      console.error('Python 스크립트 실행 오류:', stderr);

      return {
        success: false,
        message: `Python 스크립트 실행 중 오류가 발생했습니다: ${stderr}`,
      };
    }

    // Python 스크립트의 출력(JSON)을 파싱
    return JSON.parse(stdout) as ResultPDFProcess;
  } catch (error) {
    console.error('PDF 처리 오류:', error);

    return {
      success: false,
      message: `PDF 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
