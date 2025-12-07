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
      // Check for duplicate NICs before inserting
      const nics = members.map((m: { nic: string }) => m.nic);
      const { data: existingMembers } = await supabase
        .from('members')
        .select('nic')
        .in('nic', nics)
        .eq('is_deleted', false);

      if (existingMembers && existingMembers.length > 0) {
        const duplicateNICs = existingMembers.map(m => m.nic).join(', ');
        throw new Error(`Duplicate NIC(s) found: ${duplicateNICs}. These members already exist in the system.`);
      }

      const membersWithHouseholdId = members.map((member: {
        fullName: string;
        nameWithInitial: string;
        memberType: string;
        nic: string;
        gender: string;
        age: number;
        occupation: string;
        workplace?: string;
        schoolName?: string;
        grade?: string;
        universityName?: string;
        otherOccupation?: string;
        offersReceiving?: string[];
        isDisabled: boolean;
        landHouseStatus: string;
        whatsappNumber?: string;
        isDrugUser?: boolean;
        isThief?: boolean;
        mahapola?: boolean;
        aswasuma?: boolean;
        wadihitiDimana?: boolean;
      }) => ({
        household_id: household.id,
        full_name: member.fullName,
        name_with_initial: member.nameWithInitial,
        member_type: member.memberType,
        nic: member.nic,
        gender: member.gender,
        age: member.age,
        occupation: member.occupation,
        workplace: member.workplace,
        school_name: member.schoolName,
        grade: member.grade ? parseInt(member.grade) : null,
        university_name: member.universityName,
        other_occupation: member.otherOccupation,
        offers_receiving: member.offersReceiving,
        is_disabled: member.isDisabled,
        land_house_status: member.landHouseStatus,
        whatsapp_number: member.whatsappNumber,
        is_drug_user: member.isDrugUser || false,
        is_thief: member.isThief || false,
        mahapola: member.mahapola || false,
        aswasuma: member.aswasuma || false,
        wadihiti_dimana: member.wadihitiDimana || false,
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create household';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}