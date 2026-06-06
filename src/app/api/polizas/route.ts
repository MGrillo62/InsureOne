import { NextResponse } from 'next/server';
import { getPolicies, createPolicy, updatePolicy } from '@/lib/db';

export async function GET() {
  try {
    const policies = await getPolicies();
    return NextResponse.json(policies);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener pólizas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      id,
      id_cliente,
      compania_aseguradora,
      ramo,
      numero_poliza,
      suma_asegurada,
      deducibles,
      coberturas,
      prima_neta,
      gastos_emision,
      igv,
      prima_total,
      porcentaje_comision,
      comision_total,
      fecha_inicio,
      fecha_fin,
      estado,
      moneda,
      periodicidad,
      installments // number of installments (1, 2, 4, 12)
    } = body;
    
    if (action === 'create') {
      if (!id_cliente || !compania_aseguradora || !ramo || !numero_poliza || !fecha_inicio || !fecha_fin || !installments) {
        return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
      }
      
      const { policy, schedule } = await createPolicy({
        id_cliente,
        compania_aseguradora,
        ramo,
        numero_poliza,
        suma_asegurada: Number(suma_asegurada || 0),
        deducibles,
        coberturas,
        prima_neta: Number(prima_neta || 0),
        gastos_emision: Number(gastos_emision || 0),
        igv: Number(igv || 0),
        prima_total: Number(prima_total || 0),
        porcentaje_comision: Number(porcentaje_comision || 0),
        comision_total: Number(comision_total || 0),
        fecha_inicio,
        fecha_fin,
        estado: estado || 'Vigente',
        moneda: moneda || 'USD',
        periodicidad: periodicidad || 'Anual'
      }, Number(installments));
      
      return NextResponse.json({ success: true, policy, schedule });
    }
    
    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'ID requerido para actualizar' }, { status: 400 });
      }
      const updated = await updatePolicy(id, {
        compania_aseguradora,
        ramo,
        numero_poliza,
        suma_asegurada: Number(suma_asegurada || 0),
        deducibles,
        coberturas,
        prima_neta: Number(prima_neta || 0),
        gastos_emision: Number(gastos_emision || 0),
        igv: Number(igv || 0),
        prima_total: Number(prima_total || 0),
        porcentaje_comision: Number(porcentaje_comision || 0),
        comision_total: Number(comision_total || 0),
        fecha_inicio,
        fecha_fin,
        estado,
        moneda,
        periodicidad
      });
      return NextResponse.json({ success: true, policy: updated });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar póliza' }, { status: 500 });
  }
}
