import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { counter } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Mark current as DONE
    await supabase
      .from('queues')
      .update({ status: 'DONE' })
      .eq('date', today)
      .eq('status', 'CALLED');

    // Get next waiting
    const { data: nextQueue } = await supabase
      .from('queues')
      .select('*')
      .eq('date', today)
      .eq('status', 'WAITING')
      .order('number', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextQueue) {
      await supabase
        .from('queues')
        .update({ 
          status: 'CALLED',
          called_at: new Date().toISOString(),
          counter: counter || 1
        })
        .eq('id', nextQueue.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Next queue error:', error);
    return NextResponse.json({ error: 'Failed to call next' }, { status: 500 });
  }
}