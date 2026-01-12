import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('queues')
      .delete()
      .eq('date', today);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset queue error:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}