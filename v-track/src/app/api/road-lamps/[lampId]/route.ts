import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lampId: string }> }
) {
  try {
    const body = await request.json();
    const { lamp_number, road_id, sub_road_id, address_id, status } = body;
    const { lampId } = await params;

    // Validate required fields
    if (!lamp_number || !road_id || !sub_road_id || !address_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if lamp number already exists (excluding current lamp)
    const { data: existing } = await supabase
      .from('road_lamps')
      .select('id')
      .eq('lamp_number', lamp_number)
      .eq('is_deleted', false)
      .neq('id', lampId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Lamp number already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('road_lamps')
      .update({
        lamp_number,
        road_id,
        sub_road_id,
        address_id,
        status: status || 'working',
        updated_at: new Date().toISOString()
      })
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
    return NextResponse.json({ error: 'Failed to update road lamp' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lampId: string }> }
) {
  try {
    const { lampId } = await params;

    const { data, error } = await supabase
      .from('road_lamps')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
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

    return NextResponse.json({ message: 'Road lamp deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete road lamp' }, { status: 500 });
  }
}