import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logUserActivity, getClientIP, getUserAgent } from '../../../../lib/activityLogger';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    
    // Safely parse JSON with error handling
    let body;
    try {
      const text = await request.text();
      console.log('📦 Raw request body:', text || 'Empty body');
      
      if (!text) {
        console.log('❌ Empty request body');
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        );
      }
      
      body = JSON.parse(text);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { username, password } = body;
    console.log('📝 Parsed data:', { username, password: password ? '***' : 'undefined' });

    // Validate input
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    
    console.log('🔍 Environment check:', {
      adminUsername: adminUsername ? 'Set' : 'Missing',
      adminPasswordHash: adminPasswordHash ? 'Set' : 'Missing',
      jwtSecret: jwtSecret ? 'Set' : 'Missing'
    });

    // Check username
    if (username !== adminUsername) {
      console.log('❌ Invalid username');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    let isValidPassword = false;
    
    if (!adminPasswordHash || adminPasswordHash === 'your_hashed_password_here') {
      // Fallback for development - direct password comparison
      console.log('⚠️ Using fallback password check');
      isValidPassword = password === 'admin';
    } else {
      // Use bcrypt verification
      console.log('🔒 Using bcrypt verification');
      try {
        isValidPassword = await bcrypt.compare(password, adminPasswordHash);
      } catch (error) {
        console.log('❌ Bcrypt error:', error);
        return NextResponse.json(
          { error: 'Authentication system error' },
          { status: 500 }
        );
      }
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      
      // Log failed login attempt
      const clientIP = getClientIP(request);
      const userAgent = getUserAgent(request);
      
      await logUserActivity({
        username,
        action_type: 'login',
        description: `Failed login attempt for user ${username}`,
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: {
          login_time: new Date().toISOString(),
          success: false,
          reason: 'invalid_password'
        }
      });
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const user = { username, isAdmin: true as const };
    const token = jwt.sign(user, jwtSecret, { expiresIn: '24h' });
    
    // Log successful login activity
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);
    
    await logUserActivity({
      username,
      action_type: 'login',
      description: `User ${username} logged in successfully`,
      ip_address: clientIP,
      user_agent: userAgent,
      metadata: {
        login_time: new Date().toISOString(),
        success: true
      }
    });
    
    console.log('✅ Login successful');
    return NextResponse.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}