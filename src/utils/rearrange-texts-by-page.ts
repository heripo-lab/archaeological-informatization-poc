import { PDFTextByPage, PDFTextContent } from '@/models/pdf.model';

const rearrangeTextsByPage = (texts: PDFTextContent[]): PDFTextByPage[] => {
  return texts.reduce<PDFTextByPage[]>((result, { page, text }, index) => {
    if (index === 0 || result[result.length - 1].page !== page) {
      result.push({ page, text });
    }

    const lastText = result[result.length - 1];

    if (lastText.page === page) {
      lastText.text += `\n${text}`;
    } else {
      result.push({ page, text });
    }

    return result;
  }, []);
};

export default rearrangeTextsByPage;
