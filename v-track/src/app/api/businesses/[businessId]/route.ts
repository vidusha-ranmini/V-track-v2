import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const body = await request.json();
    const { business_name, business_owner, business_type, business_address, road_id, sub_road_id } = body;
    const { businessId } = await params;

    // Validate required fields
    if (!business_name || !business_owner || !business_type || !road_id) {
      return NextResponse.json({ error: 'Missing required fields: business_name, business_owner, business_type, and road_id are required' }, { status: 400 });
    }

    // Check if business name already exists at this location (excluding current business)
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('business_name', business_name)
      .eq('road_id', road_id)
      .eq('sub_road_id', sub_road_id || null)
      .eq('business_address', business_address || null)
      .eq('is_deleted', false)
      .neq('id', businessId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Business name already exists at this location' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('businesses')
      .update({
        business_name,
        business_owner,
        business_type,
        business_address: business_address || null,
        road_id,
        sub_road_id: sub_road_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    const { data, error } = await supabase
      .from('businesses')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}