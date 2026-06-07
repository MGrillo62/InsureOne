import { NextResponse } from 'next/server';
import { getClaims, createClaim, updateClaimStatus, addClaimLog } from '@/lib/db';

export async function GET() {
  try {
    const claims = await getClaims();
    return NextResponse.json(claims);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener siniestros' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, id_poliza, id_cliente, fecha_evento, tipo_siniestro, ajustador, estado, motivo, proximo_control, monto_siniestro } = body;
    
    if (action === 'create') {
      if (!id_poliza || !id_cliente || !fecha_evento || !tipo_siniestro) {
        return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
      }
      const newClaim = await createClaim({
        id_poliza,
        id_cliente,
        fecha_evento,
        tipo_siniestro,
        ajustador: ajustador || 'Por asignar',
        estado: estado || 'Reportado',
        monto_siniestro: Number(monto_siniestro || 0)
      });
      return NextResponse.json({ success: true, claim: newClaim });
    }
    
    if (action === 'updateStatus') {
      if (!id || !estado) {
        return NextResponse.json({ error: 'ID y Estado requeridos' }, { status: 400 });
      }
      const updated = await updateClaimStatus(id, estado);
      return NextResponse.json({ success: true, claim: updated });
    }
    
    if (action === 'addLog') {
      if (!id || !motivo || !proximo_control) {
        return NextResponse.json({ error: 'ID, motivo y proximo_control requeridos' }, { status: 400 });
      }
      const updated = await addClaimLog(id, motivo, proximo_control);
      return NextResponse.json({ success: true, claim: updated });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar siniestro' }, { status: 500 });
  }
}
