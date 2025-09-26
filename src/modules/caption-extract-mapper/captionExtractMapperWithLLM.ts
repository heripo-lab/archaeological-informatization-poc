import { callOpenAI } from '@/libs/open-ai';
import { PDFCaption, PDFData, PDFDataWithCaption, PDFImageContentWithCaption } from '@/models/pdf.model';
import { CompletionToken } from '@/models/token.model';
import extractPureJSON from '@/utils/extract-pure-json';

const PAGE_CHUNK_SIZE = 10; // N페이지씩 처리

const captionExtractMapperWithLLM = async (pdfData: PDFData): Promise<PDFDataWithCaption> => {
  const chunkedResults: { src: string; caption: PDFCaption }[] = [];
  const consumeTokens: CompletionToken = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  // 페이지를 N페이지씩 나누어 처리
  const totalPages = Math.max(...pdfData.texts.map(({ page }) => page), ...pdfData.images.map(({ page }) => page));
  for (let startPage = 1; startPage <= totalPages; startPage += PAGE_CHUNK_SIZE) {
    console.log(`처리 페이지: ${startPage} ~ ${startPage + PAGE_CHUNK_SIZE - 1}`);

    const endPage = startPage + PAGE_CHUNK_SIZE - 1;

    const texts = pdfData.texts.filter(({ page }) => page >= startPage && page <= endPage);
    const images = pdfData.images.filter(({ page }) => page >= startPage && page <= endPage);

    if (images.length === 0) continue; // 이미지가 없으면 건너뜀

    const result = await callOpenAI(
      {
        system: `당신은 PDF에서 추출된 텍스트와 이미지를 바탕으로 캡션을 추출하여 맵핑하는 전문가입니다.

# 이미지 캡션 추출 및 매핑 작업

## ✅ 조건
1. 텍스트.page === 이미지.page (같은 페이지)
2. 텍스트.bbox.top > 이미지.bbox.bottom (텍스트가 이미지 아래에 위치)
3. 중심 좌표를 이용해 거리 계산 (유클리드 거리)하여 가장 가까운 항목 선택

## ✅ 캡션 형식 필터
- 텍스트는 반드시 아래 형식을 따를 경우에만 캡션으로 인정합니다:
  - "사진 1 ~", "도면 2 ~", "표 3 ~" 등
  - prefix: 사진, 도면, 표 등의 단어
  - num: 그 뒤의 숫자
  - text: 나머지 설명 문장

## ✅ 출력 형식
이미지 배열과 같은 순서를 유지하며, 다음 JSON 형태로 결과를 반환합니다.
\`\`\`json
[
  {
    "src": "이미지 경로",
    "caption": {
      "prefix": "사진",
      "num": 1,
      "text": "삼국시대 2호 구상유구 조사 중 전경(위가 남)"
    }
  },
  ...
]
\`\`\`

- JSON은 유효한 JSON이어야 하며, 주석이나 설명 없이 JSON 객체 하나만 반환해야 합니다. 어차피 파싱할 거니까 1줄로 출력하세요.`,
        user: `다음 텍스트 객체 배열과 이미지 객체 배열을 분석하고, 각 이미지에 맞는 캡션을 매핑해주세요.

## ✅ 텍스트 객체 배열
\`\`\`typescript
interface TextContent {
  text: string;
  page: number;
  bbox: {
    x0: number;
    top: number;
    x1: number;
    bottom: number;
  }
}
\`\`\`
${JSON.stringify(texts)}

## ✅ 이미지 객체 배열
\`\`\`typescript
interface ImageContent {
  src: string;
  page: number;
  bbox: {
    x0: number;
    top: number;
    x1: number;
    bottom: number;
  }
}
\`\`\`
${JSON.stringify(images)}`,
      },
      {
        model: 'gpt-4o',
        temperature: 0,
        presence_penalty: 0,
        frequency_penalty: 0,
      },
    );

    if (!result.content) {
      throw new Error('OpenAI API 호출 실패');
    }

    const parsedResult = extractPureJSON<{ src: string; caption: PDFCaption }[]>(result.content);
    chunkedResults.push(...parsedResult);

    if (result.usage) {
      console.log('usage', result.usage.prompt_tokens, result.usage.completion_tokens, result.usage.total_tokens);

      consumeTokens.promptTokens += result.usage.prompt_tokens;
      consumeTokens.completionTokens += result.usage.completion_tokens;
      consumeTokens.totalTokens += result.usage.total_tokens;
    }
  }

  console.log('소모된 토큰:', consumeTokens);

  // 결과 통합 - 올바른 타입으로 변환
  const imagesWithCaption: PDFImageContentWithCaption[] = pdfData.images.map(image => ({
    ...image,
    caption: chunkedResults.find(item => item.src === image.src)?.caption ?? null,
  }));

  return {
    texts: pdfData.texts,
    images: imagesWithCaption,
  };
};

export default captionExtractMapperWithLLM;
