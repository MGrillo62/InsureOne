import { NextResponse } from 'next/server';
import { getClients, createClient, updateClient, addClientHistory } from '@/lib/db';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, tipo, nombre, documento_tipo, documento_numero, email, telefono, direccion, id_parent, noteAction, noteText } = body;
    
    if (action === 'create') {
      const newClient = await createClient({
        tipo,
        nombre,
        documento_tipo,
        documento_numero,
        email,
        telefono,
        direccion,
        id_parent: id_parent || undefined
      });
      return NextResponse.json({ success: true, client: newClient });
    }
    
    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'ID requerido para actualizar' }, { status: 400 });
      }
      const updated = await updateClient(id, {
        tipo,
        nombre,
        documento_tipo,
        documento_numero,
        email,
        telefono,
        direccion,
        id_parent: id_parent || undefined
      });
      return NextResponse.json({ success: true, client: updated });
    }
    
    if (action === 'addNote') {
      const { fecha_cumplimiento } = body;
      if (!id || !noteAction || !noteText) {
        return NextResponse.json({ error: 'ID, noteAction y noteText requeridos' }, { status: 400 });
      }
      await addClientHistory(id, noteAction, noteText, fecha_cumplimiento);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar cliente' }, { status: 500 });
  }
}
