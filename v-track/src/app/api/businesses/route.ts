import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        roads!businesses_road_id_fkey(name),
        sub_roads!businesses_sub_road_id_fkey(name)
      `)
      .eq('is_deleted', false)
      .order('business_name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten the joined data
    const transformedData = data?.map(business => ({
      ...business,
      road_name: business.roads?.name,
      sub_road_name: business.sub_roads?.name,
      address: business.business_address // Use the business_address field
    })) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, business_owner, business_type, business_address, road_id, sub_road_id } = body;

    // Validate required fields
    if (!business_name || !business_owner || !business_type || !road_id) {
      return NextResponse.json({ error: 'Missing required fields: business_name, business_owner, business_type, and road_id are required' }, { status: 400 });
    }

    // Check if business name already exists at this location
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('business_name', business_name)
      .eq('road_id', road_id)
      .eq('sub_road_id', sub_road_id || null)
      .eq('business_address', business_address || null)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Business name already exists at this location' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        business_name,
        business_owner,
        business_type,
        business_address: business_address || null,
        road_id,
        sub_road_id: sub_road_id || null
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
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}