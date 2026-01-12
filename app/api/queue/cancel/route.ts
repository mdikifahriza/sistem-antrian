import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    const { error } = await supabase
      .from('queues')
      .update({ status: 'SKIPPED' })
      .eq('id', id)
      .eq('status', 'WAITING'); // Only cancel if still waiting

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel queue error:', error);
    return NextResponse.json({ error: 'Failed to cancel queue' }, { status: 500 });
  }
}