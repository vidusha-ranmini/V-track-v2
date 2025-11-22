import { NextResponse } from 'next/server';
import { mockRoads } from '@/lib/mockData';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      return NextResponse.json(mockRoads);
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    const { data: roads, error } = await supabase
      .from('roads')
      .select('*')
      .eq('is_deleted', false)
      .order('name');

    if (error) throw error;

    return NextResponse.json(roads || []);
  } catch (error) {
    console.error('Error fetching roads:', error);
    // Return mock data as fallback
    return NextResponse.json(mockRoads);
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock success response
      return NextResponse.json({
        id: Date.now().toString(),
        name,
        created_at: new Date().toISOString(),
        is_deleted: false
      });
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('roads')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating road:', error);
    return NextResponse.json(
      { error: 'Failed to create road' },
      { status: 500 }
    );
  }
}