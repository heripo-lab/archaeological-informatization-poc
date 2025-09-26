import { Artifact } from '@/models/db.model';
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

export async function GET(request: NextRequest, { params }: any) {
  const excavatedSiteId = params.excavatedSiteId;

  try {
    const db = new Database(getDbPath());
    const query = 'SELECT * FROM artifacts WHERE excavated_site_id = ?';
    const artifacts = db.prepare(query).all(excavatedSiteId) as Artifact &
      { images: string; page_references: string }[];
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

    return NextResponse.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);

    return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 });
  }
}
