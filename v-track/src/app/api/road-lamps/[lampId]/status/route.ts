import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lampId: string }> }
) {
  try {
    const body = await request.json();
    const { status } = body;
    const { lampId } = await params;

    // Accept expanded status domain and normalize legacy 'broken'
    const allowedStatuses = ['working', 'broken_bulb', 'broken_switch', 'broken_arm', 'broken_bracket'];
    const normalizedStatus = status === 'broken' ? 'broken_bulb' : status;

    if (!normalizedStatus || !allowedStatuses.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const updatePayload: { status: string; arm_broken?: boolean; updated_at: string } = {
      status: normalizedStatus,
      updated_at: new Date().toISOString()
    };

    // Set arm_broken flag for compatibility when status indicates arm broken
    updatePayload.arm_broken = normalizedStatus === 'broken_arm';

    const { data, error } = await supabase
      .from('road_lamps')
      .update(updatePayload)
      .eq('id', lampId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Road lamp not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update lamp status' }, { status: 500 });
  }
}