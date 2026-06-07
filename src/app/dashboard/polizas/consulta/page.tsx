'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  User, 
  Building2, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  ArrowLeft,
  XCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface Policy {
  id: string;
  id_cliente: string;
  compania_aseguradora: string;
  ramo: string;
  numero_poliza: string;
  suma_asegurada: number;
  deducibles: string;
  coberturas: string;
  prima_neta: number;
  gastos_emision: number;
  igv: number;
  prima_total: number;
  porcentaje_comision: number;
  comision_total: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'Vigente' | 'Por Vencer' | 'Vencida' | 'Anulada';
  moneda?: 'USD' | 'PEN';
  periodicidad?: 'Anual' | 'Semestral' | 'Mensual';
}

interface Client {
  id: string;
  nombre: string;
  documento_tipo: string;
  documento_numero: string;
  email: string;
  telefono: string;
}

interface PaymentSchedule {
  id: string;
  id_poliza: string;
  numero_cuota: number;
  monto_cuota_cliente: number;
  comision_cuota_broker: number;
  fecha_vencimiento: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Vencido';
  estado_comision: 'Pendiente' | 'Cobrado';
  fecha_pago?: string;
  medio_pago?: string;
  nro_operacion?: string;
  banco?: string;
}

interface Claim {
  id: string;
  id_poliza: string;
  fecha_evento: string;
  tipo_siniestro: string;
  ajustador: string;
  estado: string;
  monto_siniestro: number;
}

import { Suspense } from 'react';

function ConsultaPolizaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const policyId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (val: number, cur?: 'USD' | 'PEN') => {
    const symbol = cur === 'PEN' ? 'S/.' : 'USD';
    return `${symbol} ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    if (!policyId) return;

    async function fetchPolicyData() {
      try {
        setLoading(true);
        // Load policy
        const polRes = await fetch('/api/polizas');
        if (!polRes.ok) throw new Error('Error fetching policy');
        const pols: Policy[] = await polRes.json();
        const foundPol = pols.find(p => p.id === policyId);
        if (!foundPol) throw new Error('Policy not found');
        setPolicy(foundPol);

        // Load client
        const cliRes = await fetch('/api/clientes');
        if (cliRes.ok) {
          const clis: Client[] = await cliRes.json();
          const foundCli = clis.find(c => c.id === foundPol.id_cliente);
          if (foundCli) setClient(foundCli);
        }

        // Load schedules
        const schRes = await fetch('/api/cronograma');
        if (schRes.ok) {
          const schs: PaymentSchedule[] = await schRes.json();
          setSchedules(schs.filter(s => s.id_poliza === policyId));
        }

        // Load claims
        const claimsRes = await fetch('/api/siniestros');
        if (claimsRes.ok) {
          const clms: Claim[] = await claimsRes.json();
          setClaims(clms.filter(c => c.id_poliza === policyId));
        }

      } catch (err) {
        console.error('Error fetching policy consultation details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicyData();
  }, [policyId]);

  if (!policyId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <XCircle size={48} style={{ color: '#EF4444', marginBottom: '15px' }} />
        <h3>Identificador de póliza no especificado</h3>
        <p>Por favor intente abrir la póliza nuevamente desde la pantalla de gestión.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px' }}>
        <div className="avatar-circle animate-blink-update" style={{ width: '48px', height: '48px', backgroundColor: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={24} />
        </div>
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Cargando datos de consulta de póliza...</span>
      </div>
    );
  }

  if (!policy) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <XCircle size={48} style={{ color: '#EF4444', marginBottom: '15px' }} />
        <h3>Póliza no encontrada</h3>
        <p>No se pudo cargar la información de la póliza solicitada. Podría haber sido eliminada.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '10px 15px' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={24} style={{ color: '#64748B' }} />
              Consulta de Póliza Histórica
            </h1>
            <span className={`badge ${
              policy.estado === 'Vencida' ? 'badge-danger' : 
              policy.estado === 'Anulada' ? 'badge-danger' : 'badge-secondary'
            }`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Póliza {policy.estado}
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Vista de sólo lectura. Los datos históricos de esta póliza no deben ser modificados.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.close()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <XCircle size={16} />
          Cerrar Ventana
        </button>
      </div>

      {/* Warning Alert */}
      <div className="premium-card" style={{ display: 'flex', gap: '15px', padding: '12px 20px', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#64748B', flexShrink: 0 }}>
          <Info size={16} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>
          Esta póliza no está vigente. Cada póliza tiene su propio historial de datos inalterable para auditoría.
        </span>
      </div>

      {/* Main Grid: Policy & Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px', marginBottom: '25px' }}>
        
        {/* Left Side: General Info */}
        <div className="premium-card" style={{ margin: 0, padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', marginBottom: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: '#64748B' }} />
            Información General y Coberturas
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Número de Póliza</label>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{policy.numero_poliza}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Compañía Aseguradora</label>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{policy.compania_aseguradora}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Ramo</label>
              <span className="badge badge-secondary" style={{ fontSize: '12px', marginTop: '2px' }}>{policy.ramo}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Periodicidad</label>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{policy.periodicidad || 'Anual'}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Vigencia Inicio</label>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{formatDateToLocal(policy.fecha_inicio)}</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Vigencia Término</label>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{formatDateToLocal(policy.fecha_fin)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Asegurado Titular</label>
              {client ? (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={16} style={{ color: '#64748B' }} />
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A', display: 'block' }}>{client.nombre}</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{client.documento_tipo}: {client.documento_numero} | Tel: {client.telefono}</span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '13.5px', color: '#94A3B8' }}>Cliente no especificado</span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Coberturas Contratadas</label>
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px', color: '#334155', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                {policy.coberturas || 'Sin coberturas predefinidas registradas.'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Deducibles y Copagos</label>
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px', color: '#334155', minHeight: '40px' }}>
                {policy.deducibles || 'No especificados.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Financial Math Model & Pricing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div className="premium-card" style={{ margin: 0, padding: '24px', background: '#F8FAFC' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', marginBottom: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} style={{ color: '#64748B' }} />
              Resumen de Primas y Comisiones
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                <span>Moneda del Contrato:</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{policy.moneda || 'USD'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                <span>Prima Neta:</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(policy.prima_neta, policy.moneda)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                <span>Gastos de Emisión (3%):</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(policy.gastos_emision, policy.moneda)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                <span>IGV (18%):</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(policy.igv, policy.moneda)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed #E2E8F0', paddingTop: '8px', fontWeight: 700, color: '#0F172A' }}>
                <span>Prima Total Cliente:</span>
                <span style={{ color: '#2563EB' }}>{formatCurrency(policy.prima_total, policy.moneda)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Comisión Broker %</label>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>{policy.porcentaje_comision}%</span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Comisión Total</label>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#047857' }}>{formatCurrency(policy.comision_total, policy.moneda)}</span>
              </div>
            </div>
          </div>

          {/* Related Claims Summary */}
          <div className="premium-card" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: '#EF4444' }} />
              Siniestros Registrados en esta Vigencia ({claims.length})
            </h3>
            {claims.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>No se reportaron siniestros durante esta vigencia.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {claims.map((claim) => (
                  <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#334155', display: 'block' }}>{claim.tipo_siniestro}</span>
                      <span style={{ color: '#64748B', fontSize: '11px' }}>Fecha: {formatDateToLocal(claim.fecha_evento)} | Ajustador: {claim.ajustador || 'N/D'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#DC2626', display: 'block' }}>
                        {formatCurrency(claim.monto_siniestro, policy.moneda)}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '1px 4px' }}>
                        {claim.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Bottom Grid: Payment Installments Schedule (Cronograma) */}
      <div className="premium-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: '#64748B' }} />
          Historial de Cronograma de Cuotas Realizado
        </h3>

        {schedules.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>No se generó un cronograma de pagos para esta póliza.</p>
        ) : (
          <div className="table-responsive">
            <table className="premium-table" style={{ fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <th>Nro Cuota</th>
                  <th>Fecha Vencimiento</th>
                  <th>Monto Cliente</th>
                  <th>Estado Pago Cliente</th>
                  <th>Detalles de Cobranza (Recibo)</th>
                  <th>Comisión Broker</th>
                  <th>Estado Comisión Broker</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>Cuota {item.numero_cuota}</td>
                    <td>{formatDateToLocal(item.fecha_vencimiento)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.monto_cuota_cliente, policy.moneda)}</td>
                    <td>
                      <span className={`badge ${
                        item.estado_pago === 'Pagado' ? 'badge-success' :
                        item.estado_pago === 'Vencido' ? 'badge-danger' : 'badge-info'
                      }`}>
                        {(item.estado_pago || 'Pendiente').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {item.estado_pago === 'Pagado' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#475569' }}>
                          <span><strong>Fecha Cobro:</strong> {formatDateToLocal(item.fecha_pago || '')}</span>
                          <span><strong>Medio:</strong> {item.medio_pago || '-'}</span>
                          {item.banco && <span><strong>Banco:</strong> {item.banco}</span>}
                          {item.nro_operacion && <span><strong>Op/Ref:</strong> {item.nro_operacion}</span>}
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Cobranza pendiente</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#047857' }}>
                      {formatCurrency(item.comision_cuota_broker, policy.moneda)}
                    </td>
                    <td>
                      <span className={`badge ${
                        item.estado_comision === 'Cobrado' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {item.estado_comision === 'Cobrado' ? 'COBRADO' : 'PENDIENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function ConsultaPolizaPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px' }}>
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Cargando datos...</span>
      </div>
    }>
      <ConsultaPolizaContent />
    </Suspense>
  );
}
