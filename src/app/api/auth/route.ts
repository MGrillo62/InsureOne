import { NextResponse } from 'next/server';
import { getCurrentUser, updateCurrentUser } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, nombre, email, password, newPassword } = body;
    
    if (action === 'updateProfile') {
      await updateCurrentUser({ nombre, email });
      const user = await getCurrentUser();
      return NextResponse.json({ success: true, user });
    }
    
    if (action === 'changePassword') {
      // For mock purposes, we just simulate password validation and update
      return NextResponse.json({ success: true, message: 'Contraseña cambiada exitosamente' });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
