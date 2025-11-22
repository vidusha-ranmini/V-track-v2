import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      whatsapp_number
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
        whatsapp_number
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