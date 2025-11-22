import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations, we'll create a separate admin client
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Database types
export interface Road {
  id: string;
  name: string;
  created_at: string;
  is_deleted: boolean;
}

export interface SubRoad {
  id: string;
  name: string;
  road_id: string;
  created_at: string;
  is_deleted: boolean;
}

export interface Address {
  id: string;
  address: string;
  road_id: string;
  sub_road_id: string;
  created_at: string;
  is_deleted: boolean;
}

export interface Household {
  id: string;
  address_id: string;
  assessment_number?: string;
  resident_type: 'permanent' | 'rent';
  waste_disposal: 'local_council' | 'home';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Member {
  id: string;
  household_id: string;
  full_name: string;
  name_with_initial: string;
  member_type: 'permanent' | 'temporary';
  nic: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  occupation: string;
  school_name?: string;
  grade?: number;
  university_name?: string;
  other_occupation?: string;
  offers_receiving?: string[];
  is_disabled: boolean;
  land_house_status: 'plot_of_land' | 'no_house' | 'no_house_and_land';
  whatsapp_number?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Business {
  id: string;
  business_name: string;
  business_owner: string;
  business_type: string;
  road_id: string;
  sub_road_id: string;
  address_id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface RoadLamp {
  id: string;
  lamp_number: string;
  road_id: string;
  sub_road_id: string;
  address_id: string;
  status: 'working' | 'broken';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SubSubRoad {
  id: string;
  name: string;
  road_id: string;
  parent_sub_road_id: string;
  development_status: 'developed' | 'undeveloped';
  created_at: string;
  is_deleted: boolean;
}