// 리포트 정형화 처리 함수
import { PageType } from '@/models/pdf.model';
import captionExtractMapper from '@/modules/caption-extract-mapper';
import insertDatabase from '@/modules/insert-database';
import makeData from '@/modules/make-data';
import pdfProcess from '@/modules/pdf-process';
import rearrangeTextsByPage from '@/utils/rearrange-texts-by-page';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// 페이지 타입과 실제 첫 페이지 번호를 파라미터로 받도록 수정
const standardizeReport = async (
  reportId: string,
  filepath: string,
  pageType: PageType = PageType.ONE,
  realFirstPage: number = 0,
) => {
  const writeFilePromise = promisify(fs.writeFile);

  const startTime = Date.now();

  const pdfDataWithCaption = await (async () => {
    const startTimePdfProcess = Date.now();
    const pdfProcessResult = await pdfProcess(reportId, filepath);

    console.log(`PDF 데이터 추출 완료: ${(Date.now() - startTimePdfProcess) / 1000}초`);

    if (!pdfProcessResult.success) {
      throw new Error(`PDF 처리 실패: ${pdfProcessResult.message}`);
    }

    if (pdfProcessResult.data.texts.length === 0) {
      throw new Error('PDF 처리 실패: 텍스트가 없습니다. 이미지 형태의 PDF는 지원하지 않습니다.');
    }

    const startTimePdfDataWithCaption = Date.now();
    const pdfDataWithCaption = await captionExtractMapper(pdfProcessResult.data);

    console.log(`PDF 데이터 캡션 추출 완료: ${(Date.now() - startTimePdfDataWithCaption) / 1000}초`);

    // 결과를 public/pdf-result/{reportId}.json에 저장 -> TODO: S3에 저장하는 방식으로 바꿔야 한다. 사실상 이게 추출 원본이기 때문에 보관해야 한다.
    const resultFilePath = path.join(process.cwd(), `public/pdf-result/${reportId}.json`);
    await writeFilePromise(resultFilePath, JSON.stringify(pdfDataWithCaption, null, 2), 'utf-8');
    console.log(`PDF 데이터 캡션 추출 결과 저장 완료: ${resultFilePath}`);

    return pdfDataWithCaption;
  })();

  const startTimeMakeData = Date.now();

  const texts = rearrangeTextsByPage(pdfDataWithCaption.texts);
  const images = pdfDataWithCaption.images;

  // 파라미터로 받은 pageType과 realFirstPage 사용
  const data = await makeData(reportId, texts, images, pageType, realFirstPage);

  console.log(`정보 추출 및 구조화 완료: ${(Date.now() - startTimeMakeData) / 1000}초`);

  console.log('consumeTokens', data.consumeTokens);

  // 디버깅을 위해 결과를 파일로 저장
  await writeFilePromise(
    path.join(process.cwd(), `public/pdf-result/${reportId}-db-excavatedSite.json`),
    JSON.stringify(data.result.excavatedSite, null, 2),
    'utf-8',
  );
  await writeFilePromise(
    path.join(process.cwd(), `public/pdf-result/${reportId}-db-trenches.json`),
    JSON.stringify(data.result.trenches, null, 2),
    'utf-8',
  );
  await writeFilePromise(
    path.join(process.cwd(), `public/pdf-result/${reportId}-db-features.json`),
    JSON.stringify(data.result.features, null, 2),
    'utf-8',
  );
  await writeFilePromise(
    path.join(process.cwd(), `public/pdf-result/${reportId}-db-artifacts.json`),
    JSON.stringify(data.result.artifacts, null, 2),
    'utf-8',
  );

  insertDatabase(data.result);

  return {
    reportId,
    status: 'completed',
    processingTime: `${(Date.now() - startTime) / 1000}초`,
    standardizedAt: new Date().toISOString(),
    pageType,
    realFirstPage,
  };
};

export default standardizeReport;
