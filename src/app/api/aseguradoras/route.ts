import { NextResponse } from 'next/server';
import { getAseguradoras, createAseguradora, updateAseguradora, deleteAseguradora } from '@/lib/db';

export async function GET() {
  try {
    const list = await getAseguradoras();
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener aseguradoras' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, nombre, telefono, ejecutivo, email, direccion } = body;

    if (action === 'create') {
      if (!nombre || !telefono || !ejecutivo || !email || !direccion) {
        return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
      }
      const newAseg = await createAseguradora({
        nombre,
        telefono,
        ejecutivo,
        email,
        direccion
      });
      return NextResponse.json({ success: true, aseguradora: newAseg });
    }

    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'ID requerido para actualizar' }, { status: 400 });
      }
      const updated = await updateAseguradora(Number(id), {
        nombre,
        telefono,
        ejecutivo,
        email,
        direccion
      });
      return NextResponse.json({ success: true, aseguradora: updated });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'ID requerido para eliminar' }, { status: 400 });
      }
      await deleteAseguradora(Number(id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar aseguradora' }, { status: 500 });
  }
}

