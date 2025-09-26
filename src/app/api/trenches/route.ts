import { Trench } from '@/models/db.model';
import Database from 'better-sqlite3';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const getDbPath = () => {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'excavation.db');
};

export async function GET(request: NextRequest) {
  try {
    const db = new Database(getDbPath());
    const query = 'SELECT * FROM trenches';
    const trenches = db.prepare(query).all() as Trench & { images: string; page_references: string }[];
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

    return NextResponse.json(trenches);
  } catch (error) {
    console.error('Error fetching trenches:', error);

    return NextResponse.json({ error: 'Failed to fetch trenches' }, { status: 500 });
  }
}
