import { NextResponse } from 'next/server';
import { mockDashboardStats } from '@/lib/mockData';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      return NextResponse.json(mockDashboardStats);
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    // Get total members (not deleted)
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get total households (not deleted)
    const { count: totalHouseholds } = await supabase
      .from('households')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get total businesses (not deleted)
    const { count: totalBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get total road lamps (not deleted)
    const { count: totalRoadLamps } = await supabase
      .from('road_lamps')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get working lamps
    const { count: workingLamps } = await supabase
      .from('road_lamps')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('status', 'working');

    // Get broken lamps
    const { count: brokenLamps } = await supabase
      .from('road_lamps')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('status', 'broken');

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      totalHouseholds: totalHouseholds || 0,
      totalBusinesses: totalBusinesses || 0,
      totalRoadLamps: totalRoadLamps || 0,
      workingLamps: workingLamps || 0,
      brokenLamps: brokenLamps || 0,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return mock data as fallback
    return NextResponse.json(mockDashboardStats);
  }
}