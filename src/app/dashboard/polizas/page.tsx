'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  RefreshCw,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  ChevronDown
} from 'lucide-react';

interface Client {
  id: string;
  nombre: string;
  documento_numero: string;
}

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

const ASEGURADORAS_CATALOGO = [
  {
    nombre: 'Rimac Seguros',
    telefono: '01 411-1111',
    ejecutivo: 'Roberto Quiroz',
    email: 'rquiroz@rimac.com.pe',
    direccion: 'Av. Paseo de la República 3501, San Isidro'
  },
  {
    nombre: 'Pacífico Seguros',
    telefono: '01 513-5000',
    ejecutivo: 'Vanessa Prado',
    email: 'vprado@pacifico.com.pe',
    direccion: 'Av. Juan de Arona 830, San Isidro'
  },
  {
    nombre: 'Mapfre Perú',
    telefono: '01 213-3333',
    ejecutivo: 'Carlos Mendoza',
    email: 'cmendoza@mapfre.com.pe',
    direccion: 'Av. 28 de Julio 873, Miraflores'
  },
  {
    nombre: 'La Positiva',
    telefono: '01 211-0211',
    ejecutivo: 'Gabriela Diaz',
    email: 'gdiaz@lapositiva.com.pe',
    direccion: 'Av. San Isidro Carabayllo 444, San Isidro'
  }
];

