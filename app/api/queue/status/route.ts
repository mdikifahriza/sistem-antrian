import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current called
    const { data: current } = await supabase
      .from('queues')
      .select('*')
      .eq('date', today)
      .eq('status', 'CALLED')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get waiting queues
    const { data: waiting } = await supabase
      .from('queues')
      .select('*')
      .eq('date', today)
      .eq('status', 'WAITING')
      .order('number', { ascending: true });

    return NextResponse.json({ current, waiting: waiting || [] });
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}