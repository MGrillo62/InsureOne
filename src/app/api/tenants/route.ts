import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getTenants, 
  getActiveTenantId, 
  setActiveTenantId, 
  createTenant, 
  updateTenant, 
  getTenantPagos, 
  createTenantPago,
  updateCurrentUser
} from '@/lib/db';

export async function GET() {
  try {
    const tenants = await getTenants();
    const activeTenantId = await getActiveTenantId();
    return NextResponse.json({ tenants, activeTenantId });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, activeTenantId, id, tenant, pago } = body;
    
    if (action === 'create') {
      if (!tenant || !tenant.nombre) {
        return NextResponse.json({ error: 'Nombre de tenant es requerido' }, { status: 400 });
      }
      const newTenant = await createTenant(tenant);
      return NextResponse.json({ success: true, tenant: newTenant });
    }
    
    if (action === 'update') {
      if (!id || !tenant) {
        return NextResponse.json({ error: 'ID y datos de tenant son requeridos' }, { status: 400 });
      }
      const updatedTenant = await updateTenant(id, tenant);
      return NextResponse.json({ success: true, tenant: updatedTenant });
    }

    if (action === 'getPagos') {
      if (!id) {
        return NextResponse.json({ error: 'ID de tenant es requerido' }, { status: 400 });
      }
      const pagos = await getTenantPagos(id);
      return NextResponse.json({ success: true, pagos });
    }

    if (action === 'createPago') {
      if (!id || !pago || !pago.monto || !pago.fecha_pago) {
        return NextResponse.json({ error: 'ID de tenant y datos de pago son requeridos' }, { status: 400 });
      }
      const newPago = await createTenantPago({
        id_tenant: id,
        monto: Number(pago.monto),
        fecha_pago: pago.fecha_pago,
        metodo_pago: pago.metodo_pago,
        estado: pago.estado || 'Pagado',
        comprobante_nro: pago.comprobante_nro || ''
      });
      return NextResponse.json({ success: true, pago: newPago });
    }
    
    // Default: Switch active tenant
    const tId = activeTenantId || id;
    if (!tId) {
      return NextResponse.json({ error: 'ID de tenant requerido' }, { status: 400 });
    }
    
    await setActiveTenantId(tId);

    // Sync session cookie if user is superadmin
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('insureone_session');
    if (sessionCookie && sessionCookie.value) {
      const sessionUser = JSON.parse(sessionCookie.value);
      if (sessionUser.rol === 'Superadmin') {
        sessionUser.id_tenant = tId;
        cookieStore.set('insureone_session', JSON.stringify(sessionUser), {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        await updateCurrentUser(sessionUser);
      }
    }
    
    return NextResponse.json({ success: true, activeTenantId: tId });
  } catch (error) {
    console.error('Error in API tenants:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de tenants' }, { status: 500 });
  }
}
