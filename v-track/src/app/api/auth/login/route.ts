import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logUserActivity, getClientIP, getUserAgent } from '../../../../lib/activityLogger';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; windowStart: number }>();

function normalizeEnvValue(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\\$/g, '$');
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return normalizeEnvValue(value);
}

function isPlaceholderHash(value: string): boolean {
  return (
    value === 'your_hashed_password_here' ||
    value === 'SECURE_HASH_OF_YOUR_PASSWORD'
  );
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

function getLoginAttemptKey(request: NextRequest, username: string): string {
  const ip = getClientIP(request) || 'unknown-ip';
  return `${ip}:${username}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry) {
    return false;
  }

  if (now - entry.windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }

  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const existing = loginAttempts.get(key);

  if (!existing || now - existing.windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, windowStart: now });
    return;
  }

  loginAttempts.set(key, {
    count: existing.count + 1,
    windowStart: existing.windowStart,
  });
}

function clearFailedAttempts(key: string): void {
  loginAttempts.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    let body: { username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const loginAttemptKey = getLoginAttemptKey(request, username);
    if (isRateLimited(loginAttemptKey)) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    let adminUsername = '';
    let adminPasswordHash = '';
    let jwtSecret = '';
    try {
      adminUsername = getRequiredEnv('ADMIN_USERNAME');
      adminPasswordHash = getRequiredEnv('ADMIN_PASSWORD_HASH');
      jwtSecret = getRequiredEnv('JWT_SECRET');
    } catch (configError) {
      console.error('Login configuration error:', configError);
      return NextResponse.json(
        { error: 'Authentication service is not configured' },
        { status: 503 }
      );
    }

    if (jwtSecret.length < 32 || isPlaceholderHash(adminPasswordHash) || !isBcryptHash(adminPasswordHash)) {
      console.error('Login configuration error: invalid admin auth environment values');
      return NextResponse.json(
        { error: 'Authentication service is not configured' },
        { status: 503 }
      );
    }

    if (username !== adminUsername) {
      recordFailedAttempt(loginAttemptKey);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, adminPasswordHash);
    } catch {
      return NextResponse.json(
        { error: 'Authentication system error' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      recordFailedAttempt(loginAttemptKey);
      
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

    clearFailedAttempts(loginAttemptKey);

    const user = { username, isAdmin: true as const };
    const token = jwt.sign(user, jwtSecret, { expiresIn: '24h' });

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

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}