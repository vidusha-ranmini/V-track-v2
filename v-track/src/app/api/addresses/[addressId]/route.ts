import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const body = await request.json();
    const { address, road_id, sub_road_id, member } = body;
    const { addressId } = await params;

    if (!address || !road_id) {
      return NextResponse.json({ error: 'Address and road_id are required' }, { status: 400 });
    }

    // Check if address already exists for this location (excluding current)
    let existingQuery = supabase
      .from('addresses')
      .select('id')
      .eq('address', address)
      .eq('road_id', road_id)
      .eq('is_deleted', false)
      .neq('id', addressId);

    // Handle sub_road_id filtering for duplicate check
    if (sub_road_id) {
      existingQuery = existingQuery.eq('sub_road_id', sub_road_id);
    } else {
      existingQuery = existingQuery.is('sub_road_id', null);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Address already exists for this location' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('addresses')
      .update({
        address,
        road_id,
        sub_road_id: sub_road_id || null,
        member: member || null
      })
      .eq('id', addressId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params;

    const { data, error } = await supabase
      .from('addresses')
      .update({ 
        is_deleted: true
      })
      .eq('id', addressId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}