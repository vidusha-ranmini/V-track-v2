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
    const { address, road_id, sub_road_id } = body;
    const { addressId } = await params;

    if (!address || !road_id || !sub_road_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if address already exists for this location (excluding current)
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('address', address)
      .eq('road_id', road_id)
      .eq('sub_road_id', sub_road_id)
      .eq('is_deleted', false)
      .neq('id', addressId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Address already exists for this location' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('addresses')
      .update({
        address,
        road_id,
        sub_road_id
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