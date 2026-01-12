import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get user's queue
    const { data: queue } = await supabase
      .from('queues')
      .select('*')
      .eq('id', id)
      .single();

    if (!queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    // Get current called number
    const { data: currentData } = await supabase
      .from('queues')
      .select('number')
      .eq('date', today)
      .eq('status', 'CALLED')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Count waiting queues before user's number
    const { count } = await supabase
      .from('queues')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .eq('status', 'WAITING')
      .lt('number', queue.number);

    return NextResponse.json({
      queue,
      currentCalled: currentData?.number || null,
      waitingBefore: count || 0
    });
  } catch (error) {
    console.error('Check queue error:', error);
    return NextResponse.json({ error: 'Failed to check queue' }, { status: 500 });
  }
}