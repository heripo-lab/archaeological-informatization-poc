import { callOpenAI } from '@/libs/open-ai';
import { ExcavatedSite } from '@/models/db.model';
import { PageType, PDFImageContentWithDetailCaption, PDFTextByPage } from '@/models/pdf.model';
import { CompletionToken } from '@/models/token.model';
import extractPureJSON from '@/utils/extract-pure-json';
import { v4 as uuidv4 } from 'uuid';
import db from '@/models/db.json';

const PAGE_CHUNK_SIZE = 20; // N페이지씩 처리

const makeExcavatedSiteData = async (
  reportId: string,
  texts: PDFTextByPage[],
  images: PDFImageContentWithDetailCaption[],
  pageType: PageType,
  realFirstPage: number,
) => {
  const excavatedSiteTableDescription = db.tables.find(table => table.table_name === 'excavated_site')!;

  const consumeTokens: CompletionToken = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  let chunkedExcavatedSite: Partial<ExcavatedSite> = {
    id: uuidv4(),
    report_id: reportId,
    images: [],
  };

  let mainContentStartPage: number | null = null;
  let mainContentNextChapterStartPage: number | null = null;

  for (let startPage = 1; startPage <= texts.length; startPage += PAGE_CHUNK_SIZE) {
    console.log(`makeExcavatedSiteData 처리 페이지: ${startPage} ~ ${startPage + PAGE_CHUNK_SIZE - 1}`);

    const endPage = startPage + PAGE_CHUNK_SIZE - 1;
    const inputTexts = texts.filter(({ page }) => page >= startPage && page <= endPage);

    const currentAllText = inputTexts.map(({ text }) => text).join('\n');

    let currentImages = images.filter(image => !!image.caption?.str && currentAllText.includes(image.caption.str));

    if (currentImages.length / images.length > 0.3) {
      currentImages = [];
    }

    const result = await callOpenAI(
      {
        system: `당신은 PDF에서 추출된 비정형 텍스트를 분석하여 고고학 발굴조사 보고서의 개요 정보를 구조화하는 전문가입니다.
주어진 테이블 스키마에 맞춰 유적 데이터를 정리하고, 불확실하거나 짤린 정보는 판단 기준에 따라 신중하게 처리해야 합니다.
출력은 유효한 JSON만 포함해야 하며, 주석이나 설명 없이 JSON 객체 하나만 반환해야 합니다.
없는 내용을 만들지 마세요. 모두 제시한 정보에 기반해야 합니다.

# excavated_site 테이블 데이터 추출

## 🎯 목적
비정형 조사 보고서 텍스트로부터 발굴 유적(Excavated Site)에 대한 개괄 정보를 구조화합니다.

## 💾 테이블 스키마 (excavated_site)

\`\`\`json
${JSON.stringify(excavatedSiteTableDescription, null, 0)}
\`\`\`

## 📌 지시사항

1. \`excavatedSite\`의 구조에 따라 가능한 모든 필드를 채우세요.
2. 이전에 추출된 데이터는 신뢰되는 것으로 간주하고, **덮어쓰지 말고 누적하거나 보완**하세요.
3. \`number\` 타입 필드는 확실한 경우만 갱신하세요.
4. 행정구역, 면적, 고도 등은 텍스트 중에서 문맥상 가장 대표적인 수치를 사용하세요.
5. 문맥상 \`images\` 필드의 \`caption\`이 있다면 그 이미지의 \`src\`를 \`images\` 필드에 추가하세요. \`images\` 필드는 JSON 문자열 배열입니다.(주어지는 이미지는 없을 수도 있습니다.)
6. 텍스트가 앞뒤로 짤려 있어 보이면 \`"isPartialLastPage": true\`로 설정하세요.
7. **출력은 반드시 유효한 JSON만 포함하세요. 주석, 설명, 포맷 없이 JSON 객체 하나만 반환하세요.**

## ✅ 출력 형식 예시 및 판단 기준

- \`isPartialLastPage\`: 마지막 페이지에서 문단이나 문장이 도중에 끊겼거나, 문맥상 다음 내용이 이어질 것으로 보이는 경우 \`true\`로 설정합니다.
- \`mainContentStartPage\`: 목차가 있을 경우, 목차를 참고하여 "조사 내용" 챕터가 시작되는 페이지를 설정합니다. 조사지역이나 주변 환경이나 조사 방법 등과 같은 챕터는 조사내용 챕터가 아니닌 주의해주세요. 주어진 내용에 목차가 없다면 \`null\`로 설정합니다.
- \`mainContentNextChapterStartPage\`: 목차가 있을 경우, 목차를 참고하여 "조사 내용" 다음 챕터, 즉 "고찰", "맺음말", "결론" 등의 챕터가 시작되는 페이지 중 가장 빠른 것을 설정합니다. 주어진 내용에 목차가 없다면 \`null\`로 설정합니다.

\`\`\`json
{
  "isPartialLastPage": true,
  "mainContentStartPage": 50,
  "mainContentNextChapterStartPage": 70,
  "excavatedSite": {
    "id": "temporary_id",
    "report_id": "abc-123",
    "site_name": "세종 행복도시 제7-1지구 유적",
    ...,
  }
}
\`\`\`

- JSON은 유효한 JSON이어야 하며, 주석이나 설명 없이 JSON 객체 하나만 반환해야 합니다. 어차피 파싱할 거니까 1줄로 출력하세요.`,
        user: `다음은 PDF에서 추출한 비정형 텍스트입니다. 이 텍스트를 기반으로 excavated_site 테이블에 맞는 구조화된 JSON 데이터를 생성하세요.

## 📘 현재까지 수집된 데이터

다음은 이전 페이지에서 추출된 \`excavatedSite\` 데이터입니다. 이미 추출된 값은 가능한 한 유지하고, 현재 텍스트에서 추가 정보를 추출하여 병합하세요.

\`\`\`json
${JSON.stringify(chunkedExcavatedSite, null, 0)}
\`\`\`

## 📄 분석 대상 텍스트 (PDF 추출 텍스트 배열)

- 이 데이터는 보고서에서 추출된 텍스트이며, 페이지 순으로 정렬되어 있습니다.
- 마지막 페이지가 짤렸을 가능성이 있습니다. 이 경우 짤린 맥락은 포함하지 마세요.

\`\`\`json
${JSON.stringify(inputTexts, null, 0)}
\`\`\`

## 📸 이미지 메타데이터
- 이 데이터는 보고서에서 추출된 이미지 메타데이터이며, 캡션이 포함되어 있습니다.

\`\`\`json
${JSON.stringify(currentImages, null, 0)}
\`\`\``,
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

    const {
      isPartialLastPage,
      excavatedSite,
      mainContentStartPage: foundMainContentStartPage,
      mainContentNextChapterStartPage: foundMainContentNextChapterStartPage,
    } = extractPureJSON<{
      isPartialLastPage: boolean;
      excavatedSite: Partial<ExcavatedSite>;
      mainContentStartPage: number | null;
      mainContentNextChapterStartPage: number | null;
    }>(result.content);

    if (result.usage) {
      console.log('usage', result.usage.prompt_tokens, result.usage.completion_tokens, result.usage.total_tokens);

      consumeTokens.promptTokens += result.usage.prompt_tokens;
      consumeTokens.completionTokens += result.usage.completion_tokens;
      consumeTokens.totalTokens += result.usage.total_tokens;
    }

    chunkedExcavatedSite = excavatedSite;

    if (!mainContentStartPage && foundMainContentStartPage) {
      mainContentStartPage = foundMainContentStartPage / pageType + realFirstPage * pageType;
    }
    console.log('mainContentStartPage', mainContentStartPage);

    if (!mainContentNextChapterStartPage && foundMainContentNextChapterStartPage) {
      mainContentNextChapterStartPage = foundMainContentNextChapterStartPage / pageType + realFirstPage * pageType;
    }
    console.log('mainContentNextChapterStartPage', mainContentNextChapterStartPage);

    if (mainContentStartPage && mainContentStartPage >= startPage && mainContentStartPage <= endPage) {
      break;
    }

    if (isPartialLastPage) {
      startPage -= 1;
    }
  }

  return {
    excavatedSite: chunkedExcavatedSite as ExcavatedSite,
    mainContentStartPage,
    mainContentNextChapterStartPage,
    consumeTokens,
  };
};

export default makeExcavatedSiteData;
