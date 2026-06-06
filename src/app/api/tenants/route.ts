import { NextResponse } from 'next/server';
import { getTenants, getActiveTenantId, setActiveTenantId, readDB, writeDB, createTenant, updateTenant } from '@/lib/db';

export async function GET() {
  try {
    const tenants = getTenants();
    const activeTenantId = getActiveTenantId();
    return NextResponse.json({ tenants, activeTenantId });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, activeTenantId, id, tenant } = body;
    
    if (action === 'create') {
      if (!tenant || !tenant.nombre) {
        return NextResponse.json({ error: 'Nombre de tenant es requerido' }, { status: 400 });
      }
      const newTenant = createTenant(tenant);
      return NextResponse.json({ success: true, tenant: newTenant });
    }
    
    if (action === 'update') {
      if (!id || !tenant) {
        return NextResponse.json({ error: 'ID y datos de tenant son requeridos' }, { status: 400 });
      }
      const updatedTenant = updateTenant(id, tenant);
      return NextResponse.json({ success: true, tenant: updatedTenant });
    }
    
    // Default: Switch active tenant
    const tId = activeTenantId || id;
    if (!tId) {
      return NextResponse.json({ error: 'ID de tenant requerido' }, { status: 400 });
    }
    
    setActiveTenantId(tId);
    
    // Update currentUser tenant context
    const db = readDB();
    db.currentUser.id_tenant = tId;
    writeDB(db);
    
    return NextResponse.json({ success: true, activeTenantId: tId });
  } catch (error) {
    console.error('Error in API tenants:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de tenants' }, { status: 500 });
  }
}
