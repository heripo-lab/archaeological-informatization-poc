import { searchGlossary } from '@/libs/glossarySearchEngine';
import { Artifact, ExcavatedSite, Feature, Trench } from '@/models/db.model';
import { openai } from '@ai-sdk/openai';
import Database from 'better-sqlite3';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { streamText, tool } from 'ai';
import path from 'path';
import { z } from 'zod';

const getDbPath = () => {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'excavation.db');
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 프롬프트가 비어있는지 확인
    if (!body.messages) {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 });
    }

    const db = new Database(getDbPath());
    const query = 'SELECT * FROM excavated_sites';
    const excavatedSites = db.prepare(query).all() as ExcavatedSite & { images: string }[];
    db.close();

    // JSON 문자열 배열을 JavaScript 배열로 변환
    excavatedSites.forEach(site => {
      if (site.images) {
        site.images = JSON.parse(site.images);
      }
    });

    const result = streamText({
      model: openai('gpt-4o'),
      system: `당신은 한국 고고학 전문가입니다. 기본적으로 DB에 있는 유적 외에 대한 질문은 답변할 수 없습니다. 주어진 유적 테이블 및 필요시 트렌치, 유구, 유물 테이블에서 내용을 찾아 질문에 대해서 답변해주세요.
만약 사용자의 질문이 DB에 있는 유적에 대한 것이 아니라면, 그에 대한 정보를 Tool에 등록된 한국 고고학 사전에서 찾아보고, 그래도 없으면 정보를 제공할 수 없다고 답변해주세요. 사전에서 정보를 제공할 경우 사전명 등 출처를 반드시 포함해야 합니다.
DB에 있는 내용을 답변할 때도 어려워 보이는 개념이 있다면 사전에서 찾아서 내용을 보충해도 됩니다.

## DB에 있는 유적테이블 내용
${JSON.stringify(excavatedSites, null, 0)}

## 이미지의 url을 포함해 응답한다면
- 만약 url에 hostname이 포함되어 있지 않다면, \`http://localhost:3000\`을 붙여서 url을 완성한다.

## (중요)응답시 유의사항
- 가능하면 출처의 페이지 번호를 포함한다.
- 무언가를 나열할 때는 사용자의 특별한 요청이 있지 않는 이상 Table 형태로 출력한다.
- 유구, 트렌치, 유물 등에 대해 독립적으로 응답할 때는 반드시 어떤 유적에서 나온 것인지 명시한다.
- 반드시 툴에서 제공하는 정보를 기반으로 응답하세요. LLM이 별도로 아는 정보는 사용할 경우 지정된 출처가 아니고 일반적인 지식이라고 표기해주세요.
- 출처를 반드시 명시하세요. DB에서 찾았으면 발굴조사보고서 {유적 이름} DB에서 찾았다고 명시하세요. 고고학사전에서 찾았으면 어떤 사전에서 찾았다고 명시하세요.
\`\`\`
      `,
      messages: body.messages,
      tools: {
        trenchesInExcavatedSite: tool({
          description: '특정 유적의 트렌치에 대한 정보를 제공하는 도구입니다.',
          parameters: z.object({
            excavatedSiteId: z.string().describe('유적의 ID'),
          }),
          execute: async ({ excavatedSiteId }) => {
            return {
              excavatedSiteId,
              trenches: getTrenchesWithExcavatedSiteId(excavatedSiteId),
            };
          },
        }),
        featuresInExcavatedSite: tool({
          description: '특정 유적의 유구에 대한 정보를 제공하는 도구입니다.',
          parameters: z.object({
            excavatedSiteId: z.string().describe('유적의 ID'),
          }),
          execute: async ({ excavatedSiteId }) => {
            return {
              excavatedSiteId,
              features: getFeaturesWithExcavatedSiteId(excavatedSiteId),
            };
          },
        }),
        artifactsInExcavatedSite: tool({
          description: '특정 유적의 유물에 대한 정보를 제공하는 도구입니다.',
          parameters: z.object({
            excavatedSiteId: z.string().describe('유적의 ID'),
          }),
          execute: async ({ excavatedSiteId }) => {
            return {
              excavatedSiteId,
              artifacts: getArtifactsWithExcavatedSiteId(excavatedSiteId),
            };
          },
        }),
        artifactsInFeature: tool({
          description: '특정 유구의 유물에 대한 정보를 제공하는 도구입니다.',
          parameters: z.object({
            featureId: z.string().describe('유구의 ID'),
          }),
          execute: async ({ featureId }) => {
            return {
              featureId,
              artifacts: getArtifactsWithFeatureId(featureId),
            };
          },
        }),
        artifactsInTrench: tool({
          description: '특정 트렌치의 유물에 대한 정보를 제공하는 도구입니다.',
          parameters: z.object({
            trenchId: z.string().describe('트렌치의 ID'),
          }),
          execute: async ({ trenchId }) => {
            return {
              trenchId,
              artifacts: getArtifactsWithTrenchId(trenchId),
            };
          },
        }),
        glossarySearch: tool({
          description:
            '한국 고고학 사전에서 사용자의 질문을 의미 기반으로 검색해 관련 용어 정의를 제공하는 도구입니다.',
          parameters: z.object({
            keyword: z
              .string()
              .describe('궁금한 고고학 개념, 유적, 유구, 유물, 설명 문장 등 한국 고고학 관련한 어떤 것도 관계없음'),
            topK: z
              .number()
              .gte(0)
              .lte(100)
              .describe(
                '가장 유사한 결과를 몇 개 가져올지 결정하는 숫자. 기본값은 10입니다. 많은 맥락이 필요한 경우 적절히 판단해서 조정하세요.',
              ),
          }),
          execute: async ({ keyword, topK }) => {
            const results = await searchGlossary(keyword, topK);

            console.log('Glossary Search Results:');
            console.table(results.map(result => result.name));

            if (results.length === 0) {
              return { message: `'${keyword}'에 해당하는 관련 항목을 찾을 수 없습니다.` };
            }
            return {
              query: keyword,
              matches: results,
            };
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error:', error);

    return NextResponse.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}

const getFeaturesWithExcavatedSiteId = (excavatedSiteId: string) => {
  const db = new Database(getDbPath());
  const query = 'SELECT * FROM features WHERE excavated_site_id = ?';
  const features = db.prepare(query).all(excavatedSiteId) as Feature & { images: string; page_references: string }[];
  db.close();

  // JSON 문자열 배열을 JavaScript 배열로 변환
  features.forEach(feature => {
    if (feature.images) {
      feature.images = JSON.parse(feature.images);
    }

    if (feature.page_references) {
      feature.page_references = JSON.parse(feature.page_references);
    }
  });

  return features;
};

const getTrenchesWithExcavatedSiteId = (excavatedSiteId: string) => {
  const db = new Database(getDbPath());
  const query = 'SELECT * FROM trenches WHERE excavated_site_id = ?';
  const trenches = db.prepare(query).all(excavatedSiteId) as Trench & { images: string; page_references: string }[];
  db.close();

  // JSON 문자열 배열을 JavaScript 배열로 변환
  trenches.forEach(trench => {
    if (trench.images) {
      trench.images = JSON.parse(trench.images);
    }

    if (trench.page_references) {
      trench.page_references = JSON.parse(trench.page_references);
    }
  });

  return trenches;
};

const getArtifactsWithExcavatedSiteId = (excavatedSiteId: string) => {
  const db = new Database(getDbPath());
  const query = 'SELECT * FROM artifacts WHERE excavated_site_id = ?';
  const artifacts = db.prepare(query).all(excavatedSiteId) as Artifact & { images: string; page_references: string }[];
  db.close();

  // JSON 문자열 배열을 JavaScript 배열로 변환
  artifacts.forEach(artifact => {
    if (artifact.images) {
      artifact.images = JSON.parse(artifact.images);
    }

    if (artifact.page_references) {
      artifact.page_references = JSON.parse(artifact.page_references);
    }
  });

  return artifacts;
};

const getArtifactsWithFeatureId = (featureId: string) => {
  const db = new Database(getDbPath());
  const query = 'SELECT * FROM artifacts WHERE feature_id = ?';
  const artifacts = db.prepare(query).all(featureId) as Artifact & { images: string; page_references: string }[];
  db.close();

  // JSON 문자열 배열을 JavaScript 배열로 변환
  artifacts.forEach(artifact => {
    if (artifact.images) {
      artifact.images = JSON.parse(artifact.images);
    }

    if (artifact.page_references) {
      artifact.page_references = JSON.parse(artifact.page_references);
    }
  });

  return artifacts;
};

const getArtifactsWithTrenchId = (trenchId: string) => {
  const db = new Database(getDbPath());
  const query = 'SELECT * FROM artifacts WHERE trench_id = ?';
  const artifacts = db.prepare(query).all(trenchId) as Artifact & { images: string; page_references: string }[];
  db.close();

  // JSON 문자열 배열을 JavaScript 배열로 변환
  artifacts.forEach(artifact => {
    if (artifact.images) {
      artifact.images = JSON.parse(artifact.images);
    }

    if (artifact.page_references) {
      artifact.page_references = JSON.parse(artifact.page_references);
    }
  });

  return artifacts;
};
