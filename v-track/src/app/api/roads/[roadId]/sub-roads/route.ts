import { NextResponse } from 'next/server';
import { mockSubRoads } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roadId: string }> }
) {
  const { roadId } = await

 try{
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      const filteredSubRoads = mockSubRoads.filter(sr => sr.road_id === roadId);
      return NextResponse.json(filteredSubRoads);
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    const { data: subRoads, error } = await supabase
      .from('sub_roads')
      .select('*')
      .eq('road_id', roadId)
      .eq('is_deleted', false)
      .order('name');

    if (error) throw error;

    return NextResponse.json(subRoads || []);
  } catch (error) {
    console.error('Error fetching sub-roads:', error);
    // Return mock data as fallback
    const filteredSubRoads = mockSubRoads.filter(sr => sr.road_id === roadId);
    return NextResponse.json(filteredSubRoads);
  }
}