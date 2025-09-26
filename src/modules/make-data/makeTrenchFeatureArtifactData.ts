import { callOpenAI } from '@/libs/open-ai';
import db from '@/models/db.json';
import { Artifact, Feature, Trench } from '@/models/db.model';
import { PDFImageContentWithDetailCaption, PDFTextByPage } from '@/models/pdf.model';
import { CompletionToken } from '@/models/token.model';
import extractPureJSON from '@/utils/extract-pure-json';

const PAGE_CHUNK_SIZE = 2; // N페이지씩 처리

const makeTrenchFeatureArtifactData = async (
  excavatedSiteId: string,
  texts: PDFTextByPage[],
  images: PDFImageContentWithDetailCaption[],
  mainContentStartPage: number,
  mainContentNextChapterStartPage: number,
): Promise<{ trenches: Trench[]; features: Feature[]; artifacts: Artifact[]; consumeTokens: CompletionToken }> => {
  const consumeTokens: CompletionToken = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  let chunkedTrenches: Partial<Trench>[] = [];
  let chunkedFeatures: Partial<Feature>[] = [];
  let chunkedArtifacts: Partial<Artifact>[] = [];

  for (let startPage = mainContentStartPage; startPage <= texts.length; startPage += PAGE_CHUNK_SIZE) {
    console.log(`makeTrenchFeatureArtifactData 처리 페이지: ${startPage} ~ ${startPage + PAGE_CHUNK_SIZE - 1}`);

    const endPage = startPage + PAGE_CHUNK_SIZE - 1;
    const inputTexts = texts.filter(({ page }) => page >= startPage && page <= endPage);

    const currentAllText = inputTexts.map(({ text }) => text).join('\n');

    let currentImages = images.filter(image => !!image.caption?.str && currentAllText.includes(image.caption.str));

    if (currentImages.length / images.length > 0.3) {
      currentImages = [];
    }

    const { usage, isPartialLastPage, trenches, features, artifacts } = await getLLMResponse(
      excavatedSiteId,
      chunkedTrenches,
      chunkedFeatures,
      chunkedArtifacts,
      inputTexts,
      currentImages,
    );

    if (usage) {
      console.log('usage', usage.prompt_tokens, usage.completion_tokens, usage.total_tokens);

      consumeTokens.promptTokens += usage.prompt_tokens;
      consumeTokens.completionTokens += usage.completion_tokens;
      consumeTokens.totalTokens += usage.total_tokens;
    }

    chunkedTrenches = removeDuplicate<Partial<Trench>>(chunkedTrenches.concat(trenches));
    chunkedFeatures = removeDuplicate<Partial<Feature>>(chunkedFeatures.concat(features));
    chunkedArtifacts = removeDuplicate<Partial<Artifact>>(chunkedArtifacts.concat(artifacts));

    console.log('chunkedTrenches', chunkedTrenches.length);
    console.log('chunkedFeatures', chunkedFeatures.length);
    console.log('chunkedArtifacts', chunkedArtifacts.length);

    if (mainContentNextChapterStartPage <= endPage) {
      break;
    }

    if (isPartialLastPage) {
      startPage -= 1;
    }
  }

  return {
    trenches: chunkedTrenches as Trench[],
    features: chunkedFeatures as Feature[],
    artifacts: chunkedArtifacts as Artifact[],
    consumeTokens,
  };
};

export default makeTrenchFeatureArtifactData;

const removeDuplicate = <T extends { id?: string }>(arr: T[]) => {
  const uniqueIds = new Set();
  const result: T[] = [];

  for (const item of arr) {
    if (!item.id) {
      // id가 없는 항목은 유지
      result.push(item);
      continue;
    }

    if (!uniqueIds.has(item.id)) {
      // id가 있고 중복이 아닌 경우 추가
      uniqueIds.add(item.id);
      result.push(item);
    }
  }

  return result;
};

