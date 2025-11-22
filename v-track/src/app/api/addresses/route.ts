import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roadId = searchParams.get('road_id');
    const subRoadId = searchParams.get('sub_road_id');
    
    let query = supabase
      .from('addresses')
      .select('*')
      .eq('is_deleted', false);

    // Filter by road_id if provided
    if (roadId) {
      query = query.eq('road_id', roadId);
      
      // Handle sub_road_id filtering
      if (subRoadId) {
        query = query.eq('sub_road_id', subRoadId);
      } else {
        // If roadId is provided but subRoadId is not, get main road addresses (sub_road_id is null)
        query = query.is('sub_road_id', null);
      }
    }

    const { data, error } = await query.order('address');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, road_id, sub_road_id, member } = body;

    if (!address || !road_id) {
      return NextResponse.json({ error: 'Address and road_id are required' }, { status: 400 });
    }

    // Check if address already exists for this location
    let existingQuery = supabase
      .from('addresses')
      .select('id')
      .eq('address', address)
      .eq('road_id', road_id)
      .eq('is_deleted', false);

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
      .insert({ 
        address, 
        road_id, 
        sub_road_id: sub_road_id || null,
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