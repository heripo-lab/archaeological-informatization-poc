// 리포트 정형화 상태 조회 함수
const getStandardizationStatus = async (reportId: string) => {
  // 임시 구현, 실제 구현에서는 데이터베이스에서 상태를 조회해야 함
  return {
    reportId,
    status: 'completed',
    progress: 100,
    standardizedAt: new Date().toISOString(),
  };
};

export default getStandardizationStatus;
