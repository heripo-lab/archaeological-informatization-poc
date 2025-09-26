import { PDFData, PDFDataWithCaption } from '@/models/pdf.model';
import captionExtractMapperWithLLM from './captionExtractMapperWithLLM';
import captionExtractMapperWithRule from './captionExtractMapperWithRule';

const captionExtractMapper = async (pdfData: PDFData, useLLM = false): Promise<PDFDataWithCaption> => {
  if (useLLM) {
    return captionExtractMapperWithLLM(pdfData);
  }

  // LLM 사용 안 함 - 규칙 기반 접근
  return captionExtractMapperWithRule(pdfData);
};

export default captionExtractMapper;