const getLLMResponse = async (
  excavatedSiteId: string,
  chunkedTrenches: Partial<Trench>[],
  chunkedFeatures: Partial<Feature>[],
  chunkedArtifacts: Partial<Artifact>[],
  inputTexts: PDFTextByPage[],
  currentImages: PDFImageContentWithDetailCaption[],
  retryCount = 0,
) => {
  try {
    const trenchTableDescription = db.tables.find(table => table.table_name === 'trench')!;
    const featureTableDescription = db.tables.find(table => table.table_name === 'feature')!;
    const artifactTableDescription = db.tables.find(table => table.table_name === 'artifact')!;

    const result = await callOpenAI(
      {
        system: `당신은 PDF에서 추출된 비정형 텍스트를 분석하여 고고학 발굴조사 보고서의 트렌치, 유구, 유물 정보를 구조화하는 전문가입니다.
주어진 테이블 스키마에 맞춰 데이터를 정리하고, 불확실하거나 짤린 정보는 판단 기준에 따라 신중하게 처리해야 합니다.
출력은 유효한 JSON만 포함해야 하며, 주석이나 설명 없이 JSON 객체 하나만 반환해야 합니다.
없는 내용을 만들지 마세요. 모두 제시한 정보에 기반해야 합니다.
만약 추출한 특정 트렌치, 유구, 유물의 내용이 나오다가 짤린 경우, 다음에 처리할 거니까 데이터를 만들지 마세요.

# trench, feature, artifact 테이블 데이터 추출

## 🎯 목적
비정형 조사 보고서 텍스트로부터 트렌치(Trench), 유구(Feature), 유물(Artifact)에 대한 정보를 구조화합니다.

## 💾 테이블 스키마 (trench)

\`\`\`json
${JSON.stringify(trenchTableDescription, null, 0)}
\`\`\`

## 💾 테이블 스키마 (feature)

\`\`\`json
${JSON.stringify(featureTableDescription, null, 0)}
\`\`\`

## 💾 테이블 스키마 (artifact)

\`\`\`json
${JSON.stringify(artifactTableDescription, null, 0)}
\`\`\`

## 발굴조사보고서에서의 트렌치, 유구, 유물의 기술 양상
### 트렌치
- 트렌치는 있을 수도 있고 없을 수도 있습니다. 또한 따로 분류하지 않고 본문 속에 자연스럽게 기술될 수도 있습니다.
- 트렌치 안에는 유물이 있을 수도 있고 없을 수도 있습니다.

### 유구
- 유구는 대체로 분명히 분류하여 기술됩니다. 분류하지 않고 본문 속에 자연스럽게 기술될 수도 있습니다.
- 유구 안에는 대체로 유물이 있습니다.
- 유구를 기술한 뒤 그 유구에 속한 유물들이 나열, 기술되고, 유물들의 나열이 끝나면 다음 유구로 넘어가는 서술이 많습니다.
- 반면, 모든 유구를 나열, 기술한 뒤, 유물들을 나열, 기술하는 서술도 있습니다.
- 유구 전반에 대한 개괄적인 설명이 있을 수 있는데, 이건 대상이 아닙니다. 헷갈리지 마세요. 유구 하나하나 설명하고 나열하는 것이 대상입니다.
- feature_number, feature_name, feature_type은 반드시 찾아서 채워주고, 나머지 필드들도 최대한 열심히 채워주세요. 진짜 없으면 null로 채워주세요.

### 유물
- 유물은 대체로 분명히 분류하여 기술됩니다. 유물은 유구와 관련이 깊습니다. 그러나 드믈게 없을 수도 있습니다.
- 유물은 대체로 특정 유구에 속하지만, 트렌치에 속할 수도 있고, 출토 트렌치, 유구 미상인 경우도 있습니다.
- 유물은 대체로 유구와 함께 기술됩니다. 그러나 유물만 따로 기술되는 경우도 있습니다.
- 유물 전반에 대한 개괄적인 설명(총 몇점이고 분류는 어떻게 되고 어떤식으로 정의하고 그러한 내용들)이 있을 수 있는데, 이건 구조화할 대상 유물이 아닙니다. 헷갈리지 마세요. 유물 하나하나 설명하고 나열하는 것이 대상입니다.
- artifact_number, artifact_name, artifact_type은 반드시 찾아서 채워주고, 나머지 필드들도 최대한 열심히 채워주세요. 진짜 없으면 null로 채워주세요.

## 📌 지시사항

1. \`trench\`, \`feature\`, \`artifact\`의 구조에 따라 가능한 모든 필드를 채우세요.
2. 추출한 데이터가 이전과 같은 트렌치, 유구, 유물일 경우 그냥 두세요. 추출한 데이터가 이전과 다른 트렌치, 유구, 유물일 경우 새로운 트렌치, 유구, 유물로 추가하세요.
  - 새로운 트렌치, 유구, 유물를 추가할 경우 \`id\`는 UUIDv4로 생성하세요.
  - 또한 트렌치, 유구, 유물의 \`excavated_site_id\`는 \`${excavatedSiteId}\`로 설정하세요.
3. \'trench\`와 \'feature\'는 독립적입니다.
4. \`artifact\`는 \`feature\`와 \`trench\`에 종속적일 수 있습니다. 즉, \`artifact\`는 \`feature\` 또는 \`trench\`의 \`id\`를 웬만하면 포함해야 합니다.(간혹 출토 트렌치, 유구 미상인 경우도 있지만 드믑니다.)
  - 유물이 어떤 트렌치, 유구에 속하는지 모르겠는데 유물의 기술에 출토 미상이라는 식으로 분명하게 되어있지 않으면 주어진 이전의 유구 데이터 중 마지막 유구에서 출토된 것으로 추정하여 \`feature_id\`를 설정하세요.
5. 유구와 유물은 기술되기도 하지만 표로 정리되기도 합니다. 둘 다 있을 수도 있습니다. 어쨌든 머지해서 하나의 유구, 유물로 만들어야 합니다.
6. 데이터를 병합할 경우 \`number\` 타입 필드는 확실한 경우만 갱신하세요.
7. 문맥상 해당 개체에 해당하는 \`images\` 필드의 \`caption\`이 있다면 그 이미지의 \`src\`를 \`images\` 필드에 추가하세요.(주어지는 이미지는 없을 수도 있습니다.)
8. 텍스트가 앞뒤로 짤려 있어 보이면 \`"isPartialLastPage": true\`로 설정하세요.
9. 각 테이블의 \`description\` 필드는 본문의 내용을 요약하거나 하지 말고, 해당 개체에 대한 설명을 모두 모아 넣어주세요.
10. **출력은 반드시 유효한 JSON만 포함하세요. 주석, 설명, 포맷 없이 JSON 객체 하나만 반환하세요.**

## ✅ 출력 형식 예시 및 판단 기준

- \`isPartialLastPage\`: 마지막 페이지에서 문단이나 문장이 도중에 끊겼거나, 문맥상 다음 내용이 이어질 것으로 보이는 경우 \`true\`로 설정합니다.
- \`trenches\`: 트렌치 데이터 배열입니다. 새로운 데이터만 포함하면 됩니다.
- \`features\`: 유구 데이터 배열입니다. 새로운 데이터만 포함하면 됩니다.
- \`artifacts\`: 유물 데이터 배열입니다. 새로운 데이터만 포함하면 됩니다.

\`\`\`json
{
  "isPartialLastPage": true,
  "trenches": [{
    "id": "{uuidv4}",
    "excavated_site_id": "${excavatedSiteId}",
    ...,
  }, {
    "id": "{uuidv4}",
    "excavated_site_id": "${excavatedSiteId}",
    ...,
  }],
  "features": [{
    "id": "{uuidv4}",
    "excavated_site_id": "${excavatedSiteId}",
    "trench_id": "{uuidv4}",
    "feature_number": "...",
    ...,
  }, {
    "id": "{uuidv4}",
    "excavated_site_id": "${excavatedSiteId}",
    "trench_id": "{uuidv4}",
    "feature_number": "...",
    ...,
  }],
  "artifacts": [{
    "id": "{uuidv4}",
    "excavated_site_id": "${excavatedSiteId}",
    "feature_id": "{uuidv4}",
    "trench_id": "{uuidv4}",
    "artifact_number": "...",
    ...,
  }, {
    "id": "{uuidv4}",
    "excavated_site_id": "${excavatedSiteId}",
    "feature_id": "{uuidv4}",
    "trench_id": "{uuidv4}",
    "artifact_number": "...",
    ...,
  }]
}
\`\`\`

- JSON은 유효한 JSON이어야 하며, 주석이나 설명 없이 JSON 객체 하나만 반환해야 합니다. 어차피 파싱할 거니까 1줄로 출력하세요.`,
        user: `다음은 PDF에서 추출한 비정형 텍스트입니다. 이 텍스트를 기반으로 trenches, features, artifacts 테이블에 맞는 구조화된 JSON 데이터를 생성하세요.

## 📘 현재까지 수집된 데이터

다음은 이전 페이지에서 추출된 \`trenches\` 데이터입니다.

\`\`\`json
${JSON.stringify(chunkedTrenches, null, 0)}
\`\`\`

다음은 이전 페이지에서 추출된 \`features\` 데이터입니다.

\`\`\`json
${JSON.stringify(chunkedFeatures, null, 0)}
\`\`\`

다음은 이전 페이지에서 추출된 \`artifacts\` 데이터입니다.

\`\`\`json
${JSON.stringify(chunkedArtifacts, null, 0)}
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
        // model: 'o4-mini',
      },
    );

    if (!result.content) {
      throw new Error('OpenAI API 호출 실패');
    }

    return {
      usage: result.usage,
      ...extractPureJSON<{
        isPartialLastPage: boolean;
        trenches: Partial<Trench>[];
        features: Partial<Feature>[];
        artifacts: Partial<Artifact>[];
      }>(result.content),
    };
  } catch (err) {
    if (retryCount < 5) {
      console.warn('OpenAI API 호출 실패. 10초 후 재시도합니다...', err);

      await new Promise(resolve => setTimeout(resolve, 10000));

      return getLLMResponse(
        excavatedSiteId,
        chunkedTrenches,
        chunkedFeatures,
        chunkedArtifacts,
        inputTexts,
        currentImages,
        retryCount + 1,
      );
    }

    throw new Error('OpenAI API 호출 실패: 최대 재시도 횟수 초과.');
  }
};
