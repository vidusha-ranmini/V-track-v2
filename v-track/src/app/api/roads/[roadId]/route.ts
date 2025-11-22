import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const body = await request.json();
    const { name } = body;
    const { roadId } = await params;

    if (!name) {
      return NextResponse.json({ error: 'Road name is required' }, { status: 400 });
    }

    // Check if road name already exists (excluding current road)
    const { data: existing } = await supabase
      .from('roads')
      .select('id')
      .eq('name', name)
      .eq('is_deleted', false)
      .neq('id', roadId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Road name already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('roads')
      .update({
        name
      })
      .eq('id', roadId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Road not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update road' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roadId: string }> }
) {
  try {
    const { roadId } = await params;

    // Check if road has dependent data
    const [subRoadsCheck, lampsCheck, householdsCheck] = await Promise.all([
      supabase.from('sub_roads').select('id').eq('road_id', roadId).eq('is_deleted', false).limit(1),
      supabase.from('road_lamps').select('id').eq('road_id', roadId).eq('is_deleted', false).limit(1),
      supabase.from('households').select('id').eq('road_id', roadId).eq('is_deleted', false).limit(1)
    ]);

    if (subRoadsCheck.data && subRoadsCheck.data.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete road. It has associated sub-roads. Please delete them first.' 
      }, { status: 400 });
    }

    if (lampsCheck.data && lampsCheck.data.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete road. It has associated road lamps. Please delete them first.' 
      }, { status: 400 });
    }

    if (householdsCheck.data && householdsCheck.data.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete road. It has associated households. Please delete them first.' 
      }, { status: 400 });
    }

    // Soft delete the road
    const { data, error } = await supabase
      .from('roads')
      .update({ 
        is_deleted: true
      })
      .eq('id', roadId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Road not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Road deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete road' }, { status: 500 });
  }
}