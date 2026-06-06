import { NextResponse } from 'next/server';
import { createReclamacion } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nombres,
      apellidos,
      tipoDocumento,
      nroDocumento,
      domicilio,
      telefono,
      correo,
      representante,
      tipoBien,
      montoReclamado,
      descripcionBien,
      tipoReclamacion,
      detalle,
      pedido
    } = body;

    // Validate required fields
    if (!nombres || !apellidos || !tipoDocumento || !nroDocumento || !domicilio || !telefono || !correo || !tipoBien || !descripcionBien || !tipoReclamacion || !detalle || !pedido) {
      return NextResponse.json({ error: 'Todos los campos obligatorios son requeridos.' }, { status: 400 });
    }

    const newRec = await createReclamacion({
      nombres,
      apellidos,
      tipo_documento: tipoDocumento,
      nro_documento: nroDocumento,
      domicilio,
      telefono,
      correo,
      representante: representante || '',
      tipo_bien: tipoBien,
      monto_reclamado: Number(montoReclamado) || 0,
      descripcion_bien: descripcionBien,
      tipo_reclamacion: tipoReclamacion,
      detalle,
      pedido
    });

    return NextResponse.json({ success: true, reclamacion: newRec });
  } catch (error) {
    console.error('Error in complaints API:', error);
    return NextResponse.json({ error: 'Error al registrar la reclamación' }, { status: 500 });
  }
}
