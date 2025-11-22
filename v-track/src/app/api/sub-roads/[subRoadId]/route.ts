import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ subRoadId: string }> }
) {
  try {
    const body = await request.json();
    const { name, road_id } = body;
    const { subRoadId } = await params;

    if (!name || !road_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if sub-road name already exists for this road (excluding current)
    const { data: existing } = await supabase
      .from('sub_roads')
      .select('id')
      .eq('name', name)
      .eq('road_id', road_id)
      .eq('is_deleted', false)
      .neq('id', subRoadId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Sub-road name already exists for this road' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('sub_roads')
      .update({
        name,
        road_id
      })
      .eq('id', subRoadId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sub-road not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update sub-road' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subRoadId: string }> }
) {
  try {
    const { subRoadId } = await params;

    const { data, error } = await supabase
      .from('sub_roads')
      .update({ 
        is_deleted: true
      })
      .eq('id', subRoadId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Sub-road not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Sub-road deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete sub-road' }, { status: 500 });
  }
}