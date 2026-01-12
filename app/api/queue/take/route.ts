import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting storage (in production use Redis)
const rateLimitMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { clinic } = await request.json();
    const today = new Date().toISOString().split('T')[0];
    
    // Simple rate limiting: 1 request per 5 minutes per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const lastRequest = rateLimitMap.get(ip);
    const now = Date.now();
    
    if (lastRequest && now - lastRequest < 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Harap tunggu 5 menit sebelum mengambil nomor lagi' },
        { status: 429 }
      );
    }
    
    rateLimitMap.set(ip, now);

    // Get max number for today
    const { data: maxData } = await supabase
      .from('queues')
      .select('number')
      .eq('date', today)
      .order('number', { ascending: false })
      .limit(1);

    const nextNumber = maxData && maxData.length > 0 ? maxData[0].number + 1 : 1;

    // Insert new queue
    const { data, error } = await supabase
      .from('queues')
      .insert({
        date: today,
        clinic: clinic,
        number: nextNumber,
        status: 'WAITING'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Take queue error:', error);
    return NextResponse.json({ error: 'Failed to create queue' }, { status: 500 });
  }
}