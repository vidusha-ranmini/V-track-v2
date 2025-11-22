import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const { roadId } = await params;
    
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    // Get addresses that belong directly to the main road (sub_road_id is NULL)
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('road_id', roadId)
      .is('sub_road_id', null)
      .eq('is_deleted', false)
      .order('address');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(addresses || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch main road addresses' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const { roadId } = await params;
    const { address, member } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    // Check if address already exists for this main road
    const { data: existing } = await supabase
      .from('addresses')
      .select('id')
      .eq('address', address)
      .eq('road_id', roadId)
      .is('sub_road_id', null)
      .eq('is_deleted', false)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Address already exists for this main road' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({ 
        address, 
        road_id: roadId, 
        sub_road_id: null,
        member: member || null,
        is_deleted: false
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
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}