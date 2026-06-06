'use client';

import React, { useState, useEffect } from 'react';
import { 
  Columns, 
  Table, 
  Plus, 
  Search, 
  MoveRight, 
  MoveLeft, 
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface Lead {
  id: string;
  nombre: string;
  compania: string;
  documento: string;
  email: string;
  telefono: string;
  direccion: string;
  giro: string;
  estado: 'nuevo' | 'contactado' | 'cotizando' | 'ganado' | 'perdido';
  prima_proyectada: number;
  ramo: string;
  fecha_creacion: string;
}

const COLUMNS = [
  { key: 'nuevo', label: 'NUEVO CONTACTO', colorClass: 'column-1' },
  { key: 'contactado', label: 'CONTACTADO', colorClass: 'column-2' },
  { key: 'cotizando', label: 'COTIZANDO', colorClass: 'column-3' },
  { key: 'ganado', label: 'CERRADO GANADO', colorClass: 'column-4' },
  { key: 'perdido', label: 'CERRADO PERDIDO', colorClass: 'column-5' }
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting for grid view
  const [sortField, setSortField] = useState<keyof Lead>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [compania, setCompania] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [giro, setGiro] = useState('');
  const [ramo, setRamo] = useState('Vehicular');
  const [primaProyectada, setPrimaProyectada] = useState('');
  const [estado, setEstado] = useState<'nuevo' | 'contactado' | 'cotizando' | 'ganado' | 'perdido'>('nuevo');

  // Fetch leads
  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filtered Leads
  const getFilteredLeads = () => {
    return leads.filter(l => {
      const term = searchTerm.toLowerCase();
      return (
        l.nombre.toLowerCase().includes(term) ||
        l.compania.toLowerCase().includes(term) ||
        l.documento.toLowerCase().includes(term) ||
        l.giro.toLowerCase().includes(term) ||
        l.ramo.toLowerCase().includes(term) ||
        l.direccion.toLowerCase().includes(term)
      );
    });
  };

  // Sort Leads for Grid view
  const getSortedLeads = (filtered: Lead[]) => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  };

  // Move lead state
  const moveLead = async (id: string, newStatus: Lead['estado']) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id,
          estado: newStatus
        })
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete lead
  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este prospecto?')) return;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id
        })
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          nombre,
          compania,
          documento,
          email,
          telefono,
          direccion,
          giro,
          ramo,
          prima_proyectada: Number(primaProyectada || 0),
          estado
        })
      });
      if (res.ok) {
        fetchLeads();
        setCreateModalOpen(false);
        // Reset fields
        setNombre('');
        setCompania('');
        setDocumento('');
        setEmail('');
        setTelefono('');
        setDireccion('');
        setGiro('');
        setPrimaProyectada('');
        setEstado('nuevo');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sorting Handler
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort arrow renderer
  const renderSortArrow = (field: keyof Lead) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="sort-icon" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} className="sort-icon" style={{ color: '#2563EB' }} /> 
      : <ArrowDown size={13} className="sort-icon" style={{ color: '#2563EB' }} />;
  };

  const filteredLeads = getFilteredLeads();
  const sortedLeads = getSortedLeads(filteredLeads);

  // Pagination Math
  const totalItems = sortedLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  return (
    <div className="animate-fade-in">
      {/* Title & Top Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Columns size={24} style={{ color: '#2563EB' }} />
            Leads y Prospectos
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Gestiona tus oportunidades comerciales, geolocalización, giros e integrantes adicionales.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Toggle View Mode Buttons */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <button 
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              onClick={() => setViewMode('kanban')}
            >
              <Columns size={14} />
              Kanban
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              onClick={() => setViewMode('grid')}
            >
              <Table size={14} />
              Grilla / Tabla
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="premium-card" style={{ padding: '15px 20px', marginBottom: '25px' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" style={{ top: '12px' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, Razón Social, RUC, Contacto, Dirección, Giro..." 
            className="form-input search-input" 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter(l => l.estado === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <span className={`kanban-column-title ${col.colorClass}`}>
                    {col.label}
                  </span>
                  <span className="kanban-card-count">{colLeads.length}</span>
                </div>
                
                <div className="kanban-cards-container">
                  {colLeads.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px', border: '2px dashed #E2E8F0', borderRadius: '8px', minHeight: '120px' }}>
                      Vacío
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div key={lead.id} className="kanban-card animate-slide-in">
                        <div className="kanban-card-title">{lead.nombre}</div>
                        <div className="kanban-card-meta">
                          {lead.compania && <div style={{ fontWeight: 500 }}>{lead.compania}</div>}
                          <div>Ramo: <span style={{ color: '#0F172A', fontWeight: 500 }}>{lead.ramo}</span></div>
                          <div>Giro: {lead.giro}</div>
                        </div>
                        <div className="kanban-card-footer">
                          <span className="kanban-card-value">
                            USD {lead.prima_proyectada.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          <div className="kanban-card-actions">
                            {col.key !== 'nuevo' && (
                              <button 
                                className="btn-card-action" 
                                title="Mover a etapa anterior"
                                onClick={() => {
                                  const idx = COLUMNS.findIndex(c => c.key === col.key);
                                  moveLead(lead.id, COLUMNS[idx - 1].key as Lead['estado']);
                                }}
                              >
                                <MoveLeft size={14} />
                              </button>
                            )}
                            {col.key !== 'perdido' && col.key !== 'ganado' && (
                              <button 
                                className="btn-card-action" 
                                title="Mover a etapa siguiente"
                                onClick={() => {
                                  const idx = COLUMNS.findIndex(c => c.key === col.key);
                                  moveLead(lead.id, COLUMNS[idx + 1].key as Lead['estado']);
                                }}
                              >
                                <MoveRight size={14} />
                              </button>
                            )}
                            <button 
                              className="btn-card-action" 
                              style={{ color: '#EF4444' }}
                              title="Eliminar"
                              onClick={() => handleDelete(lead.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GRID / TABLE VIEW */}
      {viewMode === 'grid' && (
        <div className="premium-card">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('nombre')}>
                    Nombre {renderSortArrow('nombre')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('compania')}>
                    Empresa / Compañía {renderSortArrow('compania')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('documento')}>
                    Documento {renderSortArrow('documento')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('ramo')}>
                    Ramo de Interés {renderSortArrow('ramo')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('prima_proyectada')}>
                    Prima Proyectada {renderSortArrow('prima_proyectada')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('estado')}>
                    Etapa / Estado {renderSortArrow('estado')}
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                      <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                        <div className="empty-state-title">No se encontraron prospectos</div>
                        <p className="empty-state-desc">Intenta realizar otra búsqueda o agrega un nuevo prospecto.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600 }}>{lead.nombre}</td>
                      <td>{lead.compania || '-'}</td>
                      <td>{lead.documento}</td>
                      <td>
                        <span className="badge badge-info">{lead.ramo}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-title)', fontWeight: 600 }}>
                        USD {lead.prima_proyectada.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge ${
                          lead.estado === 'nuevo' ? 'badge-secondary' :
                          lead.estado === 'contactado' ? 'badge-info' :
                          lead.estado === 'cotizando' ? 'badge-warning' :
                          lead.estado === 'ganado' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {((lead.estado || 'nuevo') as string).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select 
                            className="form-input btn-sm" 
                            style={{ width: 'auto', padding: '4px 8px' }}
                            value={lead.estado}
                            onChange={(e) => moveLead(lead.id, e.target.value as Lead['estado'])}
                          >
                            <option value="nuevo">Nuevo</option>
                            <option value="contactado">Contactado</option>
                            <option value="cotizando">Cotizando</option>
                            <option value="ganado">Ganado</option>
                            <option value="perdido">Perdido</option>
                          </select>
                          <button className="btn btn-secondary btn-sm" style={{ color: '#EF4444' }} onClick={() => handleDelete(lead.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nuevo Prospecto</h3>
              <button className="modal-close-btn" onClick={() => setCreateModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="modal-body">
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Nombre / Razón Social *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. Juan Perez o Inversiones S.A.C." 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Empresa / Compañía</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nombre de la empresa del cliente" 
                      value={compania} 
                      onChange={(e) => setCompania(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Documento ID (RUC/DNI) *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Número de documento" 
                      value={documento} 
                      onChange={(e) => setDocumento(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="ejemplo@correo.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nro celular o fijo" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección Completa</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Calle, Distrito, Provincia..." 
                    value={direccion} 
                    onChange={(e) => setDireccion(e.target.value)} 
                  />
                </div>

                <div className="grid-cols-4">
                  <div className="form-group">
                    <label className="form-label">Giro / Actividad</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. Legal, Construcción..." 
                      value={giro} 
                      onChange={(e) => setGiro(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ramo de Interés *</label>
                    <select className="form-input" value={ramo} onChange={(e) => setRamo(e.target.value)}>
                      <option value="Vehicular">Vehicular</option>
                      <option value="EPS">EPS</option>
                      <option value="SCTR">SCTR</option>
                      <option value="Vida">Vida</option>
                      <option value="Multirriesgo">Multirriesgo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prima Proyectada (USD) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Monto estimado" 
                      value={primaProyectada} 
                      onChange={(e) => setPrimaProyectada(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Etapa Inicial *</label>
                    <select className="form-input" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                      <option value="nuevo">Nuevo Contacto</option>
                      <option value="contactado">Contactado</option>
                      <option value="cotizando">Cotizando</option>
                      <option value="ganado">Cerrado Ganado</option>
                      <option value="perdido">Cerrado Perdido</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Prospecto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
