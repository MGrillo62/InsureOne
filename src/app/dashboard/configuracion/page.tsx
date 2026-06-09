'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Building2, 
  Globe, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  Edit2, 
  RefreshCw,
  Info,
  CreditCard
} from 'lucide-react';

interface Tenant {
  id: string;
  nombre: string;
  ruc: string;
  razon_social: string;
  estado: 'Activo' | 'Suspendido' | 'Eliminado';
  suscripcion_tipo: 'Mensual' | 'Anual';
  fecha_inicio: string;
  fecha_fin: string;
  logo_url?: string;
  admin_email?: string;
  admin_password?: string;
  suscripcion_monto?: number;
  ultima_conexion?: string;
}

export default function ConfiguracionPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Global Config states
  const [activeMainTab, setActiveMainTab] = useState<'tenants' | 'global'>('tenants');
  const [globalLogoUrl, setGlobalLogoUrl] = useState('');
  const [planMensualNombre, setPlanMensualNombre] = useState('Plan Mensual');
  const [planMensualPrecio, setPlanMensualPrecio] = useState<number>(150);
  const [planAnualNombre, setPlanAnualNombre] = useState('Plan Anual');
  const [planAnualPrecio, setPlanAnualPrecio] = useState<number>(1620);
  const [moneda, setMoneda] = useState('S/.');
  const [terminosUrl, setTerminosUrl] = useState('');
  const [politicaCambiosUrl, setPoliticaCambiosUrl] = useState('');
  const [condicionesUrl, setCondicionesUrl] = useState('');
  const [culquiPublicKey, setCulquiPublicKey] = useState('');
  const [culquiPrivateKey, setCulquiPrivateKey] = useState('');
  const [savingGlobalConfig, setSavingGlobalConfig] = useState(false);

  // Modal and Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'datos' | 'pagos'>('datos');

  // Form Fields
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [estado, setEstado] = useState<'Activo' | 'Suspendido' | 'Eliminado'>('Activo');
  const [suscripcionTipo, setSuscripcionTipo] = useState<'Mensual' | 'Anual'>('Anual');
  const [suscripcionMonto, setSuscripcionMonto] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Admin Credentials Fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Subscription Payments States
  const [pagos, setPagos] = useState<any[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoFecha, setPagoFecha] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('Tarjeta de Crédito');
  const [pagoEstado, setPagoEstado] = useState<'Pagado' | 'Pendiente' | 'Fallido'>('Pagado');
  const [pagoComprobante, setPagoComprobante] = useState('');
  const [showRegPagoForm, setShowRegPagoForm] = useState(false);

  const fetchGlobalConfig = async () => {
    try {
      const res = await fetch('/api/global-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setGlobalLogoUrl(data.config.logo_url || '');
          setPlanMensualNombre(data.config.plan_mensual_nombre || 'Plan Mensual');
          setPlanMensualPrecio(data.config.plan_mensual_precio || 150);
          setPlanAnualNombre(data.config.plan_anual_nombre || 'Plan Anual');
          setPlanAnualPrecio(data.config.plan_anual_precio || 1620);
          setMoneda(data.config.moneda || 'S/.');
          setTerminosUrl(data.config.terminos_url || '');
          setPoliticaCambiosUrl(data.config.politica_cambios_url || '');
          setCondicionesUrl(data.config.condiciones_url || '');
          setCulquiPublicKey(data.config.culqui_public_key || '');
          setCulquiPrivateKey(data.config.culqui_private_key || '');
        }
      }
    } catch (err) {
      console.error('Error fetching global config:', err);
    }
  };

  const handleSaveGlobalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobalConfig(true);
    try {
      const res = await fetch('/api/global-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            logo_url: globalLogoUrl,
            plan_mensual_nombre: planMensualNombre,
            plan_mensual_precio: Number(planMensualPrecio),
            plan_anual_nombre: planAnualNombre,
            plan_anual_precio: Number(planAnualPrecio),
            moneda,
            terminos_url: terminosUrl,
            politica_cambios_url: politicaCambiosUrl,
            condiciones_url: condicionesUrl,
            culqui_public_key: culquiPublicKey,
            culqui_private_key: culquiPrivateKey
          }
        })
      });
      if (res.ok) {
        alert('Configuración global guardada con éxito.');
        fetchGlobalConfig();
      } else {
        const data = await res.json();
        alert(`Error al guardar: ${data.error || 'No se pudo guardar la configuración global'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error en la conexión con el servidor.');
    } finally {
      setSavingGlobalConfig(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      const userRes = await fetch('/api/auth');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        if (userData?.rol === 'Superadmin') {
          fetchGlobalConfig();
        }
      }

      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setActiveTenantId(data.activeTenantId || '');
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPagos = async (tenantId: string) => {
    try {
      setLoadingPagos(true);
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getPagos',
          id: tenantId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPagos(data.pagos || []);
      }
    } catch (err) {
      console.error('Error fetching pagos:', err);
    } finally {
      setLoadingPagos(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDateToInput = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
  };

  const handleEdit = (t: Tenant) => {
    try {
      setEditingTenantId(t.id);
      setNombre(t.nombre || '');
      setRazonSocial(t.razon_social || '');
      setRuc(t.ruc || '');
      setEstado(t.estado || 'Activo');
      setSuscripcionTipo(t.suscripcion_tipo || 'Anual');
      setSuscripcionMonto(typeof t.suscripcion_monto === 'number' ? t.suscripcion_monto : parseFloat(t.suscripcion_monto as any) || 0);
      setFechaInicio(formatDateToInput(t.fecha_inicio || ''));
      setFechaFin(formatDateToInput(t.fecha_fin || ''));
      setLogoUrl(t.logo_url || '');
      setAdminEmail(t.admin_email || '');
      setAdminPassword(t.admin_password || '');
      setModalTab('datos');
      setModalOpen(true);
    } catch (err) {
      console.error('Error handling edit:', err);
      alert('Error al abrir la edición de inquilino.');
    }
  };

  const handleCreateNew = () => {
    setEditingTenantId(null);
    setNombre('');
    setRazonSocial('');
    setRuc('');
    setEstado('Activo');
    setSuscripcionTipo('Anual');
    setSuscripcionMonto(1620); // Default annual subscription in Soles
    setAdminEmail('');
    setAdminPassword('');
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const end = nextYear.toISOString().split('T')[0];
    
    setFechaInicio(today);
    setFechaFin(end);
    setLogoUrl('');
    setModalTab('datos');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTenantId(null);
    setModalTab('datos');
    setPagos([]);
    setPagoMonto('');
    setPagoFecha('');
    setPagoComprobante('');
    setSuscripcionMonto(0);
    setShowRegPagoForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !ruc || !razonSocial || !fechaInicio || !fechaFin) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    if (ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      alert('El RUC debe constar de exactamente 11 dígitos numéricos.');
      return;
    }

    if (new Date(fechaFin) < new Date(fechaInicio)) {
      alert('La fecha de término de la suscripción no puede ser anterior a la de inicio.');
      return;
    }

    try {
      const payload = {
        action: editingTenantId ? 'update' : 'create',
        id: editingTenantId || undefined,
        tenant: {
          nombre,
          razon_social: razonSocial,
          ruc,
          estado,
          suscripcion_tipo: suscripcionTipo,
          suscripcion_monto: Number(suscripcionMonto),
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          logo_url: logoUrl,
          admin_email: adminEmail,
          admin_password: adminPassword
        }
      };

      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchTenants();
        handleCloseModal();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'No se pudo guardar el tenant'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error en la conexión con el servidor.');
    }
  };

  const handleRegisterPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenantId || !pagoMonto || !pagoFecha) {
      alert('Por favor complete todos los campos obligatorios del pago.');
      return;
    }
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createPago',
          id: editingTenantId,
          pago: {
            monto: Number(pagoMonto),
            fecha_pago: pagoFecha,
            metodo_pago: pagoMetodo,
            estado: pagoEstado,
            comprobante_nro: pagoComprobante
          }
        })
      });
      if (res.ok) {
        fetchPagos(editingTenantId);
        // Reset form
        setPagoMonto('');
        setPagoFecha('');
        setPagoComprobante('');
        setShowRegPagoForm(false);
      } else {
        const data = await res.json();
        alert(`Error al registrar pago: ${data.error || 'No se pudo guardar el pago'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error en la conexión con el servidor.');
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ruc.includes(searchTerm)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '15px' }}>
        <RefreshCw size={36} className="animate-blink-update" style={{ color: '#2563EB' }} />
        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>Cargando configuración de Tenants...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: '#2563EB' }} />
            {user?.rol === 'Superadmin' 
              ? (activeMainTab === 'global' ? 'Configuración Global de la Plataforma' : 'Configuración de Tenants (Superadmin)') 
              : 'Configuración de Inquilino'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            {user?.rol === 'Superadmin' 
              ? (activeMainTab === 'global' 
                  ? 'Gestiona la configuración general de BrokerSync: marca, planes, enlaces legales y pasarela de pago Culqui.'
                  : 'Audita, edita y registra las cuentas de los corredores de seguros autorizados para utilizar la plataforma.') 
              : 'Visualiza la información comercial y de suscripción de tu cuenta.'}
          </p>
        </div>
        {user?.rol === 'Superadmin' && activeMainTab === 'tenants' && (
          <button className="btn btn-primary" onClick={handleCreateNew}>
            <Plus size={16} />
            Registrar nuevo Tenant
          </button>
        )}
      </div>

      {/* Superadmin Main Tabs Navigation */}
      {user?.rol === 'Superadmin' && (
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '25px', gap: '10px' }}>
          <button 
            type="button"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeMainTab === 'tenants' ? '#2563EB' : '#64748B',
              borderBottom: activeMainTab === 'tenants' ? '2px solid #2563EB' : '2px solid transparent',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onClick={() => setActiveMainTab('tenants')}
          >
            Gestión de Inquilinos (Tenants)
          </button>
          <button 
            type="button"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeMainTab === 'global' ? '#2563EB' : '#64748B',
              borderBottom: activeMainTab === 'global' ? '2px solid #2563EB' : '2px solid transparent',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onClick={() => {
              setActiveMainTab('global');
              fetchGlobalConfig();
            }}
          >
            Configuración Global
          </button>
        </div>
      )}

      {activeMainTab === 'tenants' ? (
        <>
          {/* Superadmin Alert */}
          {user?.rol === 'Superadmin' && (
            <div className="premium-card" style={{ display: 'flex', gap: '15px', padding: '16px 24px', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1E40AF', alignItems: 'flex-start', marginBottom: '25px' }}>
              <div style={{ padding: '6px', borderRadius: '50%', backgroundColor: '#DBEAFE', color: '#2563EB', flexShrink: 0 }}>
                <Info size={18} />
              </div>
              <div>
                <span style={{ fontWeight: 700, display: 'block', fontSize: '14px' }}>Panel de Control de Inquilinos</span>
                <p style={{ fontSize: '13px', marginTop: '2px', color: '#1E3A8A' }}>
                  Como Superusuario de BrokerSync, puedes suspender o desactivar accesos a las agencias. Los cambios en el estado del Tenant afectarán los logins de sus analistas de forma inmediata.
                </p>
              </div>
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="premium-card" style={{ padding: '15px 20px', marginBottom: '25px' }}>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" style={{ top: '12px' }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre de tenant, Razón Social o RUC..." 
                className="form-input search-input" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tenants Grid/Table */}
          <div className="premium-card">
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Nombre Comercial</th>
                    <th>Razón Social</th>
                    <th>RUC</th>
                    <th>Tipo Suscripción</th>
                    <th>Vigencia (Inicio - Fin)</th>
                    <th>Último Acceso</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                        No se encontraron tenants que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => {
                      const isActiveTenant = t.id === activeTenantId;
                      return (
                        <tr key={t.id} style={{ backgroundColor: isActiveTenant ? 'rgba(37, 99, 235, 0.03)' : undefined }}>
                          <td>
                            {t.logo_url ? (
                              <img 
                                src={t.logo_url} 
                                alt={`Logo ${t.nombre}`} 
                                style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #E2E8F0' }} 
                              />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid #E2E8F0' }}>
                                {t.nombre.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: '#0F172A' }}>{t.nombre}</span>
                              <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 500 }}>ID: {t.id} {isActiveTenant && '(Activo en sesión)'}</span>
                            </div>
                          </td>
                          <td>{t.razon_social || '-'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12.5px' }}>{t.ruc || '-'}</td>
                          <td>
                            <span className="badge badge-secondary">{t.suscripcion_tipo}</span>
                          </td>
                          <td style={{ fontSize: '12.5px', color: '#475569' }}>
                            <div>{formatDateToLocal(t.fecha_inicio)}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>hasta {formatDateToLocal(t.fecha_fin)}</div>
                          </td>
                          <td style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500 }}>
                            {t.ultima_conexion || 'Nunca'}
                          </td>
                          <td>
                            <span className={`badge ${
                              t.estado === 'Activo' ? 'badge-success' :
                              t.estado === 'Suspendido' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {t.estado.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleEdit(t)}
                            >
                              <Edit2 size={12} />
                              {user?.rol === 'Superadmin' ? 'Editar' : 'Ver Detalles'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Global Config UI */
        <form onSubmit={handleSaveGlobalConfig} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
          {/* Logo brand and metadata card */}
          <div className="premium-card" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} style={{ color: '#2563EB' }} />
                Identidad de Marca y Logo Global
              </h3>
              <div className="form-group">
                <label className="form-label">URL del Logo de la Plataforma</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://ejemplo.com/logo.png" 
                  value={globalLogoUrl} 
                  onChange={(e) => setGlobalLogoUrl(e.target.value)} 
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Este logo aparecerá en la pantalla de inicio de sesión y registro de BrokerSync.
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0', minHeight: '130px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '10px' }}>VISTA PREVIA DEL LOGO</span>
              {globalLogoUrl ? (
                <img 
                  src={globalLogoUrl} 
                  alt="Preview Logo" 
                  style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as any).src = 'https://placehold.co/200x60/f1f5f9/64748b?text=Error+en+Imagen';
                  }}
                />
              ) : (
                <span style={{ color: '#94A3B8', fontSize: '13px', fontStyle: 'italic' }}>Sin logo configurado</span>
              )}
            </div>
          </div>

          {/* Membership pricing card */}
          <div className="premium-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: '#2563EB' }} />
              Planes de Suscripción y Precios
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">Moneda de los Planes</label>
                <select 
                  className="form-input" 
                  value={moneda} 
                  onChange={(e) => setMoneda(e.target.value)}
                >
                  <option value="S/.">Soles (S/.)</option>
                  <option value="USD">Dólares (USD)</option>
                  <option value="PEN">PEN (Soles estándar)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Plan Mensual */}
              <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '15px' }}>Configuración Plan Mensual</h4>
                <div className="form-group">
                  <label className="form-label">Nombre del Plan</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Plan Mensual" 
                    value={planMensualNombre} 
                    onChange={(e) => setPlanMensualNombre(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Precio del Plan</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>{moneda}</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      placeholder="150.00" 
                      value={planMensualPrecio} 
                      onChange={(e) => setPlanMensualPrecio(parseFloat(e.target.value) || 0)} 
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Plan Anual */}
              <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '15px' }}>Configuración Plan Anual</h4>
                <div className="form-group">
                  <label className="form-label">Nombre del Plan</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Plan Anual" 
                    value={planAnualNombre} 
                    onChange={(e) => setPlanAnualNombre(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Precio del Plan</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>{moneda}</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      placeholder="1620.00" 
                      value={planAnualPrecio} 
                      onChange={(e) => setPlanAnualPrecio(parseFloat(e.target.value) || 0)} 
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal documents card */}
          <div className="premium-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} style={{ color: '#2563EB' }} />
              Enlaces de Documentos Legales y Políticas
            </h3>
            <div className="form-group">
              <label className="form-label">URL de Términos y Condiciones</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://cloudinary.com/terminos.pdf" 
                value={terminosUrl} 
                onChange={(e) => setTerminosUrl(e.target.value)} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL de Política de Cambios y Devoluciones</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://cloudinary.com/politica-cambios.pdf" 
                value={politicaCambiosUrl} 
                onChange={(e) => setPoliticaCambiosUrl(e.target.value)} 
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">URL de Condiciones Generales</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://cloudinary.com/condiciones.pdf" 
                value={condicionesUrl} 
                onChange={(e) => setCondicionesUrl(e.target.value)} 
                required
              />
            </div>
          </div>

          {/* Culqui configuration card */}
          <div className="premium-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: '#2563EB' }} />
              Credenciales de la Pasarela Culqui (Integración Oficial)
            </h3>
            <div style={{ padding: '12px 16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', color: '#1E40AF', fontSize: '13px', marginBottom: '20px' }}>
              <strong>Nota:</strong> Estas credenciales se utilizan para tokenizar y procesar los cargos de las membresías de los inquilinos. El modo de operación configurado en producción procesará transacciones reales en Soles.
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Llave Pública (Public Key)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="pk_live_..." 
                  value={culquiPublicKey} 
                  onChange={(e) => setCulquiPublicKey(e.target.value)} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Llave Privada / Secreta (Private Key)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="sk_live_..." 
                  value={culquiPrivateKey} 
                  onChange={(e) => setCulquiPrivateKey(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-glow"
              disabled={savingGlobalConfig}
              style={{ padding: '12px 30px', fontWeight: 'bold' }}
            >
              {savingGlobalConfig ? 'Guardando configuración...' : 'Guardar Configuración Global'}
            </button>
          </div>
        </form>
      )}

      {/* CREATE / EDIT TENANT MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h3 className="modal-title">{editingTenantId ? (user?.rol === 'Superadmin' ? 'Editar Configuración de Inquilino' : 'Configuración de Inquilino') : 'Registrar Nuevo Inquilino'}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            
            {/* Modal Tabs Selection */}
            {editingTenantId && (
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px', backgroundColor: '#F8FAFC', flexShrink: 0 }}>
                <button 
                  type="button"
                  style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: modalTab === 'datos' ? '#2563EB' : '#64748B',
                    borderBottom: modalTab === 'datos' ? '2px solid #2563EB' : '2px solid transparent',
                    background: 'transparent',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setModalTab('datos')}
                >
                  Datos Generales y Accesos
                </button>
                <button 
                  type="button"
                  style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: modalTab === 'pagos' ? '#2563EB' : '#64748B',
                    borderBottom: modalTab === 'pagos' ? '2px solid #2563EB' : '2px solid transparent',
                    background: 'transparent',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setModalTab('pagos');
                    fetchPagos(editingTenantId);
                  }}
                >
                  Historial de Pagos de Suscripción
                </button>
              </div>
            )}

            {modalTab === 'datos' ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', overflowY: 'auto', flex: 1 }}>
                  
                  {/* Form fields */}
                  <div>
                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Nombre Comercial *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. Rimac Corredores" 
                          value={nombre} 
                          onChange={(e) => setNombre(e.target.value)} 
                          required 
                          disabled={user?.rol !== 'Superadmin'}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Razón Social *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. Rímac Corredores de Seguros S.A." 
                          value={razonSocial} 
                          onChange={(e) => setRazonSocial(e.target.value)} 
                          required 
                          disabled={user?.rol !== 'Superadmin'}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">RUC (11 dígitos) *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. 20601234567" 
                          maxLength={11}
                          value={ruc} 
                          onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))} 
                          required 
                          disabled={user?.rol !== 'Superadmin'}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Logo URL</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="https://ejemplo.com/logo.png" 
                          value={logoUrl} 
                          onChange={(e) => setLogoUrl(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="grid-cols-3">
                      <div className="form-group">
                        <label className="form-label">Estado del Inquilino *</label>
                        <select 
                          className="form-input" 
                          value={estado} 
                          onChange={(e: any) => setEstado(e.target.value)}
                          disabled={user?.rol !== 'Superadmin'}
                        >
                          <option value="Activo">Activo (Acceso completo)</option>
                          <option value="Suspendido">Suspendido (Modo lectura/bloqueado)</option>
                          <option value="Eliminado">Eliminado (Sin acceso)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tipo de Suscripción *</label>
                        <select 
                          className="form-input" 
                          value={suscripcionTipo} 
                          onChange={(e: any) => {
                            const val = e.target.value;
                            setSuscripcionTipo(val);
                            if (!editingTenantId) {
                              setSuscripcionMonto(val === 'Anual' ? 1620 : 150);
                            }
                          }}
                          disabled={user?.rol !== 'Superadmin'}
                        >
                          <option value="Mensual">Mensual (Facturación recurrente)</option>
                          <option value="Anual">Anual (Facturación anualizada)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Monto de suscripción (inc IGV):</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-input" 
                          placeholder="0.00"
                          value={suscripcionMonto} 
                          onChange={(e) => setSuscripcionMonto(parseFloat(e.target.value) || 0)}
                          disabled={user?.rol !== 'Superadmin'}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Fecha de Inicio de Suscripción *</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={fechaInicio} 
                          onChange={(e) => setFechaInicio(e.target.value)} 
                          required 
                          disabled={user?.rol !== 'Superadmin'}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha de Fin de Suscripción *</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          min={fechaInicio}
                          value={fechaFin} 
                          onChange={(e) => setFechaFin(e.target.value)} 
                          required 
                          disabled={user?.rol !== 'Superadmin'}
                        />
                      </div>
                    </div>

                    {/* Admin Access Credentials Section */}
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '15px', marginTop: '15px' }}>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: '#1E293B', marginBottom: '10px' }}>Credenciales de Acceso Administrador (User-ID)</h4>
                      <div className="grid-cols-2">
                        <div className="form-group">
                          <label className="form-label">Email del Administrador (User-ID)</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="admin@corredor.com" 
                            value={adminEmail} 
                            onChange={(e) => setAdminEmail(e.target.value)} 
                            disabled={user?.rol !== 'Superadmin'}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contraseña de Acceso</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Contraseña" 
                            value={adminPassword} 
                            onChange={(e) => setAdminPassword(e.target.value)} 
                            disabled={user?.rol !== 'Superadmin'}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Info and Preview card */}
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h4 style={{ fontSize: '14px', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} style={{ color: '#2563EB' }} />
                      Vista Previa de Marca Corporativa
                    </h4>

                    {/* Mock Branding Preview Card */}
                    <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Preview Logo" 
                          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #E2E8F0', padding: '2px' }}
                          onError={(e) => {
                            (e.target as any).src = 'https://placehold.co/80x80/f1f5f9/64748b?text=BrokerSync';
                          }}
                        />
                      ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', border: '2px solid #E2E8F0' }}>
                          {nombre ? nombre.substring(0, 2).toUpperCase() : 'IO'}
                        </div>
                      )}

                      <div>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', display: 'block' }}>
                          {nombre || 'Nombre del Tenant'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                          RUC: {ruc || '-----------------'}
                        </span>
                      </div>

                      <div style={{ width: '100%', borderTop: '1px dashed #E2E8F0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#64748B' }}>Suscripción:</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{suscripcionTipo}</span>
                      </div>

                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#64748B' }}>Monto suscripción:</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>S/. {Number(suscripcionMonto || 0).toFixed(2)} (inc. IGV)</span>
                      </div>

                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#64748B' }}>Vence el:</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{fechaFin ? formatDateToLocal(fechaFin) : '--/--/----'}</span>
                      </div>
                    </div>

                    {/* Warning label */}
                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: 'auto' }}>
                      <AlertTriangle size={16} style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: '#92400E', lineHeight: '1.4' }}>
                        <strong>Advertencia de Seguridad:</strong> Al suspender a un Tenant, los usuarios afiliados ya no podrán facturar ni modificar pólizas, solo podrán realizar lecturas.
                      </span>
                    </div>
                  </div>

                </div>
                <div className="modal-footer" style={{ flexShrink: 0 }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">
                    {editingTenantId ? 'Guardar Cambios' : 'Crear Cuenta Tenant'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Historial de Pagos de Suscripción</h4>
                  {user?.rol === 'Superadmin' && !showRegPagoForm && (
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setPagoMonto('');
                        setPagoFecha(new Date().toISOString().split('T')[0]);
                        setPagoComprobante('');
                        setShowRegPagoForm(true);
                      }}
                    >
                      + Registrar Pago
                    </button>
                  )}
                </div>

                {showRegPagoForm && (
                  <form onSubmit={handleRegisterPago} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>Registrar Nuevo Pago de Suscripción</h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Monto (S/.) *</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          placeholder="150.00" 
                          value={pagoMonto}
                          onChange={(e) => setPagoMonto(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Fecha de Pago *</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          value={pagoFecha}
                          onChange={(e) => setPagoFecha(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Método de Pago</label>
                        <select 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          value={pagoMetodo}
                          onChange={(e) => setPagoMetodo(e.target.value)}
                        >
                          <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                          <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                          <option value="Paypal">Paypal</option>
                          <option value="Efectivo">Efectivo</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Nro Comprobante / Factura</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          placeholder="Ej. FACT-006" 
                          value={pagoComprobante}
                          onChange={(e) => setPagoComprobante(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Estado del Pago</label>
                        <select 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '12.5px' }}
                          value={pagoEstado}
                          onChange={(e: any) => setPagoEstado(e.target.value)}
                        >
                          <option value="Pagado">Pagado</option>
                          <option value="Pendiente">Pendiente</option>
                          <option value="Fallido">Fallido</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRegPagoForm(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary btn-sm">Guardar Pago</button>
                    </div>
                  </form>
                )}

                {loadingPagos ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                    Cargando historial de pagos...
                  </div>
                ) : pagos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: '8px', color: '#94A3B8' }}>
                    No se han registrado pagos para este inquilino.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="premium-table" style={{ fontSize: '12.5px' }}>
                      <thead>
                        <tr>
                          <th>Nro Comprobante</th>
                          <th>Fecha Pago</th>
                          <th>Método</th>
                          <th>Monto</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagos.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.comprobante_nro || '-'}</td>
                            <td>{formatDateToLocal(p.fecha_pago)}</td>
                            <td>{p.metodo_pago}</td>
                            <td style={{ fontWeight: 700, color: '#0F172A' }}>
                              S/. {p.monto.toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge ${
                                p.estado === 'Pagado' ? 'badge-success' :
                                p.estado === 'Pendiente' ? 'badge-warning' : 'badge-danger'
                              }`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {p.estado.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '15px', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cerrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
