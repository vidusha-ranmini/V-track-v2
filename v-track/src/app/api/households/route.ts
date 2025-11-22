import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { homeDetails, members, addressId } = await request.json();
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock success response for testing
      const mockHousehold = {
        id: Date.now().toString(),
        address_id: addressId,
        assessment_number: homeDetails.assessmentNumber,
        resident_type: homeDetails.residentType,
        waste_disposal: homeDetails.wasteDisposal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };
      
      console.log('Mock household created:', mockHousehold);
      console.log('Mock members:', members);
      
      return NextResponse.json({
        message: 'Household created successfully (mock mode)',
        household: mockHousehold,
      });
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();

    // Start a transaction by creating the household first
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert([{
        address_id: addressId,
        assessment_number: homeDetails.assessmentNumber,
        resident_type: homeDetails.residentType,
        waste_disposal: homeDetails.wasteDisposal,
      }])
      .select()
      .single();

    if (householdError) throw householdError;

    // Then insert all members
    if (members.length > 0) {
      const membersWithHouseholdId = members.map((member: {
        fullName: string;
        nameWithInitial: string;
        memberType: string;
        nic: string;
        gender: string;
        age: number;
        occupation: string;
        schoolName?: string;
        grade?: string;
        universityName?: string;
        otherOccupation?: string;
        offersReceiving?: string[];
        isDisabled: boolean;
        landHouseStatus: string;
        whatsappNumber?: string;
        requiresSpecialMonitoring?: boolean;
      }) => ({
        household_id: household.id,
        full_name: member.fullName,
        name_with_initial: member.nameWithInitial,
        member_type: member.memberType,
        nic: member.nic,
        gender: member.gender,
        age: member.age,
        occupation: member.occupation,
        school_name: member.schoolName,
        grade: member.grade ? parseInt(member.grade) : null,
        university_name: member.universityName,
        other_occupation: member.otherOccupation,
        offers_receiving: member.offersReceiving,
        is_disabled: member.isDisabled,
        land_house_status: member.landHouseStatus,
        whatsapp_number: member.whatsappNumber,
        requires_special_monitoring: member.requiresSpecialMonitoring || false,
      }));

      const { error: membersError } = await supabase
        .from('members')
        .insert(membersWithHouseholdId);

      if (membersError) throw membersError;
    }

    return NextResponse.json({
      message: 'Household created successfully',
      household,
    });

  } catch (error) {
    console.error('Error creating household:', error);
    return NextResponse.json(
      { error: 'Failed to create household' },
      { status: 500 }
    );
  }
}