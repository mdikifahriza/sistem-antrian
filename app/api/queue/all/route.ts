import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all queues for today
    const { data: queues } = await supabase
      .from('queues')
      .select('*')
      .eq('date', today)
      .order('number', { ascending: true });

    // Calculate stats
    const stats = {
      total: queues?.length || 0,
      waiting: queues?.filter(q => q.status === 'WAITING').length || 0,
      called: queues?.filter(q => q.status === 'CALLED').length || 0,
      done: queues?.filter(q => q.status === 'DONE').length || 0,
      skipped: queues?.filter(q => q.status === 'SKIPPED').length || 0
    };

    // Generate hourly data (8:00 - 17:00)
    const hourlyData = [];
    for (let hour = 8; hour <= 17; hour++) {
      const count = queues?.filter(q => {
        const qHour = new Date(q.created_at).getHours();
        return qHour === hour;
      }).length || 0;
      hourlyData.push({ hour, count });
    }

    return NextResponse.json({
      queues: queues || [],
      stats,
      hourlyData
    });
  } catch (error) {
    console.error('Get all queues error:', error);
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 });
  }
}