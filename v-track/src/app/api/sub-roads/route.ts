import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('sub_roads')
      .select('*')
      .eq('is_deleted', false)
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-roads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, road_id } = body;

    if (!name || !road_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if sub-road name already exists for this road
    const { data: existing } = await supabase
      .from('sub_roads')
      .select('id')
      .eq('name', name)
      .eq('road_id', road_id)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Sub-road name already exists for this road' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('sub_roads')
      .insert({ name, road_id })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to create sub-road' }, { status: 500 });
  }
}