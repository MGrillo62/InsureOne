import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateTenantCredentials, updateTenant } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const tenant = await validateTenantCredentials(username, password);
    
    if (!tenant) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    // Update connection log in Lima time
    const connectionTime = new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    await updateTenant(tenant.id, { ultima_conexion: connectionTime });

    // Determine user role and properties based on tenant and credentials
    const isSuper = tenant.id === 'T-001' && (username === 'superadmin' || username === 'admin@insureone.com');
    const sessionUser = {
      id: isSuper ? 'USR-001' : `USR-${tenant.id}`,
      nombre: isSuper ? 'Super Admin' : tenant.nombre,
      email: tenant.admin_email || 'admin@insureone.com',
      rol: (isSuper ? 'Superadmin' : 'Admin') as 'Superadmin' | 'Admin',
      avatar: tenant.nombre.substring(0, 2).toUpperCase(),
      id_tenant: tenant.id
    };

    const cookieStore = await cookies();
    cookieStore.set('insureone_session', JSON.stringify(sessionUser), {
      path: '/',
      httpOnly: false, // Make it accessible in client if needed, or secure
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
