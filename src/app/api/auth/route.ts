import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setActiveTenantId, updateCurrentUser, updateTenantPassword } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insureone_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Sync database session variables on the server side
    await setActiveTenantId(sessionUser.id_tenant);
    await updateCurrentUser(sessionUser);

    return NextResponse.json(sessionUser);
  } catch (error) {
    console.error('Error in auth GET API:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insureone_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const body = await request.json();
    const { action, nombre, email } = body;

    if (action === 'updateProfile') {
      const updatedUser = {
        ...sessionUser,
        nombre: nombre || sessionUser.nombre,
        email: email || sessionUser.email,
        avatar: (nombre || sessionUser.nombre).substring(0, 2).toUpperCase()
      };

      // Save updated user to cookie
      cookieStore.set('insureone_session', JSON.stringify(updatedUser), {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      await setActiveTenantId(updatedUser.id_tenant);
      await updateCurrentUser(updatedUser);

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === 'changePassword') {
      const { password, newPassword } = body;
      if (!password || !newPassword) {
        return NextResponse.json({ error: 'Contraseña actual y nueva requeridas' }, { status: 400 });
      }

      const success = await updateTenantPassword(sessionUser.id_tenant, password, newPassword);
      if (!success) {
        return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Contraseña cambiada exitosamente' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth POST API:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
