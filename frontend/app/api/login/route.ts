// app/api/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  // Mock auth: accept any non-empty email/password
  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password required' },
      { status: 400 }
    );
  }

  // Example failure path
  if (email === 'fail@example.com') {
    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Success
  return NextResponse.json({ ok: true });
}
