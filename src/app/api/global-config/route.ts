import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGlobalConfig, updateGlobalConfig } from '@/lib/db';

export async function GET() {
  try {
    const config = await getGlobalConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching global config:', error);
    return NextResponse.json({ error: 'Error al obtener la configuración global' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insureone_session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.rol !== 'Superadmin') {
      return NextResponse.json({ error: 'Acceso restringido para Superadmins' }, { status: 403 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Datos de configuración requeridos' }, { status: 400 });
    }

    const updatedConfig = await updateGlobalConfig(config);
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('Error in POST global-config:', error);
    return NextResponse.json({ error: 'Error al actualizar la configuración global' }, { status: 500 });
  }
}
