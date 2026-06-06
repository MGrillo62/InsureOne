import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('insureone_session');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in logout API:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}

// Support GET requests as fallback for redirects if needed
export async function GET() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('insureone_session');
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  } catch (error) {
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
