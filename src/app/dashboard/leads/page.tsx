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
  ArrowDown,
  Edit2,
  Calendar,
  ChevronDown,
  History
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
  fecha_seguimiento?: string;
  historial?: Array<{
    fecha: string;
    accion: string;
    nota: string;
    usuario: string;
    fecha_seguimiento?: string;
  }>;
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form Fields (Create/Edit)
  const [nombre, setNombre] = useState('');
  const [compania, setCompania] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [giro, setGiro] = useState('');
  const [primaProyectada, setPrimaProyectada] = useState('');
  const [estado, setEstado] = useState<'nuevo' | 'contactado' | 'cotizando' | 'ganado' | 'perdido'>('nuevo');

  // Ramo multiselect
  const [selectedRamos, setSelectedRamos] = useState<string[]>(['Vehicular']);
  const [showRamoDropdown, setShowRamoDropdown] = useState(false);

  // New Note fields for Lead Tracking
  const [noteAction, setNoteAction] = useState('Nota Interna');
  const [noteText, setNoteText] = useState('');
  const [fechaSeguimiento, setFechaSeguimiento] = useState('');

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
          ramo: selectedRamos.join(', '),
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
        setSelectedRamos(['Vehicular']);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Edit Lead Modal
  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setNombre(lead.nombre);
    setCompania(lead.compania || '');
    setDocumento(lead.documento);
    setEmail(lead.email);
    setTelefono(lead.telefono);
    setDireccion(lead.direccion);
    setGiro(lead.giro);
    setPrimaProyectada(String(lead.prima_proyectada));
    setEstado(lead.estado);
    setSelectedRamos(lead.ramo ? lead.ramo.split(',').map(r => r.trim()) : []);
    
    // Reset Note form
    setNoteAction('Nota Interna');
    setNoteText('');
    setFechaSeguimiento('');
    setEditModalOpen(true);
  };

  // Submit updated lead details
  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingLead.id,
          updatedFields: {
            nombre,
            compania,
            documento,
            email,
            telefono,
            direccion,
            giro,
            ramo: selectedRamos.join(', '),
            prima_proyectada: Number(primaProyectada || 0),
            estado
          }
        })
      });
      if (res.ok) {
        fetchLeads();
        setEditModalOpen(false);
        setEditingLead(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add a tracking note to lead history
  const handleAddLeadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !noteText) return;
    try {
      const newNote = {
        fecha: new Date().toISOString().split('T')[0],
        accion: noteAction,
        nota: noteText,
        usuario: 'Analista Principal',
        fecha_seguimiento: fechaSeguimiento || undefined
      };

      const existingHistory = editingLead.historial || [];
      const updatedHistory = [...existingHistory, newNote];

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingLead.id,
          updatedFields: {
            historial: updatedHistory,
            fecha_seguimiento: fechaSeguimiento || null
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local editingLead state
        setEditingLead(data.lead);
        setNoteText('');
        setFechaSeguimiento('');
        fetchLeads();
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
                      <div 
                        key={lead.id} 
                        className="kanban-card animate-slide-in"
                        style={{ cursor: 'pointer' }}
                        onDoubleClick={() => handleEditLeadClick(lead)}
                      >
                        <div className="kanban-card-title">{lead.nombre}</div>
                        <div className="kanban-card-meta">
                          {lead.compania && <div style={{ fontWeight: 500 }}>{lead.compania}</div>}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', marginBottom: '4px' }}>
                            {lead.ramo ? lead.ramo.split(',').map(r => (
                              <span key={r} className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px', margin: 0 }}>
                                {r.trim()}
                              </span>
                            )) : <span style={{ color: '#94A3B8' }}>Sin Ramo</span>}
                          </div>
                          <div>Giro: {lead.giro}</div>
                          {lead.fecha_seguimiento && (
                            <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Calendar size={11} />
                              Seguimiento: {lead.fecha_seguimiento}
                            </div>
                          )}
                        </div>
                        <div className="kanban-card-footer">
                          <span className="kanban-card-value">
                            USD {lead.prima_proyectada.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          
                          <div className="kanban-card-actions">
                            <button 
                              className="btn-card-action" 
                              title="Editar"
                              onClick={() => handleEditLeadClick(lead)}
                            >
                              <Edit2 size={13} />
                            </button>
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
                    <tr 
                      key={lead.id} 
                      style={{ cursor: 'pointer' }}
                      onDoubleClick={() => handleEditLeadClick(lead)}
                    >
                      <td style={{ fontWeight: 600 }}>{lead.nombre}</td>
                      <td>{lead.compania || '-'}</td>
                      <td>{lead.documento}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {lead.ramo ? lead.ramo.split(',').map(r => (
                            <span key={r} className="badge badge-info" style={{ fontSize: '10.5px', padding: '2px 6px', margin: 0 }}>
                              {r.trim()}
                            </span>
                          )) : <span style={{ color: '#94A3B8' }}>Sin Ramo</span>}
                        </div>
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            title="Editar"
                            onClick={() => handleEditLeadClick(lead)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <select 
                            className="form-input btn-sm" 
                            style={{ width: 'auto', padding: '4px 8px' }}
                            value={lead.estado}
                            onChange={(e) => moveLead(lead.id, e.target.value as Lead['estado'])}
                            onClick={(e) => e.stopPropagation()} // Prevent row doubleclick trigger
                          >
                            <option value="nuevo">Nuevo</option>
                            <option value="contactado">Contactado</option>
                            <option value="cotizando">Cotizando</option>
                            <option value="ganado">Ganado</option>
                            <option value="perdido">Perdido</option>
                          </select>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ color: '#EF4444' }} 
                            onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                          >
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
                   <div className="form-group" style={{ position: 'relative' }}>
                     <label className="form-label">Ramos de Interés *</label>
                     <div 
                       className="form-input" 
                       style={{ 
                         display: 'flex', 
                         justifyContent: 'space-between', 
                         alignItems: 'center', 
                         cursor: 'pointer',
                         minHeight: '38px',
                         height: 'auto',
                         padding: '6px 12px'
                       }}
                       onClick={() => setShowRamoDropdown(!showRamoDropdown)}
                     >
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                         {selectedRamos.length === 0 ? (
                           <span style={{ color: '#94A3B8' }}>Seleccione ramos...</span>
                         ) : (
                           selectedRamos.map(r => (
                             <span 
                               key={r} 
                               className="badge badge-info" 
                               style={{ 
                                 margin: 0, 
                                 fontSize: '11px', 
                                 padding: '2px 6px',
                                 display: 'inline-flex',
                                 alignItems: 'center',
                                 gap: '4px'
                               }}
                             >
                               {r}
                               <span 
                                 style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedRamos(prev => prev.filter(x => x !== r));
                                 }}
                               >
                                 &times;
                               </span>
                             </span>
                           ))
                         )}
                       </div>
                       <ChevronDown size={14} style={{ color: '#64748B' }} />
                     </div>

                     {showRamoDropdown && (
                       <div style={{ 
                         position: 'absolute', 
                         top: '100%', 
                         left: 0, 
                         right: 0, 
                         backgroundColor: '#FFFFFF', 
                         border: '1px solid #E2E8F0', 
                         borderRadius: '8px', 
                         boxShadow: 'var(--shadow-lg)', 
                         zIndex: 110, 
                         marginTop: '4px',
                         padding: '8px 0'
                       }}>
                         {['Vehicular', 'EPS', 'SCTR', 'Vida', 'Multirriesgo'].map(r => {
                           const isChecked = selectedRamos.includes(r);
                           return (
                             <div 
                               key={r} 
                               className="dropdown-item" 
                               style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '10px', 
                                 padding: '8px 12px', 
                                 cursor: 'pointer' 
                               }}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedRamos(prev => 
                                   prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
                                 );
                               }}
                             >
                               <input 
                                 type="checkbox" 
                                 checked={isChecked} 
                                 readOnly 
                                 style={{ cursor: 'pointer' }}
                               />
                               <span>{r}</span>
                             </div>
                           );
                         })}
                       </div>
                     )}
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

      {/* EDIT MODAL WITH NOTES & HISTORY */}
      {editModalOpen && editingLead && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3 className="modal-title">Editar Prospecto Comercial</h3>
              <button className="modal-close-btn" onClick={() => { setEditModalOpen(false); setEditingLead(null); }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', gap: '24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Left side: General Form Fields */}
              <form onSubmit={handleUpdateLead} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Nombre / Razón Social *</label>
                    <input 
                      type="text" 
                      className="form-input" 
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
                      value={compania} 
                      onChange={(e) => setCompania(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Documento ID *</label>
                    <input 
                      type="text" 
                      className="form-input" 
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
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giro / Actividad</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={giro} 
                      onChange={(e) => setGiro(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección Completa</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={direccion} 
                    onChange={(e) => setDireccion(e.target.value)} 
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Prima Proyectada (USD) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={primaProyectada} 
                      onChange={(e) => setPrimaProyectada(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Etapa Actual *</label>
                    <select className="form-input" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                      <option value="nuevo">Nuevo Contacto</option>
                      <option value="contactado">Contactado</option>
                      <option value="cotizando">Cotizando</option>
                      <option value="ganado">Cerrado Ganado</option>
                      <option value="perdido">Cerrado Perdido</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Ramos de Interés *</label>
                  <div 
                    className="form-input" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      minHeight: '38px',
                      height: 'auto',
                      padding: '6px 12px'
                    }}
                    onClick={() => setShowRamoDropdown(!showRamoDropdown)}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedRamos.length === 0 ? (
                        <span style={{ color: '#94A3B8' }}>Seleccione ramos...</span>
                      ) : (
                        selectedRamos.map(r => (
                          <span 
                            key={r} 
                            className="badge badge-info" 
                            style={{ 
                              margin: 0, 
                              fontSize: '11px', 
                              padding: '2px 6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {r}
                            <span 
                              style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRamos(prev => prev.filter(x => x !== r));
                              }}
                            >
                              &times;
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                    <ChevronDown size={14} style={{ color: '#64748B' }} />
                  </div>

                  {showRamoDropdown && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '8px', 
                      boxShadow: 'var(--shadow-lg)', 
                      zIndex: 110, 
                      marginTop: '4px',
                      padding: '8px 0'
                    }}>
                      {['Vehicular', 'EPS', 'SCTR', 'Vida', 'Multirriesgo'].map(r => {
                        const isChecked = selectedRamos.includes(r);
                        return (
                          <div 
                            key={r} 
                            className="dropdown-item" 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              padding: '8px 12px', 
                              cursor: 'pointer' 
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRamos(prev => 
                                prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
                              );
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              readOnly 
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{r}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Actualizar Datos del Prospecto
                  </button>
                </div>
              </form>

              {/* Right side: Follow-up History & Add note Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. History of notes */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} style={{ color: '#2563EB' }} />
                    Historial de Seguimiento
                  </h4>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '12px' }}>
                    {!editingLead.historial || editingLead.historial.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                        No hay comentarios de seguimiento registrados aún.
                      </div>
                    ) : (
                      <div className="timeline" style={{ paddingLeft: '10px' }}>
                        {editingLead.historial.map((log, index) => (
                          <div key={index} className="timeline-item" style={{ paddingBottom: '12px' }}>
                            <div className="timeline-item-indicator" style={{ top: '4px' }} />
                            <div className="timeline-item-content" style={{ marginLeft: '16px' }}>
                              <div className="timeline-item-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ fontWeight: 600, color: '#2563EB' }}>{log.accion}</span>
                                <span style={{ color: '#94A3B8' }}>{log.fecha}</span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#334155' }}>{log.nota}</p>
                              {log.fecha_seguimiento && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#D97706', fontWeight: 500, marginTop: '4px' }}>
                                  <Calendar size={10} />
                                  Próximo contacto: {log.fecha_seguimiento}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Add note form */}
                <form onSubmit={handleAddLeadNote} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: 0 }}>Agregar Nota de Seguimiento</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Acción</label>
                      <select 
                        className="form-input" 
                        style={{ padding: '6px 10px', fontSize: '12.5px' }}
                        value={noteAction} 
                        onChange={(e) => setNoteAction(e.target.value)}
                      >
                        <option value="Llamada Telefónica">Llamada Telefónica</option>
                        <option value="Envío de Correo">Envío de Correo</option>
                        <option value="WhatsApp Enviado">WhatsApp Enviado</option>
                        <option value="Visita Comercial">Visita Comercial</option>
                        <option value="Nota Interna">Nota Interna</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Fecha de Seguimiento (Opcional)</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        style={{ padding: '6px 10px', fontSize: '12.5px' }}
                        value={fechaSeguimiento}
                        onChange={(e) => setFechaSeguimiento(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Comentario de Gestión *</label>
                    <textarea 
                      placeholder="Ingrese los comentarios del seguimiento..." 
                      className="form-input" 
                      style={{ padding: '6px 10px', fontSize: '12.5px', height: '50px', resize: 'none' }}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary btn-sm">Registrar Nota</button>
                  </div>
                </form>

              </div>

            </div>
            
            <div className="modal-footer" style={{ flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setEditModalOpen(false); setEditingLead(null); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
