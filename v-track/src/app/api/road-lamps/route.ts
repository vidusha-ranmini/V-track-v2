import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('road_lamps')
      .select(`
        *,
        roads!road_lamps_road_id_fkey(name),
        sub_roads!road_lamps_sub_road_id_fkey(name),
        addresses!road_lamps_address_id_fkey(address)
      `)
      .eq('is_deleted', false)
      .order('lamp_number');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten the joined data
    const transformedData = data?.map(lamp => ({
      ...lamp,
      road_name: lamp.roads?.name,
      sub_road_name: lamp.sub_roads?.name,
      address: lamp.addresses?.address
    })) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch road lamps' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lamp_number, road_id, sub_road_id, address_id, status } = body;

    // Validate required fields
    if (!lamp_number || !road_id || !sub_road_id || !address_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if lamp number already exists
    const { data: existing } = await supabase
      .from('road_lamps')
      .select('id')
      .eq('lamp_number', lamp_number)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Lamp number already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('road_lamps')
      .insert({
        lamp_number,
        road_id,
        sub_road_id,
        address_id,
        status: status || 'working'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to create road lamp' }, { status: 500 });
  }
}