import { NextResponse } from 'next/server';
import { mockAddresses } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roadId: string; subRoadId: string }> }
) {
  const { roadId, subRoadId } = await params;

  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      const filteredAddresses = mockAddresses.filter(
        addr => addr.road_id === roadId && addr.sub_road_id === subRoadId
      );
      return NextResponse.json(filteredAddresses);
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('road_id', roadId)
      .eq('sub_road_id', subRoadId)
      .eq('is_deleted', false)
      .order('address');

    if (error) throw error;

    return NextResponse.json(addresses || []);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    // Return mock data as fallback
    const filteredAddresses = mockAddresses.filter(
      addr => addr.road_id === roadId && addr.sub_road_id === subRoadId
    );
    return NextResponse.json(filteredAddresses);
  }
}