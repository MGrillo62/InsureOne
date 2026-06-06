'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Percent, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Bell
} from 'lucide-react';

interface DashboardMetrics {
  primasIntermediadas: number;
  comisionesProyectadas: number;
  comisionesCobradas: number;
  retentionRate: number;
  pendingCollectionsThisMonth: number;
  cobrosRecibidos: number;
  vencimientosMes: number;
  shareByInsurer: Array<{ name: string; value: number }>;
  shareByRamo: Array<{ name: string; value: number }>;
}

interface AlertItem {
  id: string;
  tipo: 'poliza' | 'cuota' | 'lead';
  descripcion: string;
  detalle: string;
  fecha: string;
  monto?: number;
  estado: string;
}

export default function DashboardPage() {
  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isDateInCurrentWeek = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    
    const leadDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    
    // Domingo de la semana actual
    const startOfWeek = new Date(today);
    const day = today.getDay();
    startOfWeek.setDate(today.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    // Sábado de la semana actual
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return leadDate >= startOfWeek && leadDate <= endOfWeek;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }

      // Generate urgent alerts based on database status
      const polRes = await fetch('/api/polizas');
      const schRes = await fetch('/api/cronograma');
      const cliRes = await fetch('/api/clientes');
      const leadsRes = await fetch('/api/leads');

      if (polRes.ok && schRes.ok && cliRes.ok && leadsRes.ok) {
        const policies = await polRes.json();
        const schedules = await schRes.json();
        const clients = await cliRes.json();
        const leads = await leadsRes.json();

        const alertList: AlertItem[] = [];

        // 1. Check for policies in state 'Por Vencer'
        policies.forEach((p: any) => {
          if (p.estado === 'Por Vencer') {
            const client = clients.find((c: any) => c.id === p.id_cliente);
            alertList.push({
              id: p.id,
              tipo: 'poliza',
              descripcion: `Póliza ${p.ramo} por vencer`,
              detalle: `Póliza Nro ${p.numero_poliza} de ${client?.nombre || 'Cliente'} vence el ${p.fecha_fin}.`,
              fecha: p.fecha_fin,
              estado: 'warning'
            });
          }
        });

        // 2. Check for payment schedules in state 'Vencido' or 'Pendiente' due soon (June 2026)
        schedules.forEach((s: any) => {
          if (s.estado_pago === 'Vencido') {
            const policy = policies.find((p: any) => p.id === s.id_poliza);
            const client = policy ? clients.find((c: any) => c.id === policy.id_cliente) : null;
            alertList.push({
              id: s.id,
              tipo: 'cuota',
              descripcion: 'Cuota de cliente vencida',
              detalle: `Cuota ${s.numero_cuota} de póliza ${policy?.numero_poliza || ''} de ${client?.nombre || 'Cliente'} venció el ${s.fecha_vencimiento}.`,
              fecha: s.fecha_vencimiento,
              monto: s.monto_cuota_cliente,
              estado: 'danger'
            });
          }
        });

        // 3. Check for leads follow-up in the current week
        leads.forEach((l: any) => {
          if (l.fecha_seguimiento && isDateInCurrentWeek(l.fecha_seguimiento)) {
            alertList.push({
              id: `lead-${l.id}`,
              tipo: 'lead',
              descripcion: 'Seguimiento de Prospecto',
              detalle: `El prospecto ${l.nombre} tiene fecha de seguimiento programada para el ${formatDateToLocal(l.fecha_seguimiento)}.`,
              fecha: l.fecha_seguimiento,
              estado: 'info'
            });
          }
        });

        // Ordenar las alertas por fecha (más antiguas/vencidas primero)
        alertList.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        setAlerts(alertList.slice(0, 5)); // cap to 5 urgent alerts
      }
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !metrics) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px' }}>
        <RefreshCw size={36} className="animate-blink-update" style={{ color: '#2563EB' }} />
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Cargando analíticas del bróker...</span>
      </div>
    );
  }

  // Insurer chart max height scaler
  const insurerMax = Math.max(...metrics.shareByInsurer.map(x => x.value), 1);
  // Ramo chart max height scaler
  const ramoMax = Math.max(...metrics.shareByRamo.map(x => x.value), 1);

  // Harmanious colors for charts
  const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

  return (
    <div className="animate-fade-in">
      
      {/* Title bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Dashboard Analítico de Cartera</h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Indicadores generales de primas intermediadas, cobranzas del mes y avisos de renovación.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
          <RefreshCw size={14} style={{ marginRight: '5px' }} />
          Actualizar
        </button>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Primas Intermediadas</h3>
            <div className="kpi-value">USD {metrics.primasIntermediadas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#10B981' }}>
              <TrendingUp size={12} />
              +12.4% vs mes anterior
            </span>
          </div>
          <div className="kpi-icon">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Comisiones Proyectadas</h3>
            <div className="kpi-value">USD {metrics.comisionesProyectadas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#64748B' }}>
              Comisión promedio: 13.8%
            </span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)', color: '#047857' }}>
            <DollarSign size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Comisiones Cobradas</h3>
            <div className="kpi-value">USD {metrics.comisionesCobradas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#10B981' }}>
              Reconciliado: {Math.round((metrics.comisionesCobradas / (metrics.comisionesProyectadas || 1)) * 100)}%
            </span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Tasa de Retención</h3>
            <div className="kpi-value">{metrics.retentionRate}%</div>
            <span className="kpi-subtitle" style={{ color: '#10B981' }}>
              Meta del año: 95%
            </span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
            <Percent size={18} />
          </div>
        </div>
      </div>

      {/* MONTHLY SUMMARY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#EF4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>Cobranzas Pendientes de Junio</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'var(--font-title)' }}>
              USD {metrics.pendingCollectionsThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#D1FAE5', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>Cobros Recaudados de Clientes</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'var(--font-title)' }}>
              USD {metrics.cobrosRecibidos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#F59E0B' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>Pólizas por Vencer este Mes</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '2px', fontFamily: 'var(--font-title)' }}>
              {metrics.vencimientosMes} Renovaciones
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
        
        {/* CHART 1: DISTRIBUTION BY INSURER */}
        <div className="premium-card" style={{ margin: 0 }}>
          <div className="card-header">
            <h2 style={{ fontSize: '16px' }}>Distribución de Cartera por Aseguradora (Primas)</h2>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <div className="chart-y-axis">
                <span>USD {Math.round(insurerMax).toLocaleString()}</span>
                <span>USD {Math.round(insurerMax / 2).toLocaleString()}</span>
                <span>0</span>
              </div>
              
              {metrics.shareByInsurer.map((item, index) => {
                const heightPct = Math.round((item.value / insurerMax) * 100);
                const color = colors[index % colors.length];
                return (
                  <div key={item.name} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${Math.max(heightPct, 5)}%`, 
                        backgroundColor: color 
                      }} 
                    />
                    <span className="chart-bar-tooltip">USD {item.value.toLocaleString()}</span>
                    <span className="chart-label">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHART 2: DISTRIBUTION BY RAMO */}
        <div className="premium-card" style={{ margin: 0 }}>
          <div className="card-header">
            <h2 style={{ fontSize: '16px' }}>Distribución de Cartera por Ramo de Seguro (Primas)</h2>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <div className="chart-y-axis">
                <span>USD {Math.round(ramoMax).toLocaleString()}</span>
                <span>USD {Math.round(ramoMax / 2).toLocaleString()}</span>
                <span>0</span>
              </div>
              
              {metrics.shareByRamo.map((item, index) => {
                const heightPct = Math.round((item.value / ramoMax) * 100);
                const color = colors[(index + 2) % colors.length];
                return (
                  <div key={item.name} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${Math.max(heightPct, 5)}%`, 
                        backgroundColor: color 
                      }} 
                    />
                    <span className="chart-bar-tooltip">USD {item.value.toLocaleString()}</span>
                    <span className="chart-label">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* LOWER ROW: URGENT ALERTS & NOTICES */}
      <div className="premium-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: '#EF4444' }} />
            <h2 style={{ fontSize: '16px' }}>Alertas Críticas y Vencimientos Urgentes</h2>
          </div>
          <Link href="/dashboard/alertas" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Despachar Alertas
            <ArrowUpRight size={14} />
          </Link>
        </div>
        
        <div className="card-body" style={{ padding: 0 }}>
          {alerts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              No hay alertas críticas pendientes. ¡Todo al día!
            </div>
          ) : (
            alerts.map((alert, i) => (
              <div 
                key={i} 
                className="animate-slide-in"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '16px 24px', 
                  borderBottom: i === alerts.length - 1 ? 'none' : '1px solid #E2E8F0' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div 
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: alert.estado === 'danger' 
                        ? 'var(--color-danger)' 
                        : alert.estado === 'info' 
                          ? '#3B82F6' 
                          : 'var(--color-warning)' 
                    }} 
                  />
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{alert.descripcion}</span>
                    <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>{alert.detalle}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {alert.monto && (
                    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '13.5px' }}>
                      USD {alert.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Vence: {formatDateToLocal(alert.fecha)}</span>
                  <Link 
                    href={alert.tipo === 'cuota' 
                      ? '/dashboard/finanzas' 
                      : alert.tipo === 'lead' 
                        ? '/dashboard/leads' 
                        : '/dashboard/polizas'
                    } 
                    className="btn-card-action"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
