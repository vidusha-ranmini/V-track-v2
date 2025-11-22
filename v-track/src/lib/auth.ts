import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthUser {
  username: string;
  isAdmin: true;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const adminUsername = process.env.ADMIN_USERNAME;
  
  if (!adminPasswordHash || !adminUsername) {
    throw new Error('Admin credentials not configured');
  }

  // For initial setup, if no hash is set, hash the password
  if (adminPasswordHash === 'your_hashed_password_here') {
    console.log('Please hash your password and update ADMIN_PASSWORD_HASH in .env.local');
    return password === 'admin'; // Temporary fallback for development
  }

  return await bcrypt.compare(password, adminPasswordHash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function checkAuth(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  const user = verifyToken(token);
  return user !== null;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}