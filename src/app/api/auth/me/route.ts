import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/crypto';
import { usersStore } from '@/lib/auth/users_store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('safenexa_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = verifySessionToken(sessionCookie);

    if (!payload) {
      return NextResponse.json({ authenticated: false, error: 'Session expired or invalid.' }, { status: 401 });
    }

    const user = usersStore.findById(payload.userId) || usersStore.findByEmail(payload.email);

    if (!user) {
      return NextResponse.json({ authenticated: false, error: 'User record not found.' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/auth/me:', error);
    return NextResponse.json({ authenticated: false, error: 'Authentication check failed.' }, { status: 500 });
  }
}
