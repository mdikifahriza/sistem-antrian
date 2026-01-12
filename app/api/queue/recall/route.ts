import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { id, counter } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Mark current called as DONE first
    await supabase
      .from('queues')
      .update({ status: 'DONE' })
      .eq('date', today)
      .eq('status', 'CALLED');

    // Call the specific queue
    await supabase
      .from('queues')
      .update({ 
        status: 'CALLED',
        called_at: new Date().toISOString(),
        counter: counter || 1
      })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recall queue error:', error);
    return NextResponse.json({ error: 'Failed to recall queue' }, { status: 500 });
  }
}