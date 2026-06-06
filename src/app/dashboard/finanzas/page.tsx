'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface PaymentSchedule {
  id: string;
  id_poliza: string;
  numero_cuota: number;
  monto_cuota_cliente: number;
  comision_cuota_broker: number;
  fecha_vencimiento: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Vencido';
  estado_comision: 'Pendiente' | 'Cobrado';
}

interface Policy {
  id: string;
  numero_poliza: string;
  compania_aseguradora: string;
  ramo: string;
  id_cliente: string;
  moneda?: 'USD' | 'PEN';
}

interface Client {
  id: string;
  nombre: string;
}

export default function FinanzasPage() {
  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filter States
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [montoOperador, setMontoOperador] = useState<'todos' | 'mayor' | 'menor' | 'igual'>('todos');
  const [montoValor, setMontoValor] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState<keyof PaymentSchedule>('fecha_vencimiento');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Simulator stats
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedCSVText, setSimulatedCSVText] = useState(
    `policy_number,cuota_number,client_paid,commission_cobrada\nV-908754-2026,1,Pagado,Cobrado\nE-334455-2026,2,Pagado,Cobrado`
  );
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      const schRes = await fetch('/api/cronograma');
      if (schRes.ok) {
        const schData = await schRes.json();
        setSchedules(schData);
      }
      const polRes = await fetch('/api/polizas');
      if (polRes.ok) {
        const polData = await polRes.json();
        setPolicies(polData);
      }
      const cliRes = await fetch('/api/clientes');
      if (cliRes.ok) {
        const cliData = await cliRes.json();
        setClients(cliData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle manual update of client payment status
  const handleUpdatePaymentStatus = async (id: string, status: 'Pendiente' | 'Pagado' | 'Vencido') => {
    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id,
          estado_pago: status
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle manual update of broker commission status
  const handleUpdateCommissionStatus = async (id: string, status: 'Pendiente' | 'Cobrado') => {
    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id,
          estado_comision: status
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run the mock CSV Excel import reconciliation
  const handleRunReconciliation = async (customCSV?: string) => {
    const csvContent = customCSV || simulatedCSVText;
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const importData = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const values = lines[i].split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, index) => {
        row[h.trim()] = values[index]?.trim();
      });
      importData.push(row);
    }

    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importExcel',
          importData
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationLogs(data.logs);
        setSuccessMessage(`Conciliación completada: Clientes actualizados: ${data.updatedCount.client}, Comisiones: ${data.updatedCount.broker}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick preset simulation buttons
  const triggerRimacPreset = () => {
    const targetPolicy = policies.find(p => p.compania_aseguradora.toLowerCase() === 'rimac');
    if (targetPolicy) {
      const csv = `policy_number,cuota_number,client_paid,commission_cobrada\n${targetPolicy.numero_poliza},1,Pagado,Cobrado`;
      setSimulatedCSVText(csv);
      handleRunReconciliation(csv);
    } else {
      handleRunReconciliation();
    }
  };

  // Sorting helper
  const handleSort = (field: keyof PaymentSchedule) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortArrow = (field: keyof PaymentSchedule) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="sort-icon" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} className="sort-icon" style={{ color: '#2563EB' }} /> 
      : <ArrowDown size={13} className="sort-icon" style={{ color: '#2563EB' }} />;
  };

  // Filtering
  const getFilteredSchedules = () => {
    return schedules.filter(s => {
      const policy = policies.find(p => p.id === s.id_poliza);
      const client = policy ? clients.find(c => c.id === policy.id_cliente) : null;
      const term = searchTerm.toLowerCase();

      // 1. Text Search Filter
      const matchesText = 
        s.fecha_vencimiento.includes(term) ||
        (policy?.numero_poliza || '').toLowerCase().includes(term) ||
        (policy?.compania_aseguradora || '').toLowerCase().includes(term) ||
        (client?.nombre || '').toLowerCase().includes(term);

      if (!matchesText) return false;

      // 2. Date Range Filter
      if (fechaDesde) {
        if (s.fecha_vencimiento < fechaDesde) return false;
      }
      if (fechaHasta) {
        if (s.fecha_vencimiento > fechaHasta) return false;
      }

      // 3. Amount Comparison Filter
      if (montoOperador !== 'todos' && montoValor !== '') {
        const val = Number(montoValor);
        if (!isNaN(val)) {
          const cuotaMonto = s.monto_cuota_cliente;
          if (montoOperador === 'mayor' && !(cuotaMonto > val)) return false;
          if (montoOperador === 'menor' && !(cuotaMonto < val)) return false;
          if (montoOperador === 'igual' && !(Math.abs(cuotaMonto - val) < 0.01)) return false;
        }
      }

      return true;
    });
  };

  const filtered = getFilteredSchedules();
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Pagination Math
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSchedules = sorted.slice(startIndex, endIndex);

  // Statistics calculation for Reconciliacion
  const totalRecaudado = schedules.filter(s => s.estado_pago === 'Pagado').reduce((sum, s) => sum + s.monto_cuota_cliente, 0);
  const totalPendiente = schedules.filter(s => s.estado_pago !== 'Pagado').reduce((sum, s) => sum + s.monto_cuota_cliente, 0);
  const comisionesCobradas = schedules.filter(s => s.estado_comision === 'Cobrado').reduce((sum, s) => sum + s.comision_cuota_broker, 0);
  const comisionesPendientes = schedules.filter(s => s.estado_comision !== 'Cobrado').reduce((sum, s) => sum + s.comision_cuota_broker, 0);

  return (
    <div className="animate-fade-in">
      {/* Title bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={24} style={{ color: '#2563EB' }} />
            Control de Finanzas y Comisiones
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Audita el cronograma de cobranzas de clientes y concilia las liquidaciones de comisiones de aseguradoras.
          </p>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => { setShowSimulator(!showSimulator); setSimulationLogs([]); setSuccessMessage(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Upload size={16} />
          {showSimulator ? 'Ocultar Simulador Excel' : 'Reconciliar con Excel'}
        </button>
      </div>

      {/* Reconciliación aggregates widgets */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Cobros Clientes Recibidos</h3>
            <div className="kpi-value">USD {totalRecaudado.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#10B981' }}>Cobranza Efectuada</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Cobros Clientes Pendientes</h3>
            <div className="kpi-value">USD {totalPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#EF4444' }}>Por Recaudar</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Comisiones Cobradas</h3>
            <div className="kpi-value">USD {comisionesCobradas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#10B981' }}>Liquidadas por Aseguradora</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>
            <DollarSign size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Comisiones Pendientes</h3>
            <div className="kpi-value">USD {comisionesPendientes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#F59E0B' }}>Por Conciliar</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* EXCEL IMPORT SIMULATOR MODULE */}
      {showSimulator && (
        <div className="premium-card animate-slide-in" style={{ borderColor: 'var(--color-primary)' }}>
          <div className="card-header" style={{ background: 'var(--color-primary-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <h2 style={{ fontSize: '15.5px' }}>Simulador de Carga de Liquidaciones Excel</h2>
                <p className="card-subtitle">Actualiza automáticamente el estado de cobranza y comisiones subiendo liquidaciones.</p>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <span className="form-label" style={{ fontSize: '12.5px' }}>Contenido de Liquidación (CSV simulado)</span>
              <textarea 
                className="form-input"
                style={{ height: '110px', fontFamily: 'monospace', fontSize: '12px', resize: 'none', marginBottom: '10px' }}
                value={simulatedCSVText}
                onChange={(e) => setSimulatedCSVText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleRunReconciliation()}>
                  Ejecutar Reconciliación
                </button>
                <button className="btn btn-secondary btn-sm" onClick={triggerRimacPreset}>
                  Cargar Liquidación de Rimac (Automatizado)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="form-label" style={{ fontSize: '12.5px' }}>Consola de Conciliación</span>
              
              <div style={{ flex: 1, minHeight: '110px', background: '#0F172A', color: '#38BDF8', borderRadius: '8px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '11.5px', overflowY: 'auto' }}>
                {successMessage && <div style={{ color: '#4ADE80', fontWeight: 'bold', marginBottom: '6px' }}>[SUCCESS] {successMessage}</div>}
                {simulationLogs.length === 0 ? (
                  <div style={{ color: '#64748B' }}>Consola inactiva. Carga o simula una liquidación para ver la auditoría de registros conciliados.</div>
                ) : (
                  simulationLogs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '2px' }}>&gt; {log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED FILTERS BAR */}
      <div className="premium-card" style={{ padding: '20px', marginBottom: '25px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          
          {/* Text Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Buscador General</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" style={{ top: '10px' }} />
              <input 
                type="text" 
                placeholder="Póliza, cliente, aseguradora..." 
                className="form-input search-input" 
                style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Date Range Start */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Vencimiento Desde</label>
            <input 
              type="date" 
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Date Range End */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Vencimiento Hasta</label>
            <input 
              type="date" 
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Amount comparison filters */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Monto de la Prima (Cuota)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select 
                className="form-input" 
                style={{ width: '40%', padding: '6px', fontSize: '12.5px' }}
                value={montoOperador}
                onChange={(e: any) => { setMontoOperador(e.target.value); setCurrentPage(1); }}
              >
                <option value="todos">Todos</option>
                <option value="mayor">&gt;</option>
                <option value="menor">&lt;</option>
                <option value="igual">=</option>
              </select>
              <input 
                type="number" 
                placeholder="Monto"
                className="form-input" 
                style={{ width: '60%', padding: '6px 10px', fontSize: '12.5px' }}
                disabled={montoOperador === 'todos'}
                value={montoValor}
                onChange={(e) => { setMontoValor(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

        </div>

        {/* Clear Filters Button if any filter active */}
        {(searchTerm || fechaDesde || fechaHasta || montoOperador !== 'todos' || montoValor) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => {
                setSearchTerm('');
                setFechaDesde('');
                setFechaHasta('');
                setMontoOperador('todos');
                setMontoValor('');
                setCurrentPage(1);
              }}
            >
              Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* SCHEDULES MAIN GRID */}
      <div className="premium-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('fecha_vencimiento')}>
                  Fecha Vencimiento {renderSortArrow('fecha_vencimiento')}
                </th>
                <th>Póliza</th>
                <th>Asegurado / Cliente</th>
                <th>Aseguradora</th>
                <th>Monto Cuota Cliente</th>
                <th>Estado Pago Cliente</th>
                <th>Comisión Broker</th>
                <th>Estado Comisión Broker</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No se encontraron vencimientos de cuotas.
                  </td>
                </tr>
              ) : (
                paginatedSchedules.map((item) => {
                  const policy = policies.find(p => p.id === item.id_poliza);
                  const client = policy ? clients.find(c => c.id === policy.id_cliente) : null;
                  
                  return (
                    <tr key={item.id} className="animate-slide-in">
                      <td style={{ fontWeight: 600 }}>{formatDateToLocal(item.fecha_vencimiento)}</td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                        {policy?.numero_poliza || 'Desconocida'}
                      </td>
                      <td>{client?.nombre || 'Desconocido'}</td>
                      <td>
                        <span className="badge badge-secondary">{policy?.compania_aseguradora}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: 600 }}>
                        {policy?.moneda === 'PEN' ? 'S/.' : 'USD'} {item.monto_cuota_cliente.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${
                            item.estado_pago === 'Pagado' ? 'badge-success' :
                            item.estado_pago === 'Vencido' ? 'badge-danger' : 'badge-info'
                          }`}>
                            {(item.estado_pago || 'Pendiente').toUpperCase()}
                          </span>
                          
                          {item.estado_pago !== 'Pagado' && (
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => handleUpdatePaymentStatus(item.id, 'Pagado')}
                            >
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: 600, color: '#047857' }}>
                        {policy?.moneda === 'PEN' ? 'S/.' : 'USD'} {item.comision_cuota_broker.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${
                            item.estado_comision === 'Cobrado' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {item.estado_comision === 'Cobrado' ? 'COBRADO' : 'PENDIENTE'}
                          </span>
                          
                          {item.estado_comision !== 'Cobrado' && (
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={() => handleUpdateCommissionStatus(item.id, 'Cobrado')}
                            >
                              Conciliar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <span className="pagination-info">
              Mostrando {startIndex + 1}-{endIndex} de {totalItems} registros
            </span>
            <div className="pagination-actions">
              <button 
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
