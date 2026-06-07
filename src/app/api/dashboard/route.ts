import { NextResponse } from 'next/server';
import { getPolicies, getPaymentSchedules, getClaims } from '@/lib/db';

export async function GET() {
  try {
    const policies = await getPolicies();
    const schedules = await getPaymentSchedules();
    const claims = await getClaims();
    
    // 1. Total Primas Intermediadas (Suma de prima_total de todas las pólizas vigentes y por vencer)
    const activePolicies = policies.filter(p => p.estado === 'Vigente' || p.estado === 'Por Vencer');
    const primasIntermediadas = activePolicies.reduce((sum, p) => sum + p.prima_total, 0);
    const comisionesProyectadas = activePolicies.reduce((sum, p) => sum + p.comision_total, 0);
    
    // 2. Comisiones Cobradas (Comisiones de las cuotas marcadas como 'Cobrado')
    const comisionesCobradas = schedules
      .filter(s => s.estado_comision === 'Cobrado')
      .reduce((sum, s) => sum + s.comision_cuota_broker, 0);
      
    // 3. Tasa de Retención (Pólizas Vigentes / (Vigentes + Vencidas + Anuladas))
    const totalStatusCount = policies.length;
    const activeCount = policies.filter(p => p.estado === 'Vigente' || p.estado === 'Por Vencer').length;
    const retentionRate = totalStatusCount > 0 ? Math.round((activeCount / totalStatusCount) * 100) : 100;
    
    // 4. Cobranzas pendientes del mes actual (Junio 2026 - las de fecha '2026-06-XX' con estado 'Pendiente' o 'Vencido')
    const pendingCollectionsThisMonth = schedules
      .filter(s => s.fecha_vencimiento.startsWith('2026-06-') && (s.estado_pago === 'Pendiente' || s.estado_pago === 'Vencido'))
      .reduce((sum, s) => sum + s.monto_cuota_cliente, 0);
      
    // 5. Cobros recibidos (monto total recaudado de cuotas pagadas)
    const cobrosRecibidos = schedules
      .filter(s => s.estado_pago === 'Pagado')
      .reduce((sum, s) => sum + s.monto_cuota_cliente, 0);
      
    // 6. Aviso de vencimiento de pólizas del mes (Pólizas con fecha fin en junio 2026, o estado 'Por Vencer')
    const vencimientosMes = policies.filter(p => p.estado === 'Por Vencer' || p.fecha_fin.startsWith('2026-06-')).length;
    
    // 7. Distribución por Aseguradora (Suma de primas o conteo)
    const shareByInsurer: Record<string, number> = {};
    policies.forEach(p => {
      const name = p.compania_aseguradora;
      shareByInsurer[name] = (shareByInsurer[name] || 0) + p.prima_total;
    });
    const shareByInsurerArray = Object.keys(shareByInsurer).map(key => ({
      name: key,
      value: Number(shareByInsurer[key].toFixed(2))
    }));
    
    // 8. Distribución por Ramo
    const shareByRamo: Record<string, number> = {};
    policies.forEach(p => {
      const name = p.ramo;
      shareByRamo[name] = (shareByRamo[name] || 0) + p.prima_total;
    });
    const shareByRamoArray = Object.keys(shareByRamo).map(key => ({
      name: key,
      value: Number(shareByRamo[key].toFixed(2))
    }));

    // 9. Siniestralidad de Cartera Vigente (Siniestros Liquidados en vigencias actuales / Primas Netas vigencias actuales)
    const activePolicyIds = new Set(activePolicies.map(p => p.id));
    const activeClaims = claims.filter(c => activePolicyIds.has(c.id_poliza) && c.estado === 'Liquidado');
    const totalMontoSiniestrosVigentes = activeClaims.reduce((sum, c) => sum + c.monto_siniestro, 0);
    const totalPrimasNetasVigentes = activePolicies.reduce((sum, p) => sum + p.prima_neta, 0);
    const siniestralidadVigente = totalPrimasNetasVigentes > 0 ? (totalMontoSiniestrosVigentes / totalPrimasNetasVigentes) * 100 : 0;

    // 10. Siniestralidad Acumulada Cartera (Total Siniestros Liquidados / Total Primas Netas)
    const liquidatedClaims = claims.filter(c => c.estado === 'Liquidado');
    const totalMontoSiniestrosAcumulados = liquidatedClaims.reduce((sum, c) => sum + c.monto_siniestro, 0);
    const totalPrimasNetasAcumuladas = policies.reduce((sum, p) => sum + p.prima_neta, 0);
    const siniestralidadAcumulada = totalPrimasNetasAcumuladas > 0 ? (totalMontoSiniestrosAcumulados / totalPrimasNetasAcumuladas) * 100 : 0;
    
    return NextResponse.json({
      primasIntermediadas: Number(primasIntermediadas.toFixed(2)),
      comisionesProyectadas: Number(comisionesProyectadas.toFixed(2)),
      comisionesCobradas: Number(comisionesCobradas.toFixed(2)),
      retentionRate,
      pendingCollectionsThisMonth: Number(pendingCollectionsThisMonth.toFixed(2)),
      cobrosRecibidos: Number(cobrosRecibidos.toFixed(2)),
      vencimientosMes,
      shareByInsurer: shareByInsurerArray,
      shareByRamo: shareByRamoArray,
      siniestralidadVigente: Number(siniestralidadVigente.toFixed(2)),
      siniestralidadAcumulada: Number(siniestralidadAcumulada.toFixed(2)),
      totalMontoSiniestrosVigentes: Number(totalMontoSiniestrosVigentes.toFixed(2)),
      totalPrimasNetasVigentes: Number(totalPrimasNetasVigentes.toFixed(2)),
      totalMontoSiniestrosAcumulados: Number(totalMontoSiniestrosAcumulados.toFixed(2)),
      totalPrimasNetasAcumuladas: Number(totalPrimasNetasAcumuladas.toFixed(2))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al calcular métricas' }, { status: 500 });
  }
}
