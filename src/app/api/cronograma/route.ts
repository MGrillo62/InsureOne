import { NextResponse } from 'next/server';
import { getPaymentSchedules, updatePaymentStatus } from '@/lib/db';

export async function GET() {
  try {
    const schedules = await getPaymentSchedules();
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cronogramas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id, estado_pago, estado_comision, importData } = body;
    
    if (action === 'updateStatus') {
      if (!id) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      }
      const updated = await updatePaymentStatus(id, estado_pago, estado_comision);
      return NextResponse.json({ success: true, item: updated });
    }
    
    if (action === 'importExcel') {
      const { getPolicies } = await import('@/lib/db');
      const policies = await getPolicies();
      const schedules = await getPaymentSchedules();
      
      const updatedCount = { client: 0, broker: 0 };
      const logs: string[] = [];
      
      if (Array.isArray(importData)) {
        for (const row of importData) {
          const { policy_number, cuota_number, client_paid, commission_cobrada } = row;
          
          const policy = policies.find(p => p.numero_poliza === policy_number);
          if (policy) {
            const schedule = schedules.find(
              c => c.id_poliza === policy.id && 
                   c.numero_cuota === Number(cuota_number)
            );
            
            if (schedule) {
              let updated = false;
              let nextPago = schedule.estado_pago;
              let nextComision = schedule.estado_comision;
              
              if (client_paid === 'Pagado' && schedule.estado_pago !== 'Pagado') {
                nextPago = 'Pagado';
                updatedCount.client++;
                updated = true;
              }
              if (commission_cobrada === 'Cobrado' && schedule.estado_comision !== 'Cobrado') {
                nextComision = 'Cobrado';
                updatedCount.broker++;
                updated = true;
              }
              
              if (updated) {
                await updatePaymentStatus(schedule.id, nextPago, nextComision);
                logs.push(`Póliza ${policy_number} Cuota ${cuota_number}: Conciliado exitosamente.`);
              }
            } else {
              logs.push(`Cuota ${cuota_number} no encontrada para Póliza ${policy_number}.`);
            }
          } else {
            logs.push(`Póliza con número ${policy_number} no existe.`);
          }
        }
      }
      
      return NextResponse.json({ success: true, updatedCount, logs });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error in API cronograma:', error);
    return NextResponse.json({ error: 'Error al conciliar pagos' }, { status: 500 });
  }
}
