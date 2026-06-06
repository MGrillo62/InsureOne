'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Building2, 
  User, 
  Link2, 
  FileText, 
  History, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface Client {
  id: string;
  tipo: 'natural' | 'juridica';
  nombre: string;
  documento_tipo: 'DNI' | 'RUC' | 'CE';
  documento_numero: string;
  email: string;
  telefono: string;
  direccion: string;
  id_parent?: string;
  historial: Array<{
    fecha: string;
    accion: string;
    noteAction?: string; // fallback
    nota: string;
    usuario: string;
  }>;
}

export default function CRMClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'natural' | 'juridica'>('all');
  
  // Sort
  const [sortField, setSortField] = useState<keyof Client>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // New Client Form
  const [tipo, setTipo] = useState<'natural' | 'juridica'>('natural');
  const [nombre, setNombre] = useState('');
  const [documentoTipo, setDocumentoTipo] = useState<'DNI' | 'RUC' | 'CE'>('DNI');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [idParent, setIdParent] = useState('');

  // Interaction Note Form
  const [noteAction, setNoteAction] = useState('Llamada Telefónica');
  const [noteText, setNoteText] = useState('');
  const [fechaCumplimiento, setFechaCumplimiento] = useState('');

  const fetchClients = async (selectIdAfterFetch?: string) => {
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (selectIdAfterFetch) {
          const found = data.find((c: Client) => c.id === selectIdAfterFetch);
          if (found) setSelectedClient(found);
        } else if (selectedClient) {
          const updated = data.find((c: Client) => c.id === selectedClient.id);
          if (updated) setSelectedClient(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          tipo,
          nombre,
          documento_tipo: documentoTipo,
          documento_numero: documentoNumero,
          email,
          telefono,
          direccion,
          id_parent: idParent || undefined
        })
      });
      if (res.ok) {
        const result = await res.json();
        await fetchClients(result.client.id);
        setCreateModalOpen(false);
        // Reset form
        setNombre('');
        setDocumentoNumero('');
        setEmail('');
        setTelefono('');
        setDireccion('');
        setIdParent('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !noteText) return;
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addNote',
          id: selectedClient.id,
          noteAction,
          noteText,
          fecha_cumplimiento: fechaCumplimiento || undefined
        })
      });
      if (res.ok) {
        setNoteText('');
        setFechaCumplimiento('');
        fetchClients(selectedClient.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !idParent) return;
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: selectedClient.id,
          tipo: selectedClient.tipo,
          nombre: selectedClient.nombre,
          documento_tipo: selectedClient.documento_tipo,
          documento_numero: selectedClient.documento_numero,
          email: selectedClient.email,
          telefono: selectedClient.telefono,
          direccion: selectedClient.direccion,
          id_parent: idParent
        })
      });
      if (res.ok) {
        setLinkModalOpen(false);
        setIdParent('');
        fetchClients(selectedClient.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Sort
  const getFilteredClients = () => {
    return clients.filter(c => {
      const matchesSearch = 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento_numero.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' ? true : c.tipo === filterType;
      
      return matchesSearch && matchesType;
    });
  };

  const handleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortArrow = (field: keyof Client) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="sort-icon" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={13} className="sort-icon" style={{ color: '#2563EB' }} /> 
      : <ArrowDown size={13} className="sort-icon" style={{ color: '#2563EB' }} />;
  };

  const filteredClients = getFilteredClients().sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });

  // Relationships
  const getDependentsOrEmployees = () => {
    if (!selectedClient) return [];
    return clients.filter(c => c.id_parent === selectedClient.id);
  };

  const getParentClient = () => {
    if (!selectedClient || !selectedClient.id_parent) return null;
    return clients.find(c => c.id === selectedClient.id_parent) || null;
  };

  const relatedList = getDependentsOrEmployees();
  const parentClient = getParentClient();

  return (
    <div className="animate-fade-in">
      {/* Title bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} style={{ color: '#2563EB' }} />
            CRM y Cartera de Clientes
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Gestiona la ficha del asegurado, dependientes, vinculación corporativa e historial operativo.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          Nuevo Asegurado
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '25px', alignItems: 'start' }}>
        
        {/* LEFT PANE: CLIENT LIST */}
        <div className="premium-card">
          <div className="card-header" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px' }}>Listado de Asegurados</h2>
              <span className="badge badge-secondary">{filteredClients.length}</span>
            </div>
            
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" style={{ top: '10px' }} />
              <input 
                type="text" 
                placeholder="Buscar asegurado por nombre, doc o email..." 
                className="form-input search-input" 
                style={{ padding: '8px 12px 8px 36px', fontSize: '13px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                onClick={() => setFilterType('all')}
              >
                Todos
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'natural' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                onClick={() => setFilterType('natural')}
              >
                Personas
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'juridica' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                onClick={() => setFilterType('juridica')}
              >
                Empresas
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                No se encontraron asegurados.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div 
                    key={client.id}
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
                    onClick={() => setSelectedClient(client)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          backgroundColor: client.tipo === 'juridica' ? '#FEF3C7' : '#DBEAFE',
                          color: client.tipo === 'juridica' ? '#D97706' : '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {client.tipo === 'juridica' ? <Building2 size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{client.nombre}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                          {client.documento_tipo}: {client.documento_numero}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: isSelected ? 'var(--color-primary)' : '#94A3B8' }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: DETAIL VIEW */}
        <div>
          {selectedClient ? (
            <div className="premium-card animate-fade-in">
              <div className="card-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div 
                    style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '12px', 
                      backgroundColor: selectedClient.tipo === 'juridica' ? '#FEF3C7' : '#DBEAFE',
                      color: selectedClient.tipo === 'juridica' ? '#D97706' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {selectedClient.tipo === 'juridica' ? <Building2 size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{selectedClient.nombre}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className={`badge ${selectedClient.tipo === 'juridica' ? 'badge-warning' : 'badge-info'}`}>
                        {selectedClient.tipo === 'juridica' ? 'Empresa / Persona Jurídica' : 'Persona Natural'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        ID: {selectedClient.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ padding: '24px' }}>
                
                {/* 1. CONTACT INFO */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} style={{ color: '#2563EB' }} />
                    Información del Asegurado
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={16} style={{ color: '#94A3B8' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>DOCUMENTO DE IDENTIDAD</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedClient.documento_tipo}: {selectedClient.documento_numero}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Phone size={16} style={{ color: '#94A3B8' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>TELÉFONO DE CONTACTO</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedClient.telefono}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Mail size={16} style={{ color: '#94A3B8' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>CORREO ELECTRÓNICO</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedClient.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={16} style={{ color: '#94A3B8' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>DIRECCIÓN REGISTRADA</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedClient.direccion}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. RELATIONSHIPS */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Link2 size={16} style={{ color: '#2563EB' }} />
                      Relaciones y Dependencias
                    </h3>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '2px 8px', fontSize: '11px' }}
                      onClick={() => setLinkModalOpen(true)}
                    >
                      Vincular Familiar / Empresa
                    </button>
                  </div>

                  {parentClient && (
                    <div 
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => setSelectedClient(parentClient)}
                    >
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>VINCULADO A (TITULAR / EMPRESA):</span>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB', marginTop: '2px' }}>{parentClient.nombre}</div>
                      </div>
                      <span className="badge badge-info">{parentClient.tipo === 'juridica' ? 'Empresa' : 'Titular'}</span>
                    </div>
                  )}

                  {relatedList.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                      No cuenta con dependientes o empleados asociados.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                        {selectedClient.tipo === 'juridica' ? 'EMPLEADOS ASEGURADOS ASOCIADOS:' : 'FAMILIARES DEPENDIENTES REGISTRADOS:'}
                      </span>
                      {relatedList.map((rel) => (
                        <div 
                          key={rel.id} 
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F1F5F9', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={() => setSelectedClient(rel)}
                        >
                          <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#0F172A' }}>{rel.nombre}</div>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{rel.documento_numero}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. HISTORY TIMELINE */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} style={{ color: '#2563EB' }} />
                    Bitácora de Interacciones y Cambios
                  </h3>
                  
                  {/* Timeline Logs */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
                    <div className="timeline">
                      {selectedClient.historial.map((log: any, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-item-indicator" />
                          <div className="timeline-item-content">
                            <div className="timeline-item-header">
                              <span className="timeline-item-title" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                {log.accion || log.noteAction || 'Interacción'}
                              </span>
                              <span className="timeline-item-time">{log.fecha}</span>
                            </div>
                            <p className="timeline-item-desc">{log.nota}</p>
                            {log.fecha_cumplimiento && (
                              <div style={{ fontSize: '11px', color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                                Cumplimiento programado: {log.fecha_cumplimiento}
                              </div>
                            )}
                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', textAlign: 'right' }}>
                              Registrado por: {log.usuario}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add note Form */}
                  <form onSubmit={handleAddNote} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr 1.2fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '12.2px' }}>Acción</label>
                        <select className="form-input" style={{ padding: '6px 10px', fontSize: '12.5px' }} value={noteAction} onChange={(e) => setNoteAction(e.target.value)}>
                          <option value="Llamada Telefónica">Llamada Telefónica</option>
                          <option value="Envío de Correo">Envío de Correo</option>
                          <option value="WhatsApp Enviado">WhatsApp Enviado</option>
                          <option value="Visita Comercial">Visita Comercial</option>
                          <option value="Nota Interna">Nota Interna</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '12.2px' }}>Comentario de Gestión</label>
                        <input 
                          type="text" 
                          placeholder="Ingrese detalles..." 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '12.2px' }}>Cumplimiento (Opc.)</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          value={fechaCumplimiento}
                          onChange={(e) => setFechaCumplimiento(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary btn-sm">Registrar Nota</button>
                    </div>
                  </form>

                </div>

              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={32} />
              </div>
              <div className="empty-state-title">Ningún asegurado seleccionado</div>
              <p className="empty-state-desc">
                Selecciona un asegurado de la lista para ver su ficha completa, dependientes e historial operativo en tiempo real.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: CREATE CLIENT */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Asegurado</h3>
              <button className="modal-close-btn" onClick={() => setCreateModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="modal-body">
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Asegurado</label>
                    <select className="form-input" value={tipo} onChange={(e) => {
                      const val = e.target.value as 'natural' | 'juridica';
                      setTipo(val);
                      setDocumentoTipo(val === 'juridica' ? 'RUC' : 'DNI');
                    }}>
                      <option value="natural">Persona Natural (Individual)</option>
                      <option value="juridica">Persona Jurídica (Empresa)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo / Razón Social *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. Juan Perez Gomez o Constructora Alfa S.A.C." 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Tipo Documento</label>
                    <select className="form-input" value={documentoTipo} onChange={(e: any) => setDocumentoTipo(e.target.value)}>
                      <option value="DNI">DNI (Persona Natural)</option>
                      <option value="RUC">RUC (Empresa/Persona Jurídica)</option>
                      <option value="CE">CE (Carnet de Extranjería)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número de Documento *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. RUC de 11 dígitos o DNI de 8" 
                      value={documentoNumero} 
                      onChange={(e) => setDocumentoNumero(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Contacto *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Celular o teléfono fijo" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="ejemplo@correo.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vinculación Inicial a Titular / Empresa (Opcional)</label>
                    <select className="form-input" value={idParent} onChange={(e) => setIdParent(e.target.value)}>
                      <option value="">-- Sin Vincular --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.tipo === 'juridica' ? 'Empresa' : 'Persona'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección Completa *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Av. Larco 123, Miraflores, Lima" 
                    value={direccion} 
                    onChange={(e) => setDireccion(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Asegurado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LINK / ASSOCIATE CLIENT */}
      {linkModalOpen && selectedClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Vincular Asegurado</h3>
              <button className="modal-close-btn" onClick={() => setLinkModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleLinkClient}>
              <div className="modal-body">
                <p style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '15px' }}>
                  Vincula a <strong>{selectedClient.nombre}</strong> con una Empresa (si es empleado) o con un Titular familiar (si es dependiente).
                </p>
                <div className="form-group">
                  <label className="form-label">Asociar con:</label>
                  <select className="form-input" value={idParent} onChange={(e) => setIdParent(e.target.value)} required>
                    <option value="">-- Seleccionar Titular / Empresa --</option>
                    {clients
                      .filter(c => c.id !== selectedClient.id && c.id_parent !== selectedClient.id) // avoid cycles
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.tipo === 'juridica' ? 'Empresa' : 'Persona'})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setLinkModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Vinculación</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
