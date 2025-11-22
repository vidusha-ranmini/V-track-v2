import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      // Return mock data for testing
      return NextResponse.json({
        genderStats: [
          { label: 'Male', value: 120, color: '#3B82F6' },
          { label: 'Female', value: 95, color: '#EF4444' },
          { label: 'Other', value: 2, color: '#8B5CF6' }
        ],
        ageGroups: [
          { label: '0-17', value: 45, color: '#10B981' },
          { label: '18-35', value: 78, color: '#F59E0B' },
          { label: '36-55', value: 65, color: '#6366F1' },
          { label: '56+', value: 29, color: '#EC4899' }
        ],
        memberTypes: [
          { label: 'Permanent', value: 195, color: '#059669' },
          { label: 'Temporary', value: 22, color: '#DC2626' }
        ],
        occupations: [
          { label: 'Student', value: 67, color: '#3B82F6' },
          { label: 'Government Worker', value: 34, color: '#10B981' },
          { label: 'Private Sector', value: 28, color: '#F59E0B' },
          { label: 'Self Employed', value: 42, color: '#8B5CF6' },
          { label: 'Unemployed', value: 15, color: '#EF4444' },
          { label: 'Retired', value: 11, color: '#6B7280' },
          { label: 'Other', value: 20, color: '#EC4899' }
        ],
        disabilities: [
          { label: 'No Disability', value: 203, color: '#10B981' },
          { label: 'With Disability', value: 14, color: '#EF4444' }
        ]
      });
    }

    // If Supabase is configured, use the actual implementation
    const { createAdminClient } = await import('@/lib/supabase');
    const supabase = createAdminClient();
    
    // Get gender statistics
    const { data: genderData } = await supabase
      .from('members')
      .select('gender')
      .eq('is_deleted', false);

    const genderStats = [
      { 
        label: 'Male', 
        value: genderData?.filter(m => m.gender === 'male').length || 0,
        color: '#3B82F6'
      },
      { 
        label: 'Female', 
        value: genderData?.filter(m => m.gender === 'female').length || 0,
        color: '#EF4444'
      },
      { 
        label: 'Other', 
        value: genderData?.filter(m => m.gender === 'other').length || 0,
        color: '#8B5CF6'
      }
    ];

    // Get age group statistics
    const { data: ageData } = await supabase
      .from('members')
      .select('age')
      .eq('is_deleted', false);

    const ageGroups = [
      { 
        label: '0-17', 
        value: ageData?.filter(m => m.age >= 0 && m.age <= 17).length || 0,
        color: '#10B981'
      },
      { 
        label: '18-35', 
        value: ageData?.filter(m => m.age >= 18 && m.age <= 35).length || 0,
        color: '#F59E0B'
      },
      { 
        label: '36-55', 
        value: ageData?.filter(m => m.age >= 36 && m.age <= 55).length || 0,
        color: '#6366F1'
      },
      { 
        label: '56+', 
        value: ageData?.filter(m => m.age >= 56).length || 0,
        color: '#EC4899'
      }
    ];

    // Get member type statistics
    const { data: typeData } = await supabase
      .from('members')
      .select('member_type')
      .eq('is_deleted', false);

    const memberTypes = [
      { 
        label: 'Permanent', 
        value: typeData?.filter(m => m.member_type === 'permanent').length || 0,
        color: '#059669'
      },
      { 
        label: 'Temporary', 
        value: typeData?.filter(m => m.member_type === 'temporary').length || 0,
        color: '#DC2626'
      }
    ];

    // Get occupation statistics
    const { data: occupationData } = await supabase
      .from('members')
      .select('occupation')
      .eq('is_deleted', false);

    const occupationCounts: { [key: string]: number } = {};
    occupationData?.forEach(m => {
      const occupation = m.occupation || 'Other';
      occupationCounts[occupation] = (occupationCounts[occupation] || 0) + 1;
    });

    const occupations = Object.entries(occupationCounts)
      .map(([label, value], index) => ({
        label,
        value,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280', '#EC4899'][index % 7]
      }))
      .sort((a, b) => b.value - a.value);

    // Get disability statistics
    const { data: disabilityData } = await supabase
      .from('members')
      .select('is_disabled')
      .eq('is_deleted', false);

    const disabilities = [
      { 
        label: 'No Disability', 
        value: disabilityData?.filter(m => !m.is_disabled).length || 0,
        color: '#10B981'
      },
      { 
        label: 'With Disability', 
        value: disabilityData?.filter(m => m.is_disabled).length || 0,
        color: '#EF4444'
      }
    ];

    return NextResponse.json({
      genderStats,
      ageGroups,
      memberTypes,
      occupations,
      disabilities
    });

  } catch (error) {
    console.error('Error fetching member stats:', error);
    // Return mock data as fallback
    return NextResponse.json({
      genderStats: [
        { label: 'Male', value: 120, color: '#3B82F6' },
        { label: 'Female', value: 95, color: '#EF4444' },
        { label: 'Other', value: 2, color: '#8B5CF6' }
      ],
      ageGroups: [
        { label: '0-17', value: 45, color: '#10B981' },
        { label: '18-35', value: 78, color: '#F59E0B' },
        { label: '36-55', value: 65, color: '#6366F1' },
        { label: '56+', value: 29, color: '#EC4899' }
      ],
      memberTypes: [
        { label: 'Permanent', value: 195, color: '#059669' },
        { label: 'Temporary', value: 22, color: '#DC2626' }
      ],
      occupations: [
        { label: 'Student', value: 67, color: '#3B82F6' },
        { label: 'Government Worker', value: 34, color: '#10B981' },
        { label: 'Private Sector', value: 28, color: '#F59E0B' },
        { label: 'Self Employed', value: 42, color: '#8B5CF6' },
        { label: 'Unemployed', value: 15, color: '#EF4444' },
        { label: 'Retired', value: 11, color: '#6B7280' },
        { label: 'Other', value: 20, color: '#EC4899' }
      ],
      disabilities: [
        { label: 'No Disability', value: 203, color: '#10B981' },
        { label: 'With Disability', value: 14, color: '#EF4444' }
      ]
    });
  }
}