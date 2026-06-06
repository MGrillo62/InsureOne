import { NextResponse } from 'next/server';
import { getLeads, createLead, updateLeadStatus, deleteLead } from '@/lib/db';

export async function GET() {
  try {
    const leads = getLeads();
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, estado, nombre, compania, documento, email, telefono, direccion, giro, prima_proyectada, ramo } = body;
    
    if (action === 'create') {
      const newLead = createLead({
        nombre,
        compania,
        documento,
        email,
        telefono,
        direccion,
        giro,
        estado: estado || 'nuevo',
        prima_proyectada: Number(prima_proyectada || 0),
        ramo
      });
      return NextResponse.json({ success: true, lead: newLead });
    }
    
    if (action === 'updateStatus') {
      if (!id || !estado) {
        return NextResponse.json({ error: 'ID y Estado requeridos' }, { status: 400 });
      }
      const updated = updateLeadStatus(id, estado);
      return NextResponse.json({ success: true, lead: updated });
    }
    
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      }
      deleteLead(id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar lead' }, { status: 500 });
  }
}
