/**
 * 파일 업로드 처리를 위한 유틸리티 함수
 * PoC 편의를 위해 로컬 서버로 업로드하는 방식
 */

/**
 * 파일 업로드 결과 인터페이스
 */
export interface FileUploadResult {
  success: boolean;
  reportId: string;
  filename: string;
  filesize: number;
  uploadedUrl?: string;
  error?: string;
}

/**
 * 파일 업로드 함수
 *
 * @param file 업로드할 파일 객체
 * @returns 업로드 결과 (성공 시 reportId 포함)
 */
export async function uploadFile(file: File): Promise<FileUploadResult> {
  try {
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('file', file);

    // API 엔드포인트로 파일 업로드
    const response = await fetch('/api/report/upload', {
      method: 'POST',
      body: formData,
    });

    // 응답 확인
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '파일 업로드에 실패했습니다.');
    }

    // 응답 데이터 파싱
    const data = await response.json();

    return {
      success: true,
      reportId: data.reportId,
      filename: file.name,
      filesize: file.size,
      uploadedUrl: data.url,
    };
  } catch (error: any) {
    console.error('파일 업로드 중 오류 발생:', error);
    return {
      success: false,
      reportId: '',
      filename: file.name,
      filesize: file.size,
      error: error.message || '파일 업로드 중 오류가 발생했습니다.',
    };
  }
}
