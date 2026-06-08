'use client';

import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Plus,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign
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
  fecha_pago_comision?: string;
  nro_operacion_comision?: string;
  banco_comision?: string;
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

export default function ComisionesPage() {
  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatCurrency = (val: number, cur?: 'USD' | 'PEN' | string) => {
    const symbol = cur === 'PEN' ? 'S/.' : 'USD';
    return `${symbol} ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Data States
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentTenant, setCurrentTenant] = useState<{ nombre: string; ruc: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [insuredFilter, setInsuredFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [insurerFilter, setInsurerFilter] = useState('');
  const [premiumStatusFilter, setPremiumStatusFilter] = useState<'Todos' | 'Pagado' | 'Pendiente' | 'Vencido'>('Pagado');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<'Todos' | 'Por cobrar' | 'Cobrado'>('Por cobrar');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting States
  const [sortField, setSortField] = useState<keyof PaymentSchedule>('fecha_vencimiento');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk Payment Modal States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkBank, setBulkBank] = useState('BCP');
  const [bulkReference, setBulkReference] = useState('');
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

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const schRes = await fetch('/api/cronograma');
      const polRes = await fetch('/api/polizas');
      const cliRes = await fetch('/api/clientes');
      const tenantsRes = await fetch('/api/tenants');

      if (schRes.ok && polRes.ok && cliRes.ok) {
        const schData = await schRes.json();
        const polData = await polRes.json();
        const cliData = await cliRes.json();

        setSchedules(schData);
        setPolicies(polData);
        setClients(cliData);
      }

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        const activeTenant = tenantsData.tenants?.find((t: any) => t.id === tenantsData.activeTenantId);
        if (activeTenant) {
          setCurrentTenant({
            nombre: activeTenant.nombre,
            ruc: activeTenant.ruc
          });
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de comisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter schedules
  const getFilteredSchedules = () => {
    return schedules.filter(s => {
      const policy = policies.find(p => p.id === s.id_poliza);
      const client = policy ? clients.find(c => c.id === policy.id_cliente) : null;

      // 1. General search (matches policy number, insurer, client, branch)
      const term = searchTerm.toLowerCase();
      const matchesGeneral = 
        (policy?.numero_poliza || '').toLowerCase().includes(term) ||
        (policy?.compania_aseguradora || '').toLowerCase().includes(term) ||
        (policy?.ramo || '').toLowerCase().includes(term) ||
        (client?.nombre || '').toLowerCase().includes(term);

      if (!matchesGeneral) return false;

      // 2. Insured advanced filter
      if (insuredFilter) {
        if (!client || !client.nombre.toLowerCase().includes(insuredFilter.toLowerCase())) return false;
      }

      // 3. Branch advanced filter
      if (branchFilter) {
        if (!policy || !policy.ramo.toLowerCase().includes(branchFilter.toLowerCase())) return false;
      }

      // 4. Insurer advanced filter
      if (insurerFilter) {
        if (!policy || !policy.compania_aseguradora.toLowerCase().includes(insurerFilter.toLowerCase())) return false;
      }

      // 5. Premium payment status filter
      if (premiumStatusFilter !== 'Todos') {
        if (s.estado_pago !== premiumStatusFilter) return false;
      }

      // 6. Commission status filter
      if (commissionStatusFilter !== 'Todos') {
        const isCobrada = s.estado_comision === 'Cobrado';
        if (commissionStatusFilter === 'Por cobrar' && isCobrada) return false;
        if (commissionStatusFilter === 'Cobrado' && !isCobrada) return false;
      }

      // 7. Date range filter
      if (dateFrom && s.fecha_vencimiento < dateFrom) return false;
      if (dateTo && s.fecha_vencimiento > dateTo) return false;

      return true;
    });
  };

  const filtered = getFilteredSchedules();

  // Sort helper
  const handleSort = (field: keyof PaymentSchedule) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

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

  // Stats calculation
  const totalPorCobrarMonto = schedules
    .filter(s => s.estado_pago === 'Pagado' && s.estado_comision !== 'Cobrado')
    .reduce((sum, s) => sum + s.comision_cuota_broker, 0);

  const totalCobradasMonto = schedules
    .filter(s => s.estado_comision === 'Cobrado')
    .reduce((sum, s) => sum + s.comision_cuota_broker, 0);

  const totalComisionMonto = schedules
    .reduce((sum, s) => sum + s.comision_cuota_broker, 0);

  // Checkbox Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filtered.map(item => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  // Bulk update action
  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      const idsArray = Array.from(selectedIds);
      const promises = idsArray.map(id => {
        return fetch('/api/cronograma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateStatus',
            id,
            estado_comision: 'Cobrado',
            fecha_pago_comision: bulkDate,
            nro_operacion_comision: bulkReference,
            banco_comision: bulkBank
          })
        });
      });

      await Promise.all(promises);
      
      setSelectedIds(new Set());
      setShowBulkModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error al conciliar comisiones en lote:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportExcel = () => {
    const itemsToExport = selectedIds.size > 0 
      ? filtered.filter(item => selectedIds.has(item.id))
      : filtered;

    if (itemsToExport.length === 0) {
      alert('No hay comisiones para exportar.');
      return;
    }

    const data = itemsToExport.map(item => {
      const policy = policies.find(p => p.id === item.id_poliza);
      const client = policy ? clients.find(c => c.id === policy.id_cliente) : null;
      return {
        'Aseguradora': policy?.compania_aseguradora || 'Desconocida',
        'Asegurado': client?.nombre || 'Desconocido',
        'Ramo': policy?.ramo || '',
        'Nro Póliza': policy?.numero_poliza || '',
        'Cuota Nro': item.numero_cuota,
        'Monto Cuota Cliente': item.monto_cuota_cliente,
        'Moneda': policy?.moneda || 'USD',
        'Monto Comisión Broker': item.comision_cuota_broker,
        'Estado Prima': item.estado_pago,
        'Estado Comisión': item.estado_comision === 'Cobrado' ? 'Cobrado' : 'Por cobrar',
        'Fecha Vencimiento': formatDateToLocal(item.fecha_vencimiento),
        'Fecha Cobro Comisión': item.fecha_pago_comision ? formatDateToLocal(item.fecha_pago_comision) : '',
        'Banco Recibido': item.banco_comision || '',
        'Nro Operación': item.nro_operacion_comision || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comisiones');
    
    // Auto-fit column widths
    const max_len = data.reduce((w, r) => Math.max(w, Object.values(r).join('').length), 10);
    worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];

    XLSX.writeFile(workbook, `Reporte_Comisiones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  const renderSortArrow = (field: keyof PaymentSchedule) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="sort-icon" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} className="sort-icon" style={{ color: '#2563EB' }} /> 
      : <ArrowDown size={13} className="sort-icon" style={{ color: '#2563EB' }} />;
  };

  if (loading && schedules.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px' }}>
        <RefreshCw size={36} className="animate-blink-update" style={{ color: '#2563EB' }} />
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Cargando módulo de comisiones...</span>
      </div>
    );
  }

  // Get selected list for calculation inside modal or totalizers
  const selectedItemsList = filtered.filter(item => selectedIds.has(item.id));
  const selectedCommissionsTotal = selectedItemsList.reduce((sum, s) => sum + s.comision_cuota_broker, 0);

  return (
    <div className="animate-fade-in">
      
      {/* CSS print overrides inside component */}
      <style jsx global>{`
        @media print {
          aside, header, nav, .sidebar-header, .sidebar-menu, .app-topbar, .no-print, .pagination-container, .pagination-actions, .kpi-grid {
            display: none !important;
          }
          .app-container, .app-main, .content-wrapper, main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
            box-shadow: none !important;
          }
          .premium-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 20px;
            border-bottom: 2px solid #334155;
            padding-bottom: 10px;
          }
          .print-header h1 {
            font-size: 20px;
            color: #0F172A;
            font-weight: bold;
          }
          .print-header p {
            font-size: 11px;
            color: #475569;
          }
          .print-footer {
            display: block !important;
            margin-top: 30px;
            border-top: 1px dashed #94A3B8;
            padding-top: 10px;
            font-size: 10px;
            text-align: center;
            color: #64748B;
          }
          .premium-table th {
            background-color: #F8FAFC !important;
            color: #0F172A !important;
            border-bottom: 2px solid #E2E8F0 !important;
            font-size: 11px !important;
            padding: 6px 8px !important;
          }
          .premium-table td {
            font-size: 10.5px !important;
            padding: 6px 8px !important;
            border-bottom: 1px solid #E2E8F0 !important;
          }
          .badge {
            border: 1px solid #CBD5E1 !important;
            background: transparent !important;
            color: black !important;
          }
          table th:first-child, table td:first-child {
            display: none !important; /* Hide selection checkbox column in print */
          }
        }
        .print-header, .print-footer {
          display: none;
        }
      `}</style>

      {/* PRINT REPORT HEADER */}
      <div className="print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{currentTenant ? currentTenant.nombre : 'Broker'} - Reporte de Comisiones por Cobrar</h1>
            <p>RUC: {currentTenant ? currentTenant.ruc : '---'} | Lista consolidada de comisiones pendientes de liquidación por parte de las aseguradoras.</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
            <strong>Fecha de Generación:</strong> {new Date().toLocaleDateString('es-PE')}<br />
            <strong>Total Registros:</strong> {selectedIds.size > 0 ? selectedIds.size : filtered.length}
          </div>
        </div>
      </div>

      {/* Screen Title Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={24} style={{ color: '#2563EB' }} />
            Seguimiento y Liquidación de Comisiones
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Gestiona, filtra y liquida en lote las comisiones de los documentos cobrados que se encuentran pendientes de pago por las aseguradoras.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={exportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            Imprimir PDF
          </button>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div className="kpi-grid" style={{ marginBottom: '25px' }}>
        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Por Cobrar (Con Prima Pagada)</h3>
            <div className="kpi-value">USD {totalPorCobrarMonto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#F59E0B' }}>Pendiente Conciliación</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Coins size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Liquidado / Cobrado Histórico</h3>
            <div className="kpi-value">USD {totalCobradasMonto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#10B981' }}>Comisiones Recibidas</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <h3>Total Comisiones Generadas</h3>
            <div className="kpi-value">USD {totalComisionMonto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <span className="kpi-subtitle" style={{ color: '#2563EB' }}>Monto Emitido Total</span>
          </div>
          <div className="kpi-icon" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="premium-card no-print" style={{ padding: '20px', marginBottom: '25px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '15px' }}>Filtros de Búsqueda Avanzada</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'flex-end' }}>
          {/* General Search */}
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

          {/* Insured filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Asegurado</label>
            <input 
              type="text" 
              placeholder="Nombre de cliente"
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={insuredFilter}
              onChange={(e) => { setInsuredFilter(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Insurer filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Aseguradora</label>
            <input 
              type="text" 
              placeholder="Nombre de aseguradora"
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={insurerFilter}
              onChange={(e) => { setInsurerFilter(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Branch filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Ramo</label>
            <input 
              type="text" 
              placeholder="Ramo de seguro"
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'flex-end', marginTop: '15px' }}>
          {/* Client Premium Payment Status */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Estado Pago de Prima</label>
            <select 
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={premiumStatusFilter}
              onChange={(e: any) => { setPremiumStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="Todos">Todos</option>
              <option value="Pagado">Pagado (Conciliables / Liquidables)</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>

          {/* Commission Payment Status */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Estado Pago Comisión</label>
            <select 
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={commissionStatusFilter}
              onChange={(e: any) => { setCommissionStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="Todos">Todos</option>
              <option value="Por cobrar">Por cobrar (Pendiente)</option>
              <option value="Cobrado">Cobrado</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Vencimiento Desde</label>
            <input 
              type="date" 
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Date Range End */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '12.5px', marginBottom: '6px' }}>Vencimiento Hasta</label>
            <input 
              type="date" 
              className="form-input" 
              style={{ padding: '6px 10px', fontSize: '13px' }}
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || insuredFilter || branchFilter || insurerFilter || premiumStatusFilter !== 'Pagado' || commissionStatusFilter !== 'Por cobrar' || dateFrom || dateTo) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => {
                setSearchTerm('');
                setInsuredFilter('');
                setBranchFilter('');
                setInsurerFilter('');
                setPremiumStatusFilter('Pagado');
                setCommissionStatusFilter('Por cobrar');
                setDateFrom('');
                setDateTo('');
                setCurrentPage(1);
              }}
            >
              Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* SELECTED ITEMS BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="premium-card no-print animate-slide-in" style={{ backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Coins size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 600 }}>
              {selectedIds.size} comisiones seleccionadas para cobro | Total: <span style={{ color: '#047857' }}>USD {selectedCommissionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => {
              setBulkDate(new Date().toISOString().split('T')[0]);
              setBulkBank(bankOptions[0]?.value || 'BCP');
              setBulkReference('');
              setShowBulkModal(true);
            }}
          >
            Dar por cobradas ({selectedIds.size})
          </button>
        </div>
      )}

      {/* MAIN DATA TABLE */}
      <div className="premium-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="no-print" style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={isAllSelected} 
                    onChange={handleSelectAll} 
                  />
                </th>
                <th className="sortable" onClick={() => handleSort('fecha_vencimiento')}>
                  Fecha Vencimiento {renderSortArrow('fecha_vencimiento')}
                </th>
                <th>Aseguradora</th>
                <th>Asegurado</th>
                <th>Ramo</th>
                <th>Póliza</th>
                <th>Cuota</th>
                <th>Prima Cliente</th>
                <th>Comisión Broker</th>
                <th>Estado Prima</th>
                <th>Estado Comisión</th>
                <th>Detalles Depósito</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No se encontraron comisiones que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedSchedules.map((item) => {
                  const policy = policies.find(p => p.id === item.id_poliza);
                  const client = policy ? clients.find(c => c.id === policy.id_cliente) : null;
                  const isChecked = selectedIds.has(item.id);

                  return (
                    <tr key={item.id} className={isChecked ? 'row-selected' : ''}>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)} 
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatDateToLocal(item.fecha_vencimiento)}</td>
                      <td>
                        <span className="badge badge-secondary">{policy?.compania_aseguradora}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{client?.nombre || 'Desconocido'}</td>
                      <td>{policy?.ramo}</td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{policy?.numero_poliza}</td>
                      <td>Cuota {item.numero_cuota}</td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(item.monto_cuota_cliente, policy?.moneda)}
                      </td>
                      <td style={{ fontWeight: 700, color: '#047857' }}>
                        {formatCurrency(item.comision_cuota_broker, policy?.moneda)}
                      </td>
                      <td>
                        <span className={`badge ${
                          item.estado_pago === 'Pagado' ? 'badge-success' :
                          item.estado_pago === 'Vencido' ? 'badge-danger' : 'badge-info'
                        }`} style={{ fontSize: '10px' }}>
                          {(item.estado_pago || 'Pendiente').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          item.estado_comision === 'Cobrado' ? 'badge-success' : 'badge-warning'
                        }`} style={{ fontSize: '10px' }}>
                          {item.estado_comision === 'Cobrado' ? 'COBRADO' : 'POR COBRAR'}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: '#475569' }}>
                        {item.estado_comision === 'Cobrado' ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span><strong>Fecha:</strong> {formatDateToLocal(item.fecha_pago_comision || '')}</span>
                            <span><strong>Banco:</strong> {item.banco_comision || '-'}</span>
                            <span><strong>Op/Ref:</strong> {item.nro_operacion_comision || '-'}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Pendiente</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Grand Total Row in screen & print */}
              {filtered.length > 0 && (
                <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 'bold' }}>
                  <td className="no-print"></td>
                  <td colSpan={6} style={{ textAlign: 'right', fontSize: '13px' }}>TOTALES FILTRADOS:</td>
                  <td style={{ fontSize: '13px', color: '#0F172A' }}>
                    USD {filtered.reduce((sum, item) => sum + item.monto_cuota_cliente, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ fontSize: '13px', color: '#047857' }}>
                    USD {filtered.reduce((sum, item) => sum + item.comision_cuota_broker, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container no-print">
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

      {/* PRINT REPORT FOOTER */}
      <div className="print-footer">
        Este documento es un reporte interno de liquidación de {currentTenant ? currentTenant.nombre : 'su broker'}.<br />
        SaaS InsureONE | Powered by Optimus SP | https://optimussp.com
      </div>

      {/* MODAL: REGISTRAR COBRO EN LOTE */}
      {showBulkModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Cobro de Comisiones</h3>
              <button className="modal-close-btn" onClick={() => setShowBulkModal(false)}>&times;</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleBulkUpdate();
            }}>
              <div className="modal-body">
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '12.5px', marginBottom: '15px' }}>
                  Vas a marcar <strong>{selectedIds.size} comisiones</strong> como cobradas por un total de <strong>USD {selectedCommissionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>.
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Pago / Abono *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={bulkDate} 
                    onChange={(e) => setBulkDate(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Banco Receptor *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select 
                      className="form-input" 
                      value={bulkBank} 
                      onChange={(e) => setBulkBank(e.target.value)}
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
                            setBulkBank(val);
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
                  <label className="form-label">Nro. Operación / Depósito *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. DEP-581903" 
                    value={bulkReference} 
                    onChange={(e) => setBulkReference(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Depósito</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
