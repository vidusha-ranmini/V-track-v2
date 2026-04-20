import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

    const json =
      typeof window === 'undefined'
        ? Buffer.from(padded, 'base64').toString('utf-8')
        : atob(padded);

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface AuthUser {
  username: string;
  isAdmin: true;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPasswordHash = getRequiredEnv('ADMIN_PASSWORD_HASH');
  getRequiredEnv('ADMIN_USERNAME');

  if (
    adminPasswordHash === 'your_hashed_password_here' ||
    adminPasswordHash === 'SECURE_HASH_OF_YOUR_PASSWORD'
  ) {
    throw new Error('ADMIN_PASSWORD_HASH must be set to a real bcrypt hash');
  }

  return await bcrypt.compare(password, adminPasswordHash);
}

export function generateToken(user: AuthUser): string {
  const jwtSecret = getRequiredEnv('JWT_SECRET');
  return jwt.sign(user, jwtSecret, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = decodePayload(token);
    if (!payload) return null;

    const username = payload.username;
    const isAdmin = payload.isAdmin;
    const exp = payload.exp;

    if (typeof username !== 'string' || isAdmin !== true) {
      return null;
    }

    if (typeof exp === 'number' && Date.now() >= exp * 1000) {
      return null;
    }

    return { username, isAdmin: true };
  } catch {
    return null;
  }
}

export async function checkAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  return verifyToken(token) !== null;
}

export function logout(): void {
  if (typeof window !== 'undefined') {

    fetch('/api/auth/logout', {
      method: 'POST',
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {
      // Ignore logout endpoint failures and still clear local token.
    });

    localStorage.removeItem('auth_token');
  }
}