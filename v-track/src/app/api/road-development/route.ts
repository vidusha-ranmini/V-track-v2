import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      return NextResponse.json(getMockRoadDevelopmentData());
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    // Query to get road development data with joins
    const { data, error } = await supabase
      .from('sub_sub_roads')
      .select(`
        id,
        name,
        development_status,
        width,
        height,
        square_feet,
        cost_per_sq_ft,
        total_cost,
        roads!inner(name),
        sub_roads(name)
      `)
      .eq('is_deleted', false)
      .order('name');

    if (error) throw error;

    // Transform the data to match our component interface
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      roadName: (item.roads && item.roads.name) || 'Unknown Road',
      subRoadName: (item.sub_roads && item.sub_roads.name) || undefined,
      subSubRoadName: item.name || '',
      width: item.width || 25,
      height: item.height || 10,
      squareFeet: item.square_feet || (item.width * item.height) || 250,
      costPerSqFt: item.cost_per_sq_ft || 400,
      totalCost: item.total_cost || 0,
      developmentStatus: item.development_status || 'undeveloped',
      roadType: (item.sub_roads && item.sub_roads.name) ? 'sub' : 'main',
      createdAt: item.created_at || new Date().toISOString()
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching road development data:', error);
    // Return mock data as fallback
    return NextResponse.json(getMockRoadDevelopmentData());
  }
}

export async function POST(request: Request) {
  try {
    const { 
      road_id, 
      parent_sub_road_id, 
      name, 
      width,
      height,
      cost_per_sq_ft = 400,
      development_status = 'undeveloped'
    } = await request.json();
    
    // Calculate square feet and total cost
    const square_feet = width * height;
    const total_cost = square_feet * cost_per_sq_ft;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock success response
      return NextResponse.json({
        id: Date.now().toString(),
        name,
        width,
        height,
        square_feet,
        cost_per_sq_ft,
        total_cost,
        development_status,
        created_at: new Date().toISOString()
      });
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('sub_sub_roads')
      .insert([{
        road_id,
        parent_sub_road_id,
        name,
        width,
        height,
        square_feet,
        cost_per_sq_ft,
        total_cost,
        development_status,
        is_deleted: false
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating road development:', error);
    return NextResponse.json(
      { error: 'Failed to create road development' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { 
      id, 
      width,
      height,
      cost_per_sq_ft,
      development_status
    } = await request.json();
    
    // Calculate square feet and total cost
    const square_feet = width * height;
    const total_cost = square_feet * cost_per_sq_ft;
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock success response
      return NextResponse.json({
        id,
        width,
        height,
        square_feet,
        cost_per_sq_ft,
        total_cost,
        development_status,
        updated_at: new Date().toISOString()
      });
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    const updateData: any = {
      width,
      height,
      square_feet,
      cost_per_sq_ft,
      total_cost,
      development_status
    };

    const { data, error } = await supabase
      .from('sub_sub_roads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating road development:', error);
    return NextResponse.json(
      { error: 'Failed to update road development' },
      { status: 500 }
    );
  }
}

function getMockRoadDevelopmentData() {
  return [
    {
      id: '1',
      roadName: 'Pihena Maddegoda Main Road',
      subSubRoadName: '1st Lane',
      width: 25,
      height: 40,
      squareFeet: 1000, // 25 * 40
      costPerSqFt: 400,
      totalCost: 400000, // 1000 * 400
      developmentStatus: 'developed',
      roadType: 'main',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      roadName: 'Pihena Maddegoda Main Road',
      subSubRoadName: '2nd Lane',
      width: 25,
      height: 35,
      squareFeet: 875, // 25 * 35
      costPerSqFt: 400,
      totalCost: 350000, // 875 * 400
      developmentStatus: 'undeveloped',
      roadType: 'main',
      createdAt: '2024-01-16'
    },
    {
      id: '3',
      roadName: 'Temple Road',
      subRoadName: 'North Path',
      subSubRoadName: 'Temple Lane',
      width: 30,
      height: 30,
      squareFeet: 900, // 30 * 30
      costPerSqFt: 350,
      totalCost: 315000, // 900 * 350
      developmentStatus: 'in_progress',
      roadType: 'sub',
      createdAt: '2024-01-17'
    }
  ];
}