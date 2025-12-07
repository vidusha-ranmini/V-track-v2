import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      return NextResponse.json([]);
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('sub_roads')
      .select('id, name, road_id')
      .eq('is_deleted', false)
      .order('name');

    if (error) {
      console.error('Database error fetching sub-roads:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching sub-roads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-roads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, road_id } = body;

    if (!name || !road_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

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