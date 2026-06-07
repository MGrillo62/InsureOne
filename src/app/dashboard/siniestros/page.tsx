'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  Clock, 
  FileText, 
  User, 
  Calendar, 
  Layers,
  History,
  Activity,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface Claim {
  id: string;
  id_poliza: string;
  id_cliente: string;
  fecha_evento: string;
  tipo_siniestro: string;
  ajustador: string;
  estado: 'Reportado' | 'En Evaluacion' | 'Documentacion Pendiente' | 'Liquidado' | 'Rechazado';
  fecha_creacion: string;
  bitacora: Array<{
    fecha: string;
    motivo: string;
    hora: string;
    proximo_control: string;
  }>;
  monto_siniestro: number;
}

interface Policy {
  id: string;
  numero_poliza: string;
  ramo: string;
  id_cliente: string;
  compania_aseguradora: string;
  moneda?: 'USD' | 'PEN';
}

interface Client {
  id: string;
  nombre: string;
  documento_numero: string;
}

export default function SiniestrosPage() {
  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Claim Form
  const [idCliente, setIdCliente] = useState('');
  const [idPoliza, setIdPoliza] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [tipoSiniestro, setTipoSiniestro] = useState('');
  const [ajustador, setAjustador] = useState('');
  const [montoSiniestro, setMontoSiniestro] = useState('');

  // Log Form
  const [logMotivo, setLogMotivo] = useState('');
  const [logProximoControl, setLogProximoControl] = useState('');

  const fetchData = async (selectIdAfterFetch?: string) => {
    try {
      const claimsRes = await fetch('/api/siniestros');
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
        if (selectIdAfterFetch) {
          const found = claimsData.find((c: Claim) => c.id === selectIdAfterFetch);
          if (found) setSelectedClaim(found);
        } else if (selectedClaim) {
          const updated = claimsData.find((c: Claim) => c.id === selectedClaim.id);
          if (updated) setSelectedClaim(updated);
        }
      }

      const polRes = await fetch('/api/polizas');
      if (polRes.ok) {
        setPolicies(await polRes.json());
      }

      const cliRes = await fetch('/api/clientes');
      if (cliRes.ok) {
        setClients(await cliRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default event date to today when opening modal
  useEffect(() => {
    if (createModalOpen) {
      setFechaEvento(new Date().toISOString().split('T')[0]);
    }
  }, [createModalOpen]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente || !idPoliza || !fechaEvento || !tipoSiniestro) {
      alert('Campos requeridos faltantes');
      return;
    }
    try {
      const res = await fetch('/api/siniestros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          id_cliente: idCliente,
          id_poliza: idPoliza,
          fecha_evento: fechaEvento,
          tipo_siniestro: tipoSiniestro,
          ajustador,
          monto_siniestro: Number(montoSiniestro || 0)
        })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchData(data.claim.id);
        setCreateModalOpen(false);
        // Reset form
        setIdCliente('');
        setIdPoliza('');
        setTipoSiniestro('');
        setAjustador('');
        setMontoSiniestro('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (newStatus: Claim['estado']) => {
    if (!selectedClaim) return;
    try {
      const res = await fetch('/api/siniestros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id: selectedClaim.id,
          estado: newStatus
        })
      });
      if (res.ok) {
        fetchData(selectedClaim.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTimelineLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !logMotivo || !logProximoControl) return;
    try {
      const res = await fetch('/api/siniestros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addLog',
          id: selectedClaim.id,
          motivo: logMotivo,
          proximo_control: logProximoControl
        })
      });
      if (res.ok) {
        setLogMotivo('');
        setLogProximoControl('');
        fetchData(selectedClaim.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Claims
  const getFilteredClaims = () => {
    return claims.filter(c => {
      const clientName = clients.find(cl => cl.id === c.id_cliente)?.nombre || '';
      const policyNumber = policies.find(p => p.id === c.id_poliza)?.numero_poliza || '';
      const term = searchTerm.toLowerCase();

      return (
        c.tipo_siniestro.toLowerCase().includes(term) ||
        c.ajustador.toLowerCase().includes(term) ||
        clientName.toLowerCase().includes(term) ||
        policyNumber.toLowerCase().includes(term)
      );
    });
  };

  const filtered = getFilteredClaims();

  // Helper: calculate days elapsed since declaration
  const getDaysElapsed = (dateStr: string) => {
    const start = new Date(dateStr);
    const systemDate = new Date('2026-06-05'); // consistent mock time
    const diff = systemDate.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    return days >= 0 ? days : 0;
  };

  // Filtered policies list for selected client in modal
  const clientPolicies = policies.filter(p => p.id_cliente === idCliente);

  return (
    <div className="animate-fade-in">
      
      {/* Title bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} style={{ color: '#2563EB' }} />
            Seguimiento de Siniestros
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Apertura casos de siniestros, realiza el seguimiento en bitácoras y gestiona etapas con las aseguradoras.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          Declarar Siniestro
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '25px', alignItems: 'start' }}>
        
        {/* LEFT PANE: SEARCHABLE LIST */}
        <div className="premium-card">
          <div className="card-header" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px' }}>Casos de Siniestros</h2>
              <span className="badge badge-secondary">{filtered.length}</span>
            </div>
            
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" style={{ top: '10px' }} />
              <input 
                type="text" 
                placeholder="Buscar por taller, ajustador, cliente, póliza..." 
                className="form-input search-input" 
                style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                No se encontraron casos de siniestros activos.
              </div>
            ) : (
              filtered.map((claim) => {
                const isSelected = selectedClaim?.id === claim.id;
                const client = clients.find(c => c.id === claim.id_cliente);
                const policy = policies.find(p => p.id === claim.id_poliza);
                const days = getDaysElapsed(claim.fecha_creacion);

                return (
                  <div 
                    key={claim.id}
                    className="animate-slide-in"
                    style={{ 
                      padding: '16px 20px', 
                      borderBottom: '1px solid #E2E8F0', 
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'background-color 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{claim.tipo_siniestro}</span>
                        <span className={`badge ${
                          claim.estado === 'Liquidado' ? 'badge-success' :
                          claim.estado === 'Rechazado' ? 'badge-danger' :
                          claim.estado === 'Reportado' ? 'badge-secondary' : 'badge-warning'
                        }`} style={{ padding: '2px 6px', fontSize: '9.5px' }}>
                          {claim.estado}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: 500, marginTop: '4px' }}>
                        Cliente: {client?.nombre || 'Desconocido'}
                      </div>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                        <span>Póliza: {policy?.numero_poliza}</span>
                        <span>Monto: {policy?.moneda || 'USD'} {claim.monto_siniestro ? claim.monto_siniestro.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} />
                          Hace {days} días
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: isSelected ? 'var(--color-primary)' : '#94A3B8' }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: CASE DETAILS & BITACORA */}
        <div>
          {selectedClaim ? (
            <div className="premium-card animate-fade-in">
              <div className="card-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-danger">CASO: {selectedClaim.id}</span>
                    <span style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      Declarado el: {formatDateToLocal(selectedClaim.fecha_creacion)}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '6px' }}>{selectedClaim.tipo_siniestro}</h2>
                </div>

                {/* Status selector directly on header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>Etapa:</span>
                  <select 
                    className="form-input" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}
                    value={selectedClaim.estado}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                  >
                    <option value="Reportado">Reportado</option>
                    <option value="En Evaluacion">En Evaluación</option>
                    <option value="Documentacion Pendiente">Documentación Pendiente</option>
                    <option value="Liquidado">Liquidado (Aprobado)</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              <div className="card-body" style={{ padding: '24px' }}>
                
                {/* 1. CLINT / POLICY INFO */}
                <div style={{ marginBottom: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>ASEGURADO / DOCUMENTO</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} style={{ color: '#2563EB' }} />
                        {clients.find(c => c.id === selectedClaim.id_cliente)?.nombre || 'Desconocido'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginLeft: '21px' }}>
                        Doc: {clients.find(c => c.id === selectedClaim.id_cliente)?.documento_numero}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>PÓLIZA ASOCIADA</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} style={{ color: '#2563EB' }} />
                        {policies.find(p => p.id === selectedClaim.id_poliza)?.numero_poliza || 'Desconocida'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginLeft: '21px' }}>
                        Ramo: {policies.find(p => p.id === selectedClaim.id_poliza)?.ramo} ({policies.find(p => p.id === selectedClaim.id_poliza)?.compania_aseguradora})
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '12px', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '15px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>AJUSTADOR ENCARGADO</span>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginTop: '2px' }}>
                        {selectedClaim.ajustador || 'Por asignar'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>FECHA DEL EVENTO</span>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#334155', marginTop: '2px' }}>
                        {formatDateToLocal(selectedClaim.fecha_evento)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>MONTO DEL SINIESTRO</span>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#DC2626', marginTop: '2px' }}>
                        {policies.find(p => p.id === selectedClaim.id_poliza)?.moneda || 'USD'} {selectedClaim.monto_siniestro ? selectedClaim.monto_siniestro.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. TIMELINE OF LOGS */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} style={{ color: '#2563EB' }} />
                    Bitácora de Eventos y Siguiente Control
                  </h3>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                    <div className="timeline">
                      {selectedClaim.bitacora.map((log, index) => (
                        <div key={index} className="timeline-item active">
                          <div className="timeline-item-indicator" style={{ borderColor: 'var(--color-danger)' }} />
                          <div className="timeline-item-content">
                            <div className="timeline-item-header">
                              <span className="timeline-item-title" style={{ fontWeight: 600, color: '#0F172A' }}>{log.motivo}</span>
                              <span className="timeline-item-time">{formatDateToLocal(log.fecha)} a las {log.hora}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
                              <span>Próximo control: <strong>{formatDateToLocal(log.proximo_control)}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Log append Form */}
                  <form onSubmit={handleAddTimelineLog} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '12px' }}>Evento / Gestión Realizada</label>
                        <input 
                          type="text" 
                          placeholder="Ej. Visita al taller, envío de repuestos, etc..." 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          value={logMotivo}
                          onChange={(e) => setLogMotivo(e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '12px' }}>Próximo Control</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          style={{ padding: '5px 10px', fontSize: '12.5px' }}
                          value={logProximoControl}
                          onChange={(e) => setLogProximoControl(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary btn-sm">Registrar Evento</button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <AlertTriangle size={32} />
              </div>
              <div className="empty-state-title">Ningún caso de siniestro seleccionado</div>
              <p className="empty-state-desc">
                Selecciona un siniestro de la lista lateral para ver la información del vehículo/afiliado, fecha del siniestro, ajustador, bitácora e ingresar controles.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE CASE MODAL */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Declarar Nuevo Siniestro</h3>
              <button className="modal-close-btn" onClick={() => setCreateModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateClaim}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Asegurado Afectado *</label>
                  <select 
                    className="form-input" 
                    value={idCliente} 
                    onChange={(e) => { setIdCliente(e.target.value); setIdPoliza(''); }} // Reset policy on client change
                    required
                  >
                    <option value="">-- Seleccione Cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Póliza Asociada *</label>
                  <select 
                    className="form-input" 
                    value={idPoliza} 
                    onChange={(e) => setIdPoliza(e.target.value)}
                    disabled={!idCliente}
                    required
                  >
                    <option value="">-- Seleccione Póliza --</option>
                    {clientPolicies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.numero_poliza} - {p.ramo} ({p.compania_aseguradora})
                      </option>
                    ))}
                  </select>
                  {!idCliente && <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>Seleccione primero un cliente para listar sus pólizas.</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Siniestro (Incidente) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Choque por alcance, rotura de lunas, robo de accesorios" 
                    value={tipoSiniestro} 
                    onChange={(e) => setTipoSiniestro(e.target.value)} 
                    required 
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Fecha del Evento *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={fechaEvento} 
                      onChange={(e) => setFechaEvento(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ajustador Asignado</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nombre del ajustador" 
                      value={ajustador} 
                      onChange={(e) => setAjustador(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Monto del Siniestro *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    placeholder="Ej. 1500.00" 
                    value={montoSiniestro} 
                    onChange={(e) => setMontoSiniestro(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Declarar Siniestro</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