export default function PolizasPage() {
  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<'lista' | 'catalogo' | 'renovaciones'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [renewalFilterDays, setRenewalFilterDays] = useState<30 | 60 | 90>(30);

  // Sorting
  const [sortField, setSortField] = useState<keyof Policy>('numero_poliza');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editPolicyId, setEditPolicyId] = useState<string | null>(null);

  // Dynamic Lists for Autocomplete/Dropdowns
  const [ramosList, setRamosList] = useState<string[]>(['Vehicular', 'EPS', 'SCTR', 'Vida', 'Multirriesgo']);
  const [coveragesList, setCoveragesList] = useState<string[]>([
    'Daño Propio',
    'Responsabilidad Civil',
    'Robo Total',
    'Gastos Médicos',
    'Maternidad',
    'Fallecimiento Natural',
    'Invalidez Permanente'
  ]);

  // Form Fields
  const [idCliente, setIdCliente] = useState('');
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [compania, setCompania] = useState('Rimac');
  const [ramo, setRamo] = useState('Vehicular');
  const [numeroPoliza, setNumeroPoliza] = useState('');
  const [sumaAsegurada, setSumaAsegurada] = useState('');
  const [deducibles, setDeducibles] = useState('');
  const [coberturas, setCoberturas] = useState('');
  const [moneda, setMoneda] = useState<'USD' | 'PEN'>('USD');
  const [periodicidad, setPeriodicidad] = useState<'Anual' | 'Semestral' | 'Mensual'>('Anual');
  
  // Coberturas Search dropdown
  const [coverageSearchInput, setCoverageSearchInput] = useState('');
  const [showCoverageDropdown, setShowCoverageDropdown] = useState(false);

  // Math Model state
  const [primaNeta, setPrimaNeta] = useState<number>(0);
  const [gastosEmision, setGastosEmision] = useState<number>(0);
  const [porcentajeComision, setPorcentajeComision] = useState<number>(15);
  const [installments, setInstallments] = useState<number>(4);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Auto-calculated outputs
  const [subtotal, setSubtotal] = useState(0);
  const [igv, setIgv] = useState(0);
  const [primaTotal, setPrimaTotal] = useState(0);
  const [comisionTotal, setComisionTotal] = useState(0);
  const [mathFlash, setMathFlash] = useState(false);

  // Load Policies and Clients
  const fetchData = async () => {
    try {
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

  // Pre-populate date on modal open
  useEffect(() => {
    if (createModalOpen && !editPolicyId) {
      const today = new Date().toISOString().split('T')[0];
      setFechaInicio(today);
    }
  }, [createModalOpen, editPolicyId]);

  // Reactive dates auto-calculation based on Periodicidad
  // June 6, 2026 -> June 6, 2027 (same day, same month of next year/period)
  useEffect(() => {
    if (fechaInicio) {
      const startDate = new Date(fechaInicio);
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(startDate);
        if (periodicidad === 'Anual') {
          endDate.setFullYear(startDate.getFullYear() + 1);
        } else if (periodicidad === 'Semestral') {
          endDate.setMonth(startDate.getMonth() + 6);
        } else if (periodicidad === 'Mensual') {
          endDate.setMonth(startDate.getMonth() + 1);
        }
        setFechaFin(endDate.toISOString().split('T')[0]);
      }
    }
  }, [fechaInicio, periodicidad]);

  // Reactive Premium & Commission Calculations
  useEffect(() => {
    const net = Number(primaNeta || 0);
    // Gastos de Emisión automatically proposed at 3%
    const emis = Number((net * 0.03).toFixed(2));
    setGastosEmision(emis);
  }, [primaNeta]);

  // Subtotal, IGV, Prima Total, Broker Commission Calculations
  useEffect(() => {
    const net = Number(primaNeta || 0);
    const emis = Number(gastosEmision || 0);
    const pct = Number(porcentajeComision || 0);

    const sub = Number((net + emis).toFixed(2));
    const tax = Number((sub * 0.18).toFixed(2));
    const tot = Number((sub + tax).toFixed(2));
    const com = Number((net * (pct / 100)).toFixed(2));

    setSubtotal(sub);
    setIgv(tax);
    setPrimaTotal(tot);
    setComisionTotal(com);

    // Flash animation to provide premium feedback feel
    setMathFlash(true);
    const t = setTimeout(() => setMathFlash(false), 300);
    return () => clearTimeout(t);
  }, [primaNeta, gastosEmision, porcentajeComision]);

  // Handle policy creation / edit submit
  const handleSubmitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente || !numeroPoliza || !fechaInicio || !fechaFin) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Prevent date logic issues
    if (new Date(fechaFin) < new Date(fechaInicio)) {
      alert('La fecha final no puede ser anterior a la inicial.');
      return;
    }

    try {
      const res = await fetch('/api/polizas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editPolicyId ? 'update' : 'create',
          id: editPolicyId || undefined,
          id_cliente: idCliente,
          compania_aseguradora: compania,
          ramo,
          numero_poliza: numeroPoliza,
          suma_asegurada: Number(sumaAsegurada || 0),
          deducibles,
          coberturas,
          prima_neta: primaNeta,
          gastos_emision: gastosEmision,
          igv,
          prima_total: primaTotal,
          porcentaje_comision: porcentajeComision,
          comision_total: comisionTotal,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          moneda,
          periodicidad,
          installments
        })
      });

      if (res.ok) {
        fetchData();
        handleCloseModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPolicy = (p: Policy) => {
    setEditPolicyId(p.id);
    setIdCliente(p.id_cliente);
    
    const clientObj = clients.find(c => c.id === p.id_cliente);
    setClientSearchInput(clientObj ? clientObj.nombre : '');
    
    setCompania(p.compania_aseguradora);
    setRamo(p.ramo);
    if (!ramosList.includes(p.ramo)) {
      setRamosList(prev => [...prev, p.ramo]);
    }
    
    setNumeroPoliza(p.numero_poliza);
    setSumaAsegurada(String(p.suma_asegurada));
    setDeducibles(p.deducibles);
    setCoberturas(p.coberturas);
    setPrimaNeta(p.prima_neta);
    setGastosEmision(p.gastos_emision);
    setPorcentajeComision(p.porcentaje_comision);
    setFechaInicio(p.fecha_inicio);
    setFechaFin(p.fecha_fin);
    setMoneda(p.moneda || 'USD');
    setPeriodicidad(p.periodicidad || 'Anual');
    setCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditPolicyId(null);
    setIdCliente('');
    setClientSearchInput('');
    setNumeroPoliza('');
    setSumaAsegurada('');
    setDeducibles('');
    setCoberturas('');
    setPrimaNeta(0);
    setGastosEmision(0);
    setPorcentajeComision(15);
    setInstallments(4);
    setMoneda('USD');
    setPeriodicidad('Anual');
  };

  // Sorting Handler
  const handleSort = (field: keyof Policy) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortArrow = (field: keyof Policy) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="sort-icon" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} className="sort-icon" style={{ color: '#2563EB' }} /> 
      : <ArrowDown size={13} className="sort-icon" style={{ color: '#2563EB' }} />;
  };

  // Filter policies based on Search Term
  const getFilteredPolicies = () => {
    const list = policies.filter(p => {
      const clientName = clients.find(c => c.id === p.id_cliente)?.nombre || '';
      return (
        p.numero_poliza.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ramo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.compania_aseguradora.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (activeTab === 'renovaciones') {
      const systemDate = new Date('2026-06-05');
      return list.filter(p => {
        const finDate = new Date(p.fecha_fin);
        const timeDiff = finDate.getTime() - systemDate.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= renewalFilterDays;
      });
    }

    return list;
  };

  const filtered = getFilteredPolicies();
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
  const paginatedPolicies = sorted.slice(startIndex, endIndex);

  // Pre-generate installments schedule for visual preview in form
  const getInstallmentPreview = () => {
    const list = [];
    const cuotaMonto = Number((primaTotal / installments).toFixed(2));
    const comisionMonto = Number((comisionTotal / installments).toFixed(2));
    const start = new Date(fechaInicio || Date.now());

    for (let i = 1; i <= installments; i++) {
      const due = new Date(start);
      due.setDate(due.getDate() + (i - 1) * 30);
      list.push({
        cuota: i,
        monto: cuotaMonto,
        comision: comisionMonto,
        fecha: due.toISOString().split('T')[0]
      });
    }
    return list;
  };

  const previewSchedule = getInstallmentPreview();

  // Helper to format currency symbol dynamically
  const formatCurrency = (val: number, cur?: 'USD' | 'PEN') => {
    const symbol = cur === 'PEN' ? 'S/.' : 'USD';
    return `${symbol} ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Autocomplete filtering logic
  const filteredClientsForDropdown = clients.filter(c => 
    c.nombre.toLowerCase().includes(clientSearchInput.toLowerCase())
  );

  const filteredCoveragesForDropdown = coveragesList.filter(c => 
    c.toLowerCase().includes(coverageSearchInput.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      
      {/* Title bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} style={{ color: '#2563EB' }} />
            Gestión de Pólizas
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Registra pólizas intermediadas, calcula comisiones del bróker y administra cronogramas de renovación.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          Registrar Póliza
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="premium-card" style={{ padding: 0, marginBottom: '25px', overflow: 'visible' }}>
        <div className="tabs-navigation" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <button 
            className={`tab-btn ${activeTab === 'lista' ? 'active' : ''}`}
            onClick={() => { setActiveTab('lista'); setCurrentPage(1); }}
          >
            <FileText size={16} />
            Pólizas Activas
          </button>
          <button 
            className={`tab-btn ${activeTab === 'renovaciones' ? 'active' : ''}`}
            onClick={() => { setActiveTab('renovaciones'); setCurrentPage(1); }}
          >
            <RefreshCw size={16} />
            Gestor de Renovaciones
          </button>
          <button 
            className={`tab-btn ${activeTab === 'catalogo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('catalogo'); setCurrentPage(1); }}
          >
            <Building2 size={16} />
            Catálogo Aseguradoras
          </button>
        </div>

        {/* Global Filter (Search/Renewal selector) */}
        {activeTab !== 'catalogo' && (
          <div className="card-body" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
              <Search size={16} className="search-icon" style={{ top: '10px' }} />
              <input 
                type="text" 
                placeholder="Buscar póliza por número, ramo, aseguradora o cliente..." 
                className="form-input search-input" 
                style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            {activeTab === 'renovaciones' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Vencer en:</span>
                <select 
                  className="form-input" 
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                  value={renewalFilterDays}
                  onChange={(e: any) => { setRenewalFilterDays(Number(e.target.value) as any); setCurrentPage(1); }}
                >
                  <option value={30}>Próximos 30 días</option>
                  <option value={60}>Próximos 60 días</option>
                  <option value={90}>Próximos 90 días</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RENDER ACTIVE TAB: POLICIES GRID */}
      {(activeTab === 'lista' || activeTab === 'renovaciones') && (
        <div className="premium-card">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('numero_poliza')}>
                    Nro Póliza {renderSortArrow('numero_poliza')}
                  </th>
                  <th>Asegurado / Cliente</th>
                  <th className="sortable" onClick={() => handleSort('compania_aseguradora')}>
                    Aseguradora {renderSortArrow('compania_aseguradora')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('ramo')}>
                    Ramo {renderSortArrow('ramo')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('prima_total')}>
                    Prima Total {renderSortArrow('prima_total')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('comision_total')}>
                    Comisión Broker {renderSortArrow('comision_total')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('fecha_fin')}>
                    Vence el {renderSortArrow('fecha_fin')}
                  </th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                      {activeTab === 'renovaciones' ? (
                        <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                          <div className="empty-state-icon">
                            <RefreshCw size={32} />
                          </div>
                          <div className="empty-state-title">¡Todo al día!</div>
                          <p className="empty-state-desc">No tienes renovaciones pendientes para este rango de fechas.</p>
                        </div>
                      ) : (
                        <div style={{ color: '#94A3B8' }}>No se encontraron pólizas registradas.</div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedPolicies.map((p) => {
                    const client = clients.find(c => c.id === p.id_cliente);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{p.numero_poliza}</td>
                        <td>
                          {client ? (
                            <div>
                              <div style={{ fontWeight: 500 }}>{client.nombre}</div>
                              <div style={{ fontSize: '11px', color: '#64748B' }}>Doc: {client.documento_numero}</div>
                            </div>
                          ) : (
                            'Desconocido'
                          )}
                        </td>
                        <td>{p.compania_aseguradora}</td>
                        <td>
                          <span className="badge badge-secondary">{p.ramo}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-title)', fontWeight: 600 }}>
                          {formatCurrency(p.prima_total, p.moneda)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-title)', fontWeight: 600, color: '#047857' }}>
                          {formatCurrency(p.comision_total, p.moneda)}
                          <span style={{ fontSize: '10px', color: '#64748B', marginLeft: '4px' }}>({p.porcentaje_comision}%)</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{formatDateToLocal(p.fecha_fin)}</td>
                        <td>
                          <span className={`badge ${
                            p.estado === 'Vigente' ? 'badge-success' :
                            p.estado === 'Por Vencer' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {(p.estado || 'Vigente').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleEditPolicy(p)}
                          >
                            <Edit2 size={12} />
                            Editar
                          </button>
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
      )}

      {/* RENDER CATALOGUE TAB */}
      {activeTab === 'catalogo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {ASEGURADORAS_CATALOGO.map((a, i) => (
            <div key={i} className="premium-card animate-slide-in" style={{ margin: 0 }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} />
                </div>
                <h2 style={{ fontSize: '15px' }}>{a.nombre}</h2>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} style={{ color: '#64748B' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Emergencias: {a.telefono}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: '#64748B' }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>EJECUTIVO DE CUENTA</div>
                    <span style={{ fontSize: '13px' }}>{a.ejecutivo} ({a.email})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={14} style={{ color: '#64748B', marginTop: '3px' }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>OFICINA PRINCIPAL</div>
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{a.direccion}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POLICY CREATION / EDITING MODAL */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ maxHeight: '95vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editPolicyId ? 'Editar Póliza' : 'Registrar Nueva Póliza'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmitPolicy}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                
                {/* Left side: Form fields */}
                <div>
                  <div className="grid-cols-2">
                    
                    {/* Search Autocomplete client selector */}
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label">Asegurado Titular *</label>
                      <div className="form-input-container">
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Escriba para buscar cliente..." 
                          value={clientSearchInput}
                          onChange={(e) => {
                            setClientSearchInput(e.target.value);
                            setShowClientDropdown(true);
                            if (!e.target.value) {
                              setIdCliente('');
                            }
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          onBlur={() => setTimeout(() => setShowClientDropdown(false), 250)}
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle-btn"
                          onClick={() => setShowClientDropdown(!showClientDropdown)}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      {showClientDropdown && filteredClientsForDropdown.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto', zIndex: 110, marginTop: '4px' }}>
                          {filteredClientsForDropdown.map(c => (
                            <div 
                              key={c.id}
                              className="dropdown-item"
                              style={{ padding: '8px 12px', cursor: 'pointer' }}
                              onClick={() => {
                                setIdCliente(c.id);
                                setClientSearchInput(c.nombre);
                                setShowClientDropdown(false);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {c.nombre} ({c.documento_numero})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Número de Póliza *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej. CAR-98324-2026" 
                        value={numeroPoliza} 
                        onChange={(e) => setNumeroPoliza(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label className="form-label">Aseguradora</label>
                      <select className="form-input" value={compania} onChange={(e) => setCompania(e.target.value)}>
                        <option value="Rimac">Rimac</option>
                        <option value="Pacifico">Pacífico</option>
                        <option value="Mapfre">Mapfre</option>
                        <option value="La Positiva">La Positiva</option>
                      </select>
                    </div>

                    {/* Ramo of Seguro with dynamic "+" button */}
                    <div className="form-group">
                      <label className="form-label">Ramo</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select className="form-input" value={ramo} onChange={(e) => setRamo(e.target.value)}>
                          {ramosList.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 12px' }}
                          title="Adicionar nuevo Ramo"
                          onClick={() => {
                            const val = prompt('Ingrese el nombre del nuevo Ramo:');
                            if (val && val.trim()) {
                              const nuevo = val.trim();
                              if (!ramosList.includes(nuevo)) {
                                setRamosList(prev => [...prev, nuevo]);
                              }
                              setRamo(nuevo);
                            }
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Suma Asegurada</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Monto de cobertura"
                        value={sumaAsegurada} 
                        onChange={(e) => setSumaAsegurada(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label className="form-label">Fecha de Inicio *</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={fechaInicio} 
                        onChange={(e) => setFechaInicio(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Periodicidad</label>
                      <select className="form-input" value={periodicidad} onChange={(e: any) => setPeriodicidad(e.target.value)}>
                        <option value="Anual">Anual</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Mensual">Mensual</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha de Término *</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        min={fechaInicio} 
                        value={fechaFin} 
                        onChange={(e) => setFechaFin(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Coberturas Autocomplete Search Input & textarea */}
                  <div className="form-group">
                    <label className="form-label">Coberturas Contratadas</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', position: 'relative' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Buscar coberturas predefinidas..." 
                        value={coverageSearchInput}
                        onChange={(e) => {
                          setCoverageSearchInput(e.target.value);
                          setShowCoverageDropdown(true);
                        }}
                        onFocus={() => setShowCoverageDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCoverageDropdown(false), 250)}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 12px' }}
                        title="Adicionar nueva Cobertura"
                        onClick={() => {
                          const val = prompt('Ingrese el nombre de la nueva cobertura:');
                          if (val && val.trim()) {
                            const nueva = val.trim();
                            if (!coveragesList.includes(nueva)) {
                              setCoveragesList(prev => [...prev, nueva]);
                            }
                            setCoberturas(prev => prev ? `${prev}, ${nueva}` : nueva);
                          }
                        }}
                      >
                        +
                      </button>

                      {showCoverageDropdown && filteredCoveragesForDropdown.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', maxHeight: '150px', overflowY: 'auto', zIndex: 110, marginTop: '4px' }}>
                          {filteredCoveragesForDropdown.map(c => (
                            <div 
                              key={c}
                              className="dropdown-item"
                              style={{ padding: '8px 12px', cursor: 'pointer' }}
                              onClick={() => {
                                setCoberturas(prev => {
                                  const list = prev ? prev.split(',').map(x => x.trim()) : [];
                                  if (list.includes(c)) return prev;
                                  return prev ? `${prev}, ${c}` : c;
                                });
                                setCoverageSearchInput('');
                                setShowCoverageDropdown(false);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea 
                      className="form-input" 
                      style={{ height: '60px', resize: 'none' }}
                      placeholder="Indique las coberturas principales..."
                      value={coberturas}
                      onChange={(e) => setCoberturas(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Deducibles y Copagos</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. USD 150 deducible general, 10% coaseguro"
                      value={deducibles}
                      onChange={(e) => setDeducibles(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right side: Interactive math model calculations */}
                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4 style={{ fontSize: '14px', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} style={{ color: '#2563EB' }} />
                    Modelo Matemático de Primas
                  </h4>

                  {/* Moneda Currency Selector */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Moneda del Contrato</label>
                    <select className="form-input" style={{ padding: '8px 10px' }} value={moneda} onChange={(e: any) => setMoneda(e.target.value)}>
                      <option value="USD">Dólares ($ / USD)</option>
                      <option value="PEN">Soles (S/. / PEN)</option>
                    </select>
                  </div>

                  <div className="grid-cols-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Prima Neta ({moneda}) *</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ padding: '8px 10px' }}
                        value={primaNeta || ''} 
                        onChange={(e) => setPrimaNeta(Number(e.target.value))} 
                        placeholder="0.00"
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>G. Emisión (3%) ({moneda})</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ padding: '8px 10px' }}
                        value={gastosEmision || ''} 
                        onChange={(e) => setGastosEmision(Number(e.target.value))} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Calculations Feedbacks */}
                  <div className={`animate-slide-in ${mathFlash ? 'animate-blink-update' : ''}`} style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                      <span>Subtotal (Prima + Gastos):</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(subtotal, moneda)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                      <span>IGV (18% sobre Subtotal):</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(igv, moneda)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed #E2E8F0', paddingTop: '6px', fontWeight: 700, color: '#0F172A' }}>
                      <span>Prima Total Cliente:</span>
                      <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(primaTotal, moneda)}</span>
                    </div>
                  </div>

                  <div className="grid-cols-2" style={{ marginTop: '5px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Comisión Broker %</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ padding: '8px 10px' }}
                        value={porcentajeComision || ''} 
                        onChange={(e) => setPorcentajeComision(Number(e.target.value))} 
                        placeholder="15" 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Comisión Total ({moneda})</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ padding: '8px 10px', background: '#F1F5F9', color: '#047857', fontWeight: 600 }}
                        value={formatCurrency(comisionTotal, moneda)} 
                        disabled 
                      />
                    </div>
                  </div>

                  {/* Installment generator preview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '13px' }}>Número de Cuotas</label>
                    <select 
                      className="form-input" 
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '13px' }}
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                    >
                      <option value={1}>1 Cuota (Contado)</option>
                      <option value={2}>2 Cuotas (Semestral)</option>
                      <option value={4}>4 Cuotas (Trimestral)</option>
                      <option value={12}>12 Cuotas (Mensual)</option>
                    </select>
                  </div>

                  {/* Real-time generated schedule preview */}
                  <div style={{ flex: 1, maxHeight: '120px', overflowY: 'auto', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      PROYECCIÓN DE CRONOGRAMA DE CUOTAS:
                    </span>
                    {previewSchedule.map((item) => (
                      <div key={item.cuota} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #F1F5F9', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: '#475569' }}>Cuota {item.cuota}</span>
                        <span style={{ color: '#0F172A' }}>Cliente: {formatCurrency(item.monto, moneda)}</span>
                        <span style={{ color: '#047857', fontWeight: 500 }}>Broker: {formatCurrency(item.comision, moneda)}</span>
                        <span style={{ color: '#64748B', fontSize: '11px' }}>{formatDateToLocal(item.fecha)}</span>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editPolicyId ? 'Guardar Cambios' : 'Registrar e Inicializar Cuotas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
