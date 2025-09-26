import fs from 'fs';
import path from 'path';
import { cosineSimilarity } from './cosine';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let glossaryItems: { id: string; name: string; description: string; glossary: string }[] = [];
let glossaryEmbeddings: { id: string; name: string; embedding: number[] }[] = [];

function loadGlossaryData() {
  if (glossaryItems.length > 0 && glossaryEmbeddings.length > 0) return;

  const base = path.join(process.cwd(), 'data');
  glossaryItems = JSON.parse(fs.readFileSync(path.join(base, 'archaeo-glossary.json'), 'utf-8'));
  glossaryEmbeddings = JSON.parse(fs.readFileSync(path.join(base, 'glossary-embeddings.json'), 'utf-8'));

  console.log(`🔍 Glossary loaded: ${glossaryItems.length} items`);
}

export async function searchGlossary(query: string, topK = 10) {
  loadGlossaryData();

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryEmbedding = embeddingRes.data[0].embedding;

  const topMatches = glossaryEmbeddings
    .map(entry => ({
      id: entry.id,
      name: entry.name,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const topIds = new Set(topMatches.map(m => m.id));
  return glossaryItems.filter(item => topIds.has(item.id));
}
