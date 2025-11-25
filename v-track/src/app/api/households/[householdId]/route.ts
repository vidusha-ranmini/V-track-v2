import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  try {
    const body = await request.json();
    const {
      assessment_number,
      resident_type,
      waste_disposal
    } = body;
    const { householdId } = await params;

    // Validate required fields
    if (!assessment_number || !resident_type || !waste_disposal) {
      return NextResponse.json({ error: 'Missing required household fields' }, { status: 400 });
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock success response for testing
      const mockHousehold = {
        id: householdId,
        assessment_number,
        resident_type,
        waste_disposal,
        updated_at: new Date().toISOString()
      };
      
      console.log('Mock household updated:', mockHousehold);
      return NextResponse.json(mockHousehold);
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('households')
      .update({
        assessment_number,
        resident_type,
        waste_disposal,
        updated_at: new Date().toISOString()
      })
      .eq('id', householdId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update household' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  try {
    const { householdId } = await params;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data
      const mockHousehold = {
        id: householdId,
        assessment_number: 'MOCK001',
        resident_type: 'permanent',
        waste_disposal: 'municipal',
        address_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };
      
      return NextResponse.json(mockHousehold);
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', householdId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch household' }, { status: 500 });
  }
}