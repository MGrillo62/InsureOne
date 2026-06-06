import { NextResponse } from 'next/server';
import { getPaymentSchedules, updatePaymentStatus, readDB, writeDB, addClientHistory } from '@/lib/db';

export async function GET() {
  try {
    const schedules = getPaymentSchedules();
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
      const updated = updatePaymentStatus(id, estado_pago, estado_comision);
      return NextResponse.json({ success: true, item: updated });
    }
    
    if (action === 'importExcel') {
      // Simulator for parsing excel rows and reconciling payments
      // The importData will contain rows like: [{ policy_number, cuota_number, client_paid, commission_cobrada }]
      // We look up the policy and update the schedule accordingly.
      
      const db = readDB();
      const updatedCount = { client: 0, broker: 0 };
      const logs: string[] = [];
      
      if (Array.isArray(importData)) {
        for (const row of importData) {
          const { policy_number, cuota_number, client_paid, commission_cobrada } = row;
          // Find policy
          const policy = db.polizas.find(p => p.numero_poliza === policy_number && p.id_tenant === db.activeTenantId);
          if (policy) {
            // Find specific payment cuota
            const paymentIdx = db.cronograma.findIndex(
              c => c.id_poliza === policy.id && 
                   c.numero_cuota === Number(cuota_number) && 
                   c.id_tenant === db.activeTenantId
            );
            
            if (paymentIdx !== -1) {
              let updated = false;
              if (client_paid === 'Pagado' && db.cronograma[paymentIdx].estado_pago !== 'Pagado') {
                db.cronograma[paymentIdx].estado_pago = 'Pagado';
                updatedCount.client++;
                updated = true;
              }
              if (commission_cobrada === 'Cobrado' && db.cronograma[paymentIdx].estado_comision !== 'Cobrado') {
                db.cronograma[paymentIdx].estado_comision = 'Cobrado';
                updatedCount.broker++;
                updated = true;
              }
              
              if (updated) {
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
      
      writeDB(db);
      return NextResponse.json({ success: true, updatedCount, logs });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al conciliar pagos' }, { status: 500 });
  }
}
