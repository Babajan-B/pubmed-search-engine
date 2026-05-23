import { NextRequest, NextResponse } from 'next/server';
import { getScopusSubjects, searchScopusJournals } from '@/lib/scopusData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query')?.trim() ?? '';
  const status = searchParams.get('status') ?? 'all';
  const sourceType = searchParams.get('sourceType') ?? 'all';
  const subject = searchParams.get('subject') ?? 'all';
  const sortBy = searchParams.get('sortBy') ?? 'title-asc';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  return NextResponse.json({
    ...searchScopusJournals({ query, status, sourceType, subject, sortBy, limit }),
    subjects: getScopusSubjects(),
  });
}
