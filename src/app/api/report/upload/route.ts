import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 임시 저장 디렉토리
const UPLOAD_DIR = join(process.cwd(), 'uploads');

// 디렉토리가 없으면 생성
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    // formData를 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    // 파일 유형 확인
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일 크기 확인 (500MB 제한)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: '500MB 이하의 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일 저장을 위한 고유 ID 생성
    const reportId = `report-${Date.now()}`;
    const fileName = `${reportId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // 파일 바이트 배열로 변환
    const fileBuffer = await file.arrayBuffer();

    // 파일 저장
    await writeFile(filePath, Buffer.from(fileBuffer));

    // 성공 응답
    return NextResponse.json({
      success: true,
      reportId,
      url: `/uploads/${fileName}`,
      message: '파일이 성공적으로 업로드되었습니다.',
    });
  } catch (error) {
    console.error('파일 업로드 중 오류:', error);
    return NextResponse.json({ error: '파일 업로드 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false, // 파일 업로드를 위해 기본 bodyParser 비활성화
  },
};
