import { Feature } from '@/models/db.model';
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
    const query = 'SELECT * FROM features';
    const features = db.prepare(query).all() as Feature & { images: string; page_references: string }[];
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

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);

    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}
