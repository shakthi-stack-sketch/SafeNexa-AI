import { NextRequest, NextResponse } from 'next/server';
import { usersStore } from '@/lib/auth/users_store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid corporate work email address.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersStore.findByEmail(normalizedEmail);

    // Provide honest, enterprise-level recovery feedback without fabricating an external email dispatch
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active enterprise account found matching this work email address.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Password recovery request registered for ' +
        normalizedEmail +
        '. In compliance with Oil & Gas enterprise security protocols, credentials must be verified with your HSE System Administrator (admin@safenexa.com) or organizational identity provider.',
    });
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error);
    return NextResponse.json(
      { error: 'Failed to process password recovery request.' },
      { status: 500 }
    );
  }
}
