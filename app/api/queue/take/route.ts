import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { clinic } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Ambil nomor antrian terbesar hari ini
    const { data: maxData, error: maxError } = await supabase
      .from('queues')
      .select('number')
      .eq('date', today)
      .order('number', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;

    const nextNumber =
      maxData && maxData.length > 0 ? maxData[0].number + 1 : 1;

    // Insert antrian baru
    const { data, error } = await supabase
      .from('queues')
      .insert({
        date: today,
        clinic,
        number: nextNumber,
        status: 'WAITING',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Take queue error:', error);
    return NextResponse.json(
      { error: 'Failed to create queue' },
      { status: 500 }
    );
  }
}
