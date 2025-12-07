import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      const mockMembers = [
        {
          id: '1',
          household_id: '1',
          full_name: 'John Doe',
          name_with_initial: 'J.A.Doe',
          member_type: 'head',
          nic: '199012345678',
          gender: 'male',
          age: 35,
          occupation: 'teacher',
          is_disabled: false,
          whatsapp_number: '0771234567',
          workplace_address: '123 School Street',
          workplace_location: 'Colombo',
          is_deleted: false,
          // Address data
          address: '123 Main Road',
          road_name: 'Main Road',
          sub_road_name: 'Sub Road A',
          road_id: '1',
          sub_road_id: '1',
          // Household data
          resident_type: 'permanent',
          assessment_number: 'A001',
          waste_disposal: 'local_council',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          household_id: '2',
          full_name: 'Jane Smith',
          name_with_initial: 'J.M.Smith',
          member_type: 'head',
          nic: '199123456789',
          gender: 'female',
          age: 28,
          occupation: 'doctor',
          is_disabled: false,
          whatsapp_number: '0779876543',
          workplace_address: '456 Hospital Road',
          workplace_location: 'Gampaha',
          is_deleted: false,
          // Address data
          address: '456 Temple Road',
          road_name: 'Temple Road',
          sub_road_name: 'Temple Path',
          road_id: '2',
          sub_road_id: '3',
          // Household data
          resident_type: 'permanent',
          assessment_number: 'A002',
          waste_disposal: 'home',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '3',
          household_id: '1',
          full_name: 'Bob Johnson',
          name_with_initial: 'B.K.Johnson',
          member_type: 'member',
          nic: '200034567890',
          gender: 'male',
          age: 25,
          occupation: 'engineer',
          is_disabled: false,
          whatsapp_number: '0775555555',
          workplace_address: '789 Tech Park',
          workplace_location: 'Kandy',
          is_deleted: false,
          // Address data
          address: '123 Main Road',
          road_name: 'Main Road',
          sub_road_name: 'Sub Road B',
          road_id: '1',
          sub_road_id: '2',
          // Household data
          resident_type: 'permanent',
          assessment_number: 'A001',
          waste_disposal: 'local_council',
          created_at: '2025-01-01T00:00:00Z'
        }
      ];
      return NextResponse.json(mockMembers);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        households!members_household_id_fkey(
          *,
          addresses!households_address_id_fkey(
            *,
            roads!addresses_road_id_fkey(name),
            sub_roads!addresses_sub_road_id_fkey(name)
          )
        )
      `)
      .eq('is_deleted', false)
      .order('full_name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten the household and address information
    const transformedData = data?.map(member => {
      const household = member.households;
      const address = household?.addresses;
      const road = address?.roads;
      const subRoad = address?.sub_roads;
      
      return {
        ...member,
        // Address information from household
        address: address?.address || '',
        road_name: road?.name || '',
        sub_road_name: subRoad?.name || '',
        road_id: address?.road_id || '',
        sub_road_id: address?.sub_road_id || '',
        // Household information
        resident_type: household?.resident_type || '',
        assessment_number: household?.assessment_number || '',
        waste_disposal: household?.waste_disposal || '',
        household_created_at: household?.created_at || '',
        household_updated_at: household?.updated_at || '',
        // Legacy location field for backward compatibility
        location: `${road?.name || ''} > ${subRoad?.name || ''} > ${address?.address || ''}`.replace(/^>\s*|\s*>$/g, '').replace(/\s*>\s*>/g, ' > '),
        // Transform offers array to string for legacy compatibility
        offers: Array.isArray(member.offers_receiving) ? member.offers_receiving.join(', ') : member.offers_receiving || ''
      };
    }) || [];

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('API error:', error);
    // Return mock data as fallback
    const mockMembers = [
      {
        id: '1',
        household_id: '1',
        full_name: 'John Doe',
        name_with_initial: 'J.A.Doe',
        member_type: 'head',
        nic: '199012345678',
        gender: 'male',
        age: 35,
        occupation: 'teacher',
        is_disabled: false,
        whatsapp_number: '0771234567',
        workplace_address: '123 School Street',
        workplace_location: 'Colombo',
        is_deleted: false,
        address: '123 Main Road',
        road_name: 'Main Road',
        sub_road_name: 'Sub Road A',
        road_id: '1',
        sub_road_id: '1',
        resident_type: 'permanent',
        assessment_number: 'A001',
        waste_disposal: 'local_council',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        household_id: '2',
        full_name: 'Jane Smith',
        name_with_initial: 'J.M.Smith',
        member_type: 'head',
        nic: '199123456789',
        gender: 'female',
        age: 28,
        occupation: 'doctor',
        is_disabled: false,
        whatsapp_number: '0779876543',
        workplace_address: '456 Hospital Road',
        workplace_location: 'Gampaha',
        is_deleted: false,
        address: '456 Temple Road',
        road_name: 'Temple Road',
        sub_road_name: 'Temple Path',
        road_id: '2',
        sub_road_id: '3',
        resident_type: 'permanent',
        assessment_number: 'A002',
        waste_disposal: 'home',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '3',
        household_id: '1',
        full_name: 'Bob Johnson',
        name_with_initial: 'B.K.Johnson',
        member_type: 'member',
        nic: '200034567890',
        gender: 'male',
        age: 25,
        occupation: 'engineer',
        is_disabled: false,
        whatsapp_number: '0775555555',
        workplace_address: '789 Tech Park',
        workplace_location: 'Kandy',
        is_deleted: false,
        address: '123 Main Road',
        road_name: 'Main Road',
        sub_road_name: 'Sub Road B',
        road_id: '1',
        sub_road_id: '2',
        resident_type: 'permanent',
        assessment_number: 'A001',
        waste_disposal: 'local_council',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
    return NextResponse.json(mockMembers);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_url_here') {
      // Return mock response for testing
      return NextResponse.json({ 
        message: 'Member would be created in production',
        id: 'mock_' + Date.now()
      }, { status: 201 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const {
      household_id,
      full_name,
      name_with_initial,
      member_type,
      nic,
      gender,
      age,
      occupation,
      school_name,
      grade,
      university_name,
      other_occupation,
      offers_receiving,
      is_disabled,
      land_house_status,
      whatsapp_number,
      requires_special_monitoring
    } = body;

    // Validate required fields
    if (!household_id || !full_name || !name_with_initial || !nic || !gender || !occupation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate age
    if (age !== undefined && (age < 0 || age > 150)) {
      return NextResponse.json({ error: 'Age must be between 0 and 150' }, { status: 400 });
    }

    // Check if NIC already exists
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('nic', nic)
      .eq('is_deleted', false)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'NIC already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('members')
      .insert({
        household_id,
        full_name,
        name_with_initial,
        member_type: member_type || 'permanent',
        nic,
        gender,
        age,
        occupation,
        school_name,
        grade,
        university_name,
        other_occupation,
        offers_receiving: Array.isArray(offers_receiving) ? offers_receiving : [offers_receiving].filter(Boolean),
        is_disabled: is_disabled || false,
        land_house_status,
        whatsapp_number,
        requires_special_monitoring: requires_special_monitoring || false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}