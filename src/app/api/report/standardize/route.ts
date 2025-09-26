import getStandardizationStatus from '@/app/api/report/standardize/get-standardization-status';
import standardizeReport from '@/app/api/report/standardize/standardize-report';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { PageType } from '@/models/pdf.model';

// 업로드 디렉토리 경로
const UPLOAD_DIR = join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 요청 검증
    if (!body.reportId) {
      return NextResponse.json({ error: '리포트 ID가 필요합니다.' }, { status: 400 });
    }

    // 페이지 타입과 실제 첫 페이지 값 확인
    const pageType = body.pageType || PageType.ONE; // 기본값 설정
    const realFirstPage = typeof body.realFirstPage === 'number' ? body.realFirstPage : 0; // 기본값 설정

    // 리포트 ID로 업로드된 파일 확인 (옵션)
    const filePattern = new RegExp(`^${body.reportId}-.*\\.pdf$`);
    const uploadFiles = existsSync(UPLOAD_DIR)
      ? readdirSync(UPLOAD_DIR).filter((file: string) => filePattern.test(file))
      : [];

    if (uploadFiles.length === 0) {
      console.error(`경고: reportId ${body.reportId}에 해당하는 업로드된 파일을 찾을 수 없습니다.`);
      return NextResponse.json({ error: '업로드된 파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    const filepath = join(UPLOAD_DIR, uploadFiles[0]);

    // 리포트 정형화 처리 로직에 pageType과 realFirstPage 전달
    const result = await standardizeReport(body.reportId, filepath, pageType, realFirstPage);

    return NextResponse.json({
      success: true,
      message: '리포트 정형화가 완료되었습니다.',
      data: result,
    });
  } catch (error) {
    console.error('리포트 정형화 중 오류 발생:', error);
    return NextResponse.json({ error: '리포트 정형화 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reportId = searchParams.get('reportId');

  if (!reportId) {
    return NextResponse.json({ error: '리포트 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    // 리포트 정형화 상태 조회 로직
    const status = await getStandardizationStatus(reportId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('리포트 정형화 상태 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '리포트 정형화 상태 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
