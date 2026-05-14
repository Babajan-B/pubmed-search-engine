import { NextRequest, NextResponse } from 'next/server';
import { searchJournalsByName } from '@/lib/journalData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 200);

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  return NextResponse.json({
    journals: searchJournalsByName(query, limit),
  });
}
