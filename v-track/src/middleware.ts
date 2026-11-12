import { NextRequest, NextResponse } from 'next/server';

type SessionRole = 'admin' | 'road-manager';

const encoder = new TextEncoder();
const roadApiPrefixes = [
  '/api/roads',
  '/api/sub-roads',
  '/api/sub-sub-roads',
  '/api/addresses',
  '/api/road-lamps',
];

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function normalizeSecret(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\\$/g, '$');
}

async function getSessionRole(token: string | undefined): Promise<SessionRole | null> {
  const secretValue = process.env.JWT_SECRET;
  if (!token || !secretValue) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const headerBytes = decodeBase64Url(parts[0]);
  const payloadBytes = decodeBase64Url(parts[1]);
  const signature = decodeBase64Url(parts[2]);
  if (!headerBytes || !payloadBytes || !signature) return null;

  try {
    const header = JSON.parse(new TextDecoder().decode(headerBytes)) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const secret = normalizeSecret(secretValue);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as BufferSource,
      encoder.encode(`${parts[0]}.${parts[1]}`)
    );
    if (!validSignature) return null;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as {
      exp?: number;
      isAdmin?: boolean;
      role?: string;
    };
    if (typeof payload.exp !== 'number' || Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (payload.role === 'road-manager' && payload.isAdmin === false) {
      return 'road-manager';
    }
    if (payload.isAdmin === true && (payload.role === undefined || payload.role === 'admin')) {
      return 'admin';
    }
  } catch {
    return null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    return NextResponse.next();
  }

  const role = await getSessionRole(request.cookies.get('auth_token')?.value);
  if (!role) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (
    role === 'road-manager' &&
    !roadApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
