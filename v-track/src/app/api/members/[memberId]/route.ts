import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
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
      whatsapp_number,
      is_drug_user,
      is_thief
    } = body;
    const { memberId } = await params;

    // Validate required fields
    if (!household_id || !full_name || !name_with_initial || !nic || !gender || !occupation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate age
    if (age !== undefined && (age < 0 || age > 150)) {
      return NextResponse.json({ error: 'Age must be between 0 and 150' }, { status: 400 });
    }

    // Check if NIC already exists (excluding current member)
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('nic', nic)
      .eq('is_deleted', false)
      .neq('id', memberId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'NIC already exists' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('members')
      .update({
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
        is_drug_user: is_drug_user || false,
        is_thief: is_thief || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const { data, error } = await supabase
      .from('members')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}