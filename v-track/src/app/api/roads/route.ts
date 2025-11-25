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
    
    // First check if a road with this name already exists
    const { data: existingRoad, error: checkError } = await supabase
      .from('roads')
      .select('id, name')
      .eq('name', name)
      .eq('is_deleted', false)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      console.error('Error checking for existing road:', checkError);
      throw checkError;
    }

    if (existingRoad) {
      return NextResponse.json(
        { error: `A road named "${name}" already exists. Please choose a different name.` },
        { status: 409 } // Conflict status
      );
    }
    
    const { data, error } = await supabase
      .from('roads')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `A road named "${name}" already exists. Please choose a different name.` },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating road:', error);
    
    // Check if it's a duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { error: `A road named "${name}" already exists. Please choose a different name.` },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create road. Please try again.' },
      { status: 500 }
    );
  }
}