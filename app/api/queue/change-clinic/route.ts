import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { id, clinic } = await request.json();

    await supabase
      .from('queues')
      .update({ clinic })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change clinic error:', error);
    return NextResponse.json({ error: 'Failed to change clinic' }, { status: 500 });
  }
}