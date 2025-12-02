import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Check if this is a stats request
    const { searchParams } = new URL(request.url);
    const isStatsRequest = searchParams.get('stats') === 'true';

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      if (isStatsRequest) {
        return NextResponse.json({
          totalProjects: 0,
          developedProjects: 0,
          undevelopedProjects: 0,
          inProgressProjects: 0,
          totalEstimatedCost: 0
        });
      }
      return NextResponse.json([]);
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    if (isStatsRequest) {
      // Get statistics using the database function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_road_development_stats');

      if (statsError) throw statsError;

      return NextResponse.json(statsData[0] || {
        totalProjects: 0,
        developedProjects: 0,
        undevelopedProjects: 0,
        inProgressProjects: 0,
        totalEstimatedCost: 0
      });
    }
    
    // Use the new road_development_summary view for better performance
    const { data, error } = await supabase
      .from('road_development_summary')
      .select('*')
      .order('road_name, sub_road_name, sub_sub_road_name');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Transform the data to match our component interface
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      roadName: item.road_name || 'Unknown Road',
      subRoadName: item.sub_road_name,
      subSubRoadName: item.sub_sub_road_name,
      width: Number(item.width) || 25,
      height: Number(item.height) || 10,
      squareFeet: Number(item.square_feet) || 250,
      costPerSqFt: Number(item.cost_per_sq_ft) || 400,
      totalCost: Number(item.total_cost) || 0,
      developmentStatus: item.development_status || 'undeveloped',
      roadType: item.road_type || 'main',
      createdAt: item.created_at || new Date().toISOString()
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching road development data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch road development data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log('📥 POST request body received:', requestBody);
    
    const { 
      road_id, 
      parent_sub_road_id, 
      name, 
      width,
      height,
      cost_per_sq_ft = 400,
      development_status = 'undeveloped'
    } = requestBody;
    
    console.log('🔄 Using values:', {
      width,
      height,
      cost_per_sq_ft,
      development_status
    });
    
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
    
    // Prepare insert data with database field names
    let insertData = {
      road_id,
      parent_sub_road_id,
      name,
      is_deleted: false,
      width,
      height,
      cost_per_sq_ft,
      total_cost,
      development_status,
      square_feet
    };
    
    console.log('📤 Insert data prepared:', insertData);
    
    const { data, error } = await supabase
      .from('sub_sub_roads')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('📋 Database error during insert:', error);
      throw error;
    }

    console.log('✅ Insert successful, data returned:', data);

    // Return the data with proper field mapping for the frontend
    const responseData = {
      ...data,
      // Ensure width and height are properly returned
      width: data.width,
      height: data.height,
      square_feet: data.square_feet || (data.width * data.height),
      cost_per_sq_ft: data.cost_per_sq_ft,
      total_cost: data.total_cost,
      development_status: data.development_status
    };

    console.log('📤 Response data:', responseData);
    return NextResponse.json(responseData);
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

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock success response
      return NextResponse.json({ success: true });
    }

    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    // Soft delete by setting is_deleted to true
    const { data, error } = await supabase
      .from('sub_sub_roads')
      .update({ is_deleted: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting road development:', error);
    return NextResponse.json(
      { error: 'Failed to delete road development' },
      { status: 500 }
    );
  }
}

