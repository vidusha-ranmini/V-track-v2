import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserActivityLogs, getRecentLogins } from '../../../lib/activityLogger';

// Helper function to verify admin token
function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieToken = request.cookies.get('auth_token')?.value;
  const token = bearerToken || cookieToken;

  if (!token) return false;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { username: string; isAdmin: boolean };
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const username = searchParams.get('username') || undefined;
    const action_type = searchParams.get('action_type') || undefined;
    const resource_type = searchParams.get('resource_type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const start_date = searchParams.get('start_date') || undefined;
    const end_date = searchParams.get('end_date') || undefined;
    const recent_logins_only = searchParams.get('recent_logins') === 'true';

    // Handle recent logins request
    if (recent_logins_only) {
      const recentLogins = await getRecentLogins(limit);
      return NextResponse.json({
        success: true,
        data: recentLogins,
        count: recentLogins.length,
        message: 'Recent login activities retrieved successfully'
      });
    }

    // Get activity logs with filters
    const { data, count, error } = await getUserActivityLogs({
      username,
      action_type,
      resource_type,
      limit,
      offset,
      start_date,
      end_date
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch activity logs: ' + error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count,
      filters: {
        username,
        action_type,
        resource_type,
        limit,
        offset,
        start_date,
        end_date
      },
      message: 'Activity logs retrieved successfully'
    });

  } catch (error) {
    console.error('Activity logs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST endpoint to manually log activities (if needed)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { logUserActivity } = await import('../../../lib/activityLogger');

    const success = await logUserActivity(body);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Manual activity log error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}