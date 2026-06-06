import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createTenant, createTenantPago, setActiveTenantId, updateCurrentUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nombres, 
      apellidos, 
      correo, 
      celular, 
      username, 
      password, 
      ruc, 
      razonSocial, 
      plan 
    } = body;

    // Validate required fields
    if (!nombres || !apellidos || !correo || !username || !password || !ruc || !razonSocial) {
      return NextResponse.json({ error: 'Todos los campos obligatorios son requeridos.' }, { status: 400 });
    }

    if (ruc.length !== 11) {
      return NextResponse.json({ error: 'El RUC debe constar de exactamente 11 dígitos.' }, { status: 400 });
    }

    const fechaInicioDate = new Date();
    const fechaFinDate = new Date();
    
    const suscripcionTipo = plan === 'anual' ? 'Anual' : 'Mensual';
    if (suscripcionTipo === 'Anual') {
      fechaFinDate.setFullYear(fechaInicioDate.getFullYear() + 1);
    } else {
      fechaFinDate.setMonth(fechaInicioDate.getMonth() + 1);
    }

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const fechaInicio = formatDate(fechaInicioDate);
    const fechaFin = formatDate(fechaFinDate);

    // 1. Create the new Tenant record
    const newTenant = await createTenant({
      nombre: razonSocial,
      ruc: ruc,
      razon_social: razonSocial,
      estado: 'Activo',
      suscripcion_tipo: suscripcionTipo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      logo_url: '',
      admin_email: correo,
      admin_password: password
    });

    // 2. Create the payment record (Culqui simulation)
    const paymentAmount = plan === 'anual' ? 490.00 : 49.00;
    await createTenantPago({
      id_tenant: newTenant.id,
      monto: paymentAmount,
      fecha_pago: fechaInicio,
      metodo_pago: 'Tarjeta de Crédito (Culqui)',
      estado: 'Pagado',
      comprobante_nro: `CULQUI-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
    });

    // 3. Create the session object
    const sessionUser = {
      id: `USR-${newTenant.id}`,
      nombre: `${nombres} ${apellidos}`,
      email: correo,
      rol: 'Admin' as const, // Visitor created account becomes the Admin of their tenant
      avatar: razonSocial.substring(0, 2).toUpperCase(),
      id_tenant: newTenant.id
    };

    // 4. Set cookie and database state fallback
    const cookieStore = await cookies();
    cookieStore.set('insureone_session', JSON.stringify(sessionUser), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    await setActiveTenantId(newTenant.id);
    await updateCurrentUser(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error) {
    console.error('Error in register API:', error);
    return NextResponse.json({ error: 'Error al registrar el usuario' }, { status: 500 });
  }
}
