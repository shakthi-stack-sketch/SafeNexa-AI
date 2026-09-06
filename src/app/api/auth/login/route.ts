import { NextRequest, NextResponse } from 'next/server';
import { usersStore } from '@/lib/auth/users_store';
import { createSessionToken } from '@/lib/auth/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe = true } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Work email and password are required.' },
        { status: 400 }
      );
    }

    const authResult = usersStore.verifyCredentials(email, password);

    if (!authResult || !authResult.verified) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please verify your credentials.' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Create cryptographically signed session token
    const token = createSessionToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
      rememberMe
    );

    const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24; // 7 days or 1 day

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Authentication successful',
    });

    // Set HttpOnly session cookie
    response.cookies.set('safenexa_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error) {
    console.error('Error in POST /api/auth/login:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
