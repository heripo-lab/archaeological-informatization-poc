import { ExcavatedSite } from '@/models/db.model';
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
    const query = 'SELECT * FROM excavated_sites';
    const excavatedSites = db.prepare(query).all() as ExcavatedSite & { images: string }[];
    db.close();

    // JSON 문자열 배열을 JavaScript 배열로 변환
    excavatedSites.forEach(site => {
      if (site.images) {
        site.images = JSON.parse(site.images);
      }
    });

    return NextResponse.json(excavatedSites);
  } catch (error) {
    console.error('Error fetching excavated sites:', error);

    return NextResponse.json({ error: 'Failed to fetch excavated sites' }, { status: 500 });
  }
}
