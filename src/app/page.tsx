'use client';

import styles from './page.module.css';
import { uploadFile } from '@/utils/fileUpload';
import { ChangeEvent, FormEvent, useState } from 'react';
import { PageType } from '@/models/pdf.model';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [pageType, setPageType] = useState<PageType>(PageType.ONE);
  const [realFirstPage, setRealFirstPage] = useState<number>(0);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    // 파일 유효성 검사
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 제한 (500MB)
    if (selectedFile.size > 500 * 1024 * 1024) {
      setError('500MB 이하의 파일만 업로드 가능합니다.');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      // 1. 추상화된 파일 업로드 함수 사용
      const uploadResult = await uploadFile(file);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '파일 업로드에 실패했습니다.');
      }

      // 2. 리포트 정형화 API 호출 - pageType과 realFirstPage 추가
      const response = await fetch('/api/report/standardize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: uploadResult.reportId,
          pageType: pageType,
          realFirstPage: realFirstPage,
          options: {
            filename: uploadResult.filename,
            filesize: uploadResult.filesize,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '서버 오류가 발생했습니다.');
      }

      const data = await response.json();

      // 3. 결과 표시
      setResult(data);
      console.log('처리 결과:', data);

      // 4. 필요한 경우 처리 상태를 폴링으로 확인
      if (data.data.status === 'processing') {
        pollProcessingStatus(uploadResult.reportId);
      }
    } catch (err: any) {
      setError(err.message || '파일 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('처리 오류:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // 처리 상태를 주기적으로 확인하는 함수
  const pollProcessingStatus = async (reportId: string) => {
    try {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/report/standardize?reportId=${reportId}`);

        if (response.ok) {
          const data = await response.json();

          setResult(data);

          // 처리가 완료되면 폴링 중지
          if (data.data.status === 'completed') {
            clearInterval(interval);
          }
        }
      }, 3000); // 3초마다 상태 확인

      // 5분 후에 폴링 중지 (타임아웃)
      setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
    } catch (error) {
      console.error('상태 확인 중 오류:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        대형 언어 모델(LLM)을 활용한 고고학 정보화 연구
        <br />- 발굴조사보고서의 메타데이터 자동 추출 파이프라인 개념 검증-
      </h1>

      <p className={styles.description}>{'PDF 형태의 발굴조사보고서를 첨부하여 "실행" 버튼을 눌러주세요.'}</p>

      <div className={styles.viewButtonContainer}>
        <button className={styles.viewButton} onClick={() => window.open('/view', '_blank', 'noopener,noreferrer')}>
          결과 보기
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fileInputContainer}>
          <input
            type="file"
            id="pdf-upload"
            accept="application/pdf"
            onChange={handleFileChange}
            className={styles.fileInput}
            disabled={isUploading}
          />
          <label htmlFor="pdf-upload" className={styles.fileInputLabel}>
            {file ? file.name : '파일 선택'}
          </label>
        </div>

        {/* 페이지 타입 선택 */}
        <div className={styles.configGroup}>
          <label className={styles.configLabel}>PDF 페이지 타입:</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value={PageType.ONE}
                checked={pageType === PageType.ONE}
                onChange={() => setPageType(PageType.ONE)}
                disabled={isUploading}
              />
              1페이지 (PDF 한 장에 책 1페이지)
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value={PageType.TWO}
                checked={pageType === PageType.TWO}
                onChange={() => setPageType(PageType.TWO)}
                disabled={isUploading}
              />
              2페이지 (PDF 한 장에 책 2페이지)
            </label>
          </div>
        </div>

        {/* 실제 첫 페이지 설정 */}
        <div className={styles.configGroup}>
          <label htmlFor="real-first-page" className={styles.configLabel}>
            본문 첫 페이지(책자에 표기된 1페이지가 PDF 파일의 몇페이지?, PDF 첫페이지의 기준을 0으로 본다):
          </label>
          <input
            type="number"
            id="real-first-page"
            min="0"
            value={realFirstPage}
            onChange={e => setRealFirstPage(Number(e.target.value))}
            className={styles.numberInput}
            disabled={isUploading}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitButton} disabled={!file || isUploading}>
          {isUploading ? '처리 중...' : '실행'}
        </button>
      </form>

      {/* 처리 결과 표시 */}
      {result && (
        <div className={styles.result}>
          <h2>처리 결과</h2>
          <div>
            <p>상태: {result.data.status}</p>
            {result.data.progress !== undefined && <p>진행률: {result.data.progress}%</p>}
            {result.data.processingTime && <p>처리 시간: {result.data.processingTime}</p>}
            {result.message && <p>메시지: {result.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
