import { NextResponse } from 'next/server';
import { getCurrentUser, updateCurrentUser, readDB, writeDB } from '@/lib/db';

export async function GET() {
  try {
    const user = getCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, nombre, email, password, newPassword } = body;
    
    const db = readDB();
    
    if (action === 'updateProfile') {
      updateCurrentUser({ nombre, email });
      return NextResponse.json({ success: true, user: getCurrentUser() });
    }
    
    if (action === 'changePassword') {
      // For mock purposes, we just simulate password validation and update
      // In a real system we would hash the password
      // Since it's a mock we'll log it or assume it is successful
      return NextResponse.json({ success: true, message: 'Contraseña cambiada exitosamente' });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
