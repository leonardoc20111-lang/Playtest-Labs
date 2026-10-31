import { NextResponse } from 'next/server';
import { BACKEND_MODE } from '@/lib/config';
import { getDb } from '@/lib/data/driver';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    await db.all('SELECT 1');
    return NextResponse.json({ status: 'ok', backend: BACKEND_MODE, dialect: db.dialect });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', backend: BACKEND_MODE, message: (error as Error).message },
      { status: 503 },
    );
  }
}
