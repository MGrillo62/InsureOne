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
  ArrowDown,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

  // Excel upload/download states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filePreviewData, setFilePreviewData] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ updatedClient: number; updatedBroker: number; logs: string[] } | null>(null);

  // Payment Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState('Transferencia');
  const [payBank, setPayBank] = useState('BCP');
  const [payReference, setPayReference] = useState('');
  const [bankOptions, setBankOptions] = useState([
    { value: 'BCP', label: 'Banco de Crédito (BCP)' },
    { value: 'BBVA', label: 'BBVA' },
    { value: 'Interbank', label: 'Interbank' },
    { value: 'Scotiabank', label: 'Scotiabank' },
    { value: 'Banco de la Nación', label: 'Banco de la Nación' },
    { value: 'Banbif', label: 'Banbif' }
  ]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');

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
  const handleUpdatePaymentStatus = async (
    id: string, 
    status: 'Pendiente' | 'Pagado' | 'Vencido',
    fecha_pago?: string,
    medio_pago?: string,
    nro_operacion?: string,
    banco?: string
  ) => {
    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id,
          estado_pago: status,
          fecha_pago,
          medio_pago,
          nro_operacion,
          banco
        })
      });
      if (res.ok) {
        fetchData();
        setShowPayModal(false);
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

  const downloadExcelTemplate = () => {
    const headers = [
      'Número de Póliza', 'Número de Cuota', 'Pago Cliente', 'Comisión Broker'
    ];
    
    // Get currently filtered schedules and select those that are pending payment or commission
    const currentFiltered = getFilteredSchedules();
    const pendingSchedules = currentFiltered.filter(item => 
      item.estado_pago !== 'Pagado' || item.estado_comision !== 'Cobrado'
    );

    let rows: any[][] = [];
    if (pendingSchedules.length > 0) {
      rows = pendingSchedules.map(item => {
        const policy = policies.find(p => p.id === item.id_poliza);
        return [
          policy?.numero_poliza || '',
          item.numero_cuota,
          item.estado_pago || 'Pendiente',
          item.estado_comision || 'Pendiente'
        ];
      });
    } else {
      // Fallback sample rows if no pending records match
      rows = [
        ['CAR-12345-2026', 1, 'Pagado', 'Cobrado'],
        ['SCTR-9988-2026', 2, 'Pagado', 'Pendiente']
      ];
    }

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actualización Cobros');
    XLSX.writeFile(wb, 'plantilla_actualizacion_cobros.xlsx');
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilePreviewData([]);
    setUploadErrors([]);
    setUploadProgress(0);
    setUploadResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length <= 1) {
          setUploadErrors(['El archivo no contiene filas de datos para procesar.']);
          return;
        }

        const previewList: any[] = [];
        const errorsList: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
            continue;
          }

          const lineNum = i + 1;

          const valAt = (idx: number) => {
            const val = row[idx];
            return val !== undefined && val !== null ? String(val).trim() : '';
          };

          const rawNumAt = (idx: number) => {
            const val = row[idx];
            return typeof val === 'number' ? val : Number(val);
          };

          const policyNumber = valAt(0);
          const cuotaNumber = rawNumAt(1);
          const clientPaid = valAt(2);
          const commissionCobrada = valAt(3);

          if (!policyNumber) errorsList.push(`Fila ${lineNum}: El número de póliza es requerido.`);
          if (isNaN(cuotaNumber) || cuotaNumber <= 0) errorsList.push(`Fila ${lineNum}: El número de cuota debe ser un número positivo.`);
          if (!clientPaid || !['Pagado', 'Pendiente', 'Vencido'].includes(clientPaid)) {
            errorsList.push(`Fila ${lineNum}: El estado Pago Cliente debe ser 'Pagado', 'Pendiente' o 'Vencido'.`);
          }
          if (!commissionCobrada || !['Cobrado', 'Pendiente'].includes(commissionCobrada)) {
            errorsList.push(`Fila ${lineNum}: El estado Comisión Broker debe ser 'Cobrado' o 'Pendiente'.`);
          }

          const policyExists = policies.some(p => p.numero_poliza === policyNumber);
          
          previewList.push({
            linea: lineNum,
            policy_number: policyNumber,
            cuota_number: cuotaNumber,
            client_paid: clientPaid,
            commission_cobrada: commissionCobrada,
            policyExists
          });
          
          if (policyNumber && !policyExists) {
            errorsList.push(`Fila ${lineNum}: La póliza con número ${policyNumber} no existe en el sistema.`);
          }
        }

        setUploadErrors(errorsList);
        setFilePreviewData(previewList);
      } catch (err) {
        console.error(err);
        setUploadErrors(['Error al leer el archivo Excel. Asegúrese de que el formato sea válido.']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processBulkUpload = async () => {
    if (filePreviewData.length === 0 || uploadErrors.length > 0) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importExcel',
          importData: filePreviewData.map(item => ({
            policy_number: item.policy_number,
            cuota_number: item.cuota_number,
            client_paid: item.client_paid,
            commission_cobrada: item.commission_cobrada === 'Cobrado' ? 'Cobrado' : 'Pendiente'
          }))
        })
      });

      setUploadProgress(50);

      if (res.ok) {
        const data = await res.json();
        setUploadProgress(100);
        setUploadResults({
          updatedClient: data.updatedCount.client,
          updatedBroker: data.updatedCount.broker,
          logs: data.logs
        });
        await fetchData();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al procesar el archivo Excel.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error al procesar la actualización: ${err.message || 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setFilePreviewData([]);
    setUploadErrors([]);
    setUploadProgress(0);
    setUploading(false);
    setUploadResults(null);
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
            Control de Cobranzas y Comisiones
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Audita el cronograma de cobranzas de clientes y concilia las liquidaciones de comisiones de aseguradoras.
          </p>
        </div>
        
        <button 
          className="btn btn-secondary" 
          onClick={() => setUploadModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Upload size={16} />
          Actualizar cobros
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
                <th>Cuota</th>
                <th>Estado Pago Cliente</th>
                <th>Comisión Broker</th>
                <th>Estado Comisión Broker</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
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
                      <td style={{ fontWeight: 600 }}>
                        Cuota {item.numero_cuota}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                onClick={() => {
                                  setSelectedScheduleId(item.id);
                                  setPayDate(new Date().toISOString().split('T')[0]);
                                  setPayMethod('Transferencia');
                                  setPayBank(bankOptions[0]?.value || 'BCP');
                                  setPayReference('');
                                  setShowPayModal(true);
                                }}
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                          {item.estado_pago === 'Pagado' && (
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
                              <span><strong>Fecha:</strong> {formatDateToLocal(item.fecha_pago || '')}</span>
                              <span><strong>Medio:</strong> {item.medio_pago || '-'}</span>
                              {item.banco && <span><strong>Banco:</strong> {item.banco}</span>}
                              {item.nro_operacion && <span><strong>Op/Ref:</strong> {item.nro_operacion}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: 600, color: '#047857' }}>
                        {policy?.moneda === 'PEN' ? 'S/.' : 'USD'} {item.comision_cuota_broker.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge ${
                          item.estado_comision === 'Cobrado' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {item.estado_comision === 'Cobrado' ? 'COBRADO' : 'PENDIENTE'}
                        </span>
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

      {/* MODAL: REGISTRAR COBRO */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Cobro de Prima</h3>
              <button className="modal-close-btn" onClick={() => setShowPayModal(false)}>&times;</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedScheduleId) {
                handleUpdatePaymentStatus(
                  selectedScheduleId, 
                  'Pagado', 
                  payDate, 
                  payMethod, 
                  payMethod === 'Efectivo' ? '' : payReference, 
                  payMethod === 'Efectivo' ? '' : payBank
                );
              }
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Fecha de Cobro *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={payDate} 
                    onChange={(e) => setPayDate(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medio de Pago *</label>
                  <select 
                    className="form-input" 
                    value={payMethod} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setPayMethod(val);
                      if (val === 'Efectivo') {
                        setPayBank('');
                        setPayReference('');
                      } else if (!payBank) {
                        setPayBank(bankOptions[0]?.value || 'BCP');
                      }
                    }}
                    required
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Sip">Sip</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
                
                {payMethod !== 'Efectivo' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Banco Destino *</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          className="form-input" 
                          value={payBank} 
                          onChange={(e) => setPayBank(e.target.value)}
                          required
                          style={{ flex: 1 }}
                        >
                          {bankOptions.map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 12px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => setShowAddBank(true)}
                          title="Agregar banco"
                        >
                          +
                        </button>
                      </div>
                      
                      {showAddBank && (
                        <div style={{ marginTop: '8px', padding: '10px', background: '#F1F5F9', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            placeholder="Nombre del nuevo banco" 
                            className="form-input"
                            style={{ flex: 1, padding: '4px 8px', fontSize: '12.5px' }}
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => {
                              if (newBankName.trim()) {
                                const val = newBankName.trim();
                                if (!bankOptions.some(b => b.value.toLowerCase() === val.toLowerCase())) {
                                  setBankOptions([...bankOptions, { value: val, label: val }]);
                                }
                                setPayBank(val);
                                setNewBankName('');
                                setShowAddBank(false);
                              }
                            }}
                          >
                            Agregar
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => {
                              setShowAddBank(false);
                              setNewBankName('');
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nro. Operación / Referencia *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej. OP-472918" 
                        value={payReference} 
                        onChange={(e) => setPayReference(e.target.value)} 
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARGA MASIVA / ACTUALIZACIÓN DE COBROS */}
      {uploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} style={{ color: '#2563EB' }} />
                Actualizar cobros masivamente
              </h3>
              <button className="modal-close-btn" onClick={handleCloseUploadModal} disabled={uploading}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Actualiza el estado de cobro de clientes y liquidaciones de comisiones cargando una plantilla Excel.
              </p>

              {/* Template Download Option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155' }}>¿No tienes el formato de Excel?</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Descarga la plantilla con la estructura correcta.</span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={downloadExcelTemplate}
                  disabled={uploading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={14} />
                  Descargar Formato Excel
                </button>
              </div>

              {/* File Upload Zone */}
              {!uploadResults && (
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '30px', textAlign: 'center', backgroundColor: '#F8FAFC', marginBottom: '20px', cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative' }}>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleExcelFileUpload}
                    disabled={uploading}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                  <Upload size={36} style={{ color: '#94A3B8', marginBottom: '10px' }} />
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                    Selecciona o arrastra tu archivo Excel
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                    Formatos soportados: .xlsx, .xls
                  </span>
                </div>
              )}

              {/* Progress Indicator */}
              {uploading && (
                <div style={{ marginBottom: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    <span>Procesando registros en base de datos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#2563EB', transition: 'width 0.2s ease-in-out', borderRadius: '999px' }} />
                  </div>
                </div>
              )}

              {/* Upload Success Results */}
              {uploadResults && (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '20px', color: '#065F46' }}>
                  <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>¡Actualización Completada!</h4>
                  <p style={{ fontSize: '14px', marginBottom: '15px', lineHeight: 1.5 }}>
                    Se actualizaron exitosamente <strong>{uploadResults.updatedClient}</strong> cobros de clientes y <strong>{uploadResults.updatedBroker}</strong> liquidaciones de comisiones.
                  </p>
                  
                  {/* Console logs output */}
                  <div style={{ textAlign: 'left', background: '#0F172A', color: '#38BDF8', borderRadius: '8px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', maxHeight: '150px', overflowY: 'auto' }}>
                    {uploadResults.logs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: '2px' }}>&gt; {log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {uploadErrors.length > 0 && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#991B1B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    <XCircle size={16} />
                    Se detectaron errores en el archivo Excel:
                  </div>
                  <ul style={{ fontSize: '13px', paddingLeft: '20px', margin: 0, maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {uploadErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                  <span style={{ display: 'block', fontSize: '12px', color: '#B91C1C', marginTop: '10px', fontWeight: 600 }}>
                    Por favor, corrija los errores descritos arriba y vuelva a cargar el archivo.
                  </span>
                </div>
              )}

              {/* Preview Table */}
              {filePreviewData.length > 0 && uploadErrors.length === 0 && !uploadResults && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#1E293B', marginBottom: '10px' }}>Previsualización de Registros Detectados ({filePreviewData.length})</h4>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <table className="premium-table" style={{ fontSize: '12px', margin: 0 }}>
                      <thead>
                        <tr style={{ position: 'sticky', top: 0, backgroundColor: '#FFFFFF', zIndex: 1 }}>
                          <th>Fila</th>
                          <th>Nro Póliza</th>
                          <th>Cuota</th>
                          <th>Pago Cliente</th>
                          <th>Comisión Broker</th>
                          <th>Póliza Existe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filePreviewData.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.linea}</td>
                            <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{item.policy_number}</td>
                            <td>Cuota {item.cuota_number}</td>
                            <td>
                              <span className={`badge ${item.client_paid === 'Pagado' ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {item.client_paid.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${item.commission_cobrada === 'Cobrado' ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {item.commission_cobrada.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {item.policyExists ? (
                                <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>Sí</span>
                              ) : (
                                <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 6px' }}>No Existe</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ flexShrink: 0 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCloseUploadModal} 
                disabled={uploading}
              >
                {uploadResults ? 'Cerrar' : 'Cancelar'}
              </button>
              {!uploadResults && (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={processBulkUpload}
                  disabled={uploading || filePreviewData.length === 0 || uploadErrors.length > 0}
                >
                  {uploading ? `Procesando...` : 'Actualizar Cobros'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
