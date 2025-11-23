import { supabaseAdmin, UserActivityLog } from './supabase';

export interface ActivityLogData {
  username: string;
  action_type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export';
  resource_type?: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log user activity to the database
 */
export async function logUserActivity(data: ActivityLogData): Promise<boolean> {
  try {
    console.log('📝 Logging user activity:', {
      username: data.username,
      action: data.action_type,
      resource: data.resource_type,
      description: data.description
    });

    // Check if supabaseAdmin is properly configured
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not configured');
      return false;
    }

    // Prepare the data with explicit null handling
    const insertData = {
      username: data.username,
      action_type: data.action_type,
      resource_type: data.resource_type || null,
      resource_id: data.resource_id || null,
      description: data.description || null,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      metadata: data.metadata || null
    };

    console.log('📦 Insert data:', insertData);

    const { data: result, error } = await supabaseAdmin
      .from('user_activity_logs')
      .insert([insertData])
      .select();

    if (error) {
      console.error('❌ Failed to log user activity:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('✅ User activity logged successfully:', result);
    return true;
  } catch (error) {
    console.error('💥 Error logging user activity:', error);
    return false;
  }
}

/**
 * Get user activity logs with filtering options
 */
export async function getUserActivityLogs(options?: {
  username?: string;
  action_type?: string;
  resource_type?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}): Promise<{ data: UserActivityLog[]; count: number; error?: string }> {
  try {
    let query = supabaseAdmin
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (options?.username) {
      query = query.eq('username', options.username);
    }

    if (options?.action_type) {
      query = query.eq('action_type', options.action_type);
    }

    if (options?.resource_type) {
      query = query.eq('resource_type', options.resource_type);
    }

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date);
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Failed to fetch activity logs:', error);
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('💥 Error fetching activity logs:', error);
    return { data: [], count: 0, error: (error as Error).message };
  }
}

/**
 * Get recent login activities
 */
export async function getRecentLogins(limit: number = 10): Promise<UserActivityLog[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_activity_logs')
      .select('*')
      .eq('action_type', 'login')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch recent logins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('💥 Error fetching recent logins:', error);
    return [];
  }
}

/**
 * Helper function to extract IP address from request
 */
export function getClientIP(request: Request): string | undefined {
  // Try different headers in order of preference
  const headers = request.headers;
  
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  const xClientIP = headers.get('x-client-ip');
  if (xClientIP) {
    return xClientIP;
  }

  return undefined;
}

/**
 * Helper function to get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}