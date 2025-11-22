import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subSubRoadId: string }> }
) {
  try {
    const body = await request.json();
    const { name, road_id, parent_sub_road_id, development_status } = body;
    const { subSubRoadId } = await params;

    if (!name || !road_id || !parent_sub_road_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if sub-sub-road name already exists for this parent sub-road (excluding current)
    const { data: existing } = await supabase
      .from('sub_sub_roads')
      .select('id')
      .eq('name', name)
      .eq('parent_sub_road_id', parent_sub_road_id)
      .eq('is_deleted', false)
      .neq('id', subSubRoadId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Sub-sub-road name already exists for this sub-road' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('sub_sub_roads')
      .update({
        name,
        road_id,
        parent_sub_road_id,
        development_status: development_status || 'undeveloped'
      })
      .eq('id', subSubRoadId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sub-sub-road not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update sub-sub-road' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subSubRoadId: string }> }
) {
  try {
    const { subSubRoadId } = await params;

    const { data, error } = await supabase
      .from('sub_sub_roads')
      .update({ 
        is_deleted: true
      })
      .eq('id', subSubRoadId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sub-sub-road not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sub-sub-road deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete sub-sub-road' }, { status: 500 });
  }
}