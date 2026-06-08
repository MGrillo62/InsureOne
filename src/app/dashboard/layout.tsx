'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Bell,
  LogOut,
  User,
  Key,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Coins
} from 'lucide-react';

interface Tenant {
  id: string;
  nombre: string;
}

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  avatar: string;
  id_tenant: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Form Fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Database States
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState('');
  const [updateFlash, setUpdateFlash] = useState(false);

  // Fetch initial profile and tenants
  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch('/api/auth');
        if (userRes.status === 401 || !userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        if (userData.error) {
          router.push('/login');
          return;
        }
        setUser(userData);
        setProfileName(userData.nombre);
        setProfileEmail(userData.email);

        const tenantsRes = await fetch('/api/tenants');
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData.tenants);
        setActiveTenantId(tenantsData.activeTenantId);
      } catch (err) {
        console.error('Error fetching layout data:', err);
        router.push('/login');
      }
    }
    fetchData();
  }, [router]);

  // Handle active tenant switch
  const handleTenantChange = async (tenantId: string) => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTenantId: tenantId }),
      });
      if (res.ok) {
        setActiveTenantId(tenantId);
        // Trigger a complete refresh to reload database queries for the new tenant
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Logout
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Submit Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          nombre: profileName,
          email: profileEmail
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setEditProfileOpen(false);
        // Flash indicator
        setUpdateFlash(true);
        setTimeout(() => setUpdateFlash(false), 1000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePassword',
          password: currentPassword,
          newPassword: newPassword
        })
      });
      if (res.ok) {
        setChangePasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        alert('Contraseña cambiada exitosamente.');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al cambiar la contraseña. Verifique sus datos.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al cambiar la contraseña.');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads / Prospectos', path: '/dashboard/leads', icon: UserPlus },
    { name: 'CRM', path: '/dashboard/clientes', icon: Users },
    { name: 'Pólizas', path: '/dashboard/polizas', icon: FileText },
    { name: 'Cobranzas', path: '/dashboard/finanzas', icon: DollarSign },
    { name: 'Comisiones', path: '/dashboard/comisiones', icon: Coins },
    { name: 'Seguimiento Siniestros', path: '/dashboard/siniestros', icon: AlertTriangle },
    { name: 'Configuración', path: '/dashboard/configuracion', icon: Shield }
  ];

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      
      {/* SIDEBAR */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="logo-container">
            {/* SVG custom representation of InsureONE logo based on the provided image */}
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <circle cx="50" cy="50" r="46" stroke="#00D2C4" strokeWidth="8" fill="transparent" />
              <path d="M50 20 C60 20, 70 30, 70 45 C70 65, 50 80, 50 80 C50 80, 30 65, 30 45 C30 30, 40 20, 50 20 Z" fill="#00D2C4" opacity="0.15" />
              <path d="M30 45 L50 25 L70 45 C70 65, 50 80, 50 80 Z" stroke="#00D2C4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M40 50 L47 57 L63 41" stroke="#00D2C4" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ display: sidebarCollapsed ? 'none' : 'block', marginLeft: '5px' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 700 }}>Broker</span>
              <span style={{ color: '#00D2C4', fontWeight: 500 }}>Sync</span>
            </span>
          </Link>
          <button 
            className="sidebar-toggle-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            if (item.path === '/dashboard/configuracion' && user?.rol !== 'Superadmin') {
              return null;
            }
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link href={item.path} className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
                  <Icon size={20} />
                  <span>{item.name}</span>
                  {sidebarCollapsed && <span className="tooltip">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User context info bottom of sidebar */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                {user?.avatar || 'SA'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}>{user?.nombre}</span>
                <span style={{ color: '#64748B', fontSize: '11px' }}>{user?.rol}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                {user?.avatar || 'SA'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="app-main">
        {/* TOPBAR */}
        <header className="app-topbar">
          <div className="topbar-left">
            {user?.rol === 'Superadmin' && (
              <div className={`tenant-selector-container ${updateFlash ? 'animate-blink-update' : ''}`}>
                <span>ACTUANDO COMO:</span>
                <select 
                  className="tenant-selector" 
                  value={activeTenantId} 
                  onChange={(e) => handleTenantChange(e.target.value)}
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
            {user?.rol !== 'Superadmin' && tenants.length > 0 && (
              <div className="tenant-selector-container">
                <span style={{ fontWeight: 600 }}>{tenants.find(t => t.id === activeTenantId)?.nombre}</span>
              </div>
            )}
          </div>

          <div className="topbar-right">
            {/* User Profile Trigger and Menu */}
            <div className="user-profile-dropdown">
              <button 
                className="user-avatar-trigger" 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="avatar-circle">
                  {user?.avatar || 'SA'}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user?.nombre}</span>
                  <span className="user-role">{user?.rol}</span>
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  {/* Backdrop click close */}
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 140 }} 
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <ul className="dropdown-menu">
                    <li className="dropdown-item" onClick={() => { setEditProfileOpen(true); setProfileDropdownOpen(false); }}>
                      <User size={16} />
                      Editar Perfil
                    </li>
                    <li className="dropdown-item" onClick={() => { setChangePasswordOpen(true); setProfileDropdownOpen(false); }}>
                      <Key size={16} />
                      Cambiar Contraseña
                    </li>
                    <div className="dropdown-divider" />
                    <li className="dropdown-item" style={{ color: '#EF4444' }} onClick={handleLogout}>
                      <LogOut size={16} />
                      Cerrar Sesión
                    </li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ROUTE VIEW CONTENT */}
        <main className="content-wrapper">
          {children}
        </main>
      </div>

      {/* MODAL: EDIT PROFILE */}
      {editProfileOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Editar Perfil</h3>
              <button className="modal-close-btn" onClick={() => setEditProfileOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol Operativo</label>
                  <input type="text" className="form-input" value={user?.rol} disabled />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditProfileOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {changePasswordOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Cambiar Contraseña</h3>
              <button className="modal-close-btn" onClick={() => setChangePasswordOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSavePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Contraseña Actual</label>
                  <div className="form-input-container">
                    <input 
                      type={showCurrentPassword ? 'text' : 'password'} 
                      className="form-input" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <div className="form-input-container">
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      className="form-input" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setChangePasswordOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Actualizar Contraseña</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
