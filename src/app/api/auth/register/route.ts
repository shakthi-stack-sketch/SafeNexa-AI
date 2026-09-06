import { NextRequest, NextResponse } from 'next/server';
import { usersStore } from '@/lib/auth/users_store';
import { createSessionToken } from '@/lib/auth/crypto';
import { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_ROLES: UserRole[] = ['HSE Officer', 'HSE Manager', 'Administrator'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, organization, role, password, confirmPassword, adminAuthCode } = body;

    // 1. Required fields check: Full Name, Email, Password, Confirm Password
    if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Full Name, Email, Password, and Confirm Password are required.' },
        { status: 400 }
      );
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    // 3. Clean role & organization
    const assignedRole: UserRole = VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : 'HSE Officer';
    const assignedOrg = organization?.trim() || 'General HSE';

    // 4. Password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // 5. Password length requirement
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must contain at least 8 characters.' },
        { status: 400 }
      );
    }

    // 6. Create user in store
    const result = usersStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      organization: assignedOrg,
      role: assignedRole,
      password,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const { user } = result;

    // Account created successfully. Returns user info to proceed to login.
    return NextResponse.json(
      {
        success: true,
        user,
        message: 'Account created successfully.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account creation.' },
      { status: 500 }
    );
  }
}
