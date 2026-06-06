import fs from 'fs';
import path from 'path';

// Define DB File Path inside the workspace
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Interface Types
export interface Tenant {
  id: string;
  nombre: string;
  ruc: string;
  razon_social: string;
  estado: 'Activo' | 'Suspendido' | 'Eliminado';
  suscripcion_tipo: 'Mensual' | 'Anual';
  fecha_inicio: string;
  fecha_fin: string;
  logo_url?: string;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'Superadmin' | 'Admin' | 'Analista';
  avatar: string;
  id_tenant: string;
}

export interface Client {
  id: string;
  id_tenant: string;
  tipo: 'natural' | 'juridica';
  nombre: string;
  documento_tipo: 'DNI' | 'RUC' | 'CE';
  documento_numero: string;
  email: string;
  telefono: string;
  direccion: string;
  id_parent?: string; // Links corporate client to employee or holder to dependent
  historial: Array<{
    fecha: string;
    accion: string;
    nota: string;
    usuario: string;
  }>;
}

export interface Policy {
  id: string;
  id_tenant: string;
  id_cliente: string;
  compania_aseguradora: string; // Pacifico, Rimac, Mapfre, La Positiva
  ramo: string; // Vehicular, EPS, SCTR, Vida, Multirriesgo
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

export interface PaymentSchedule {
  id: string;
  id_tenant: string;
  id_poliza: string;
  numero_cuota: number;
  monto_cuota_cliente: number;
  comision_cuota_broker: number;
  fecha_vencimiento: string;
  estado_pago: 'Pendiente' | 'Pagado' | 'Vencido';
  estado_comision: 'Pendiente' | 'Cobrado';
}

export interface Lead {
  id: string;
  id_tenant: string;
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

export interface Claim {
  id: string;
  id_tenant: string;
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
}

export interface DatabaseStructure {
  tenants: Tenant[];
  currentUser: User;
  activeTenantId: string;
  clientes: Client[];
  polizas: Policy[];
  cronograma: PaymentSchedule[];
  leads: Lead[];
  siniestros: Claim[];
}

// Initial Seed Data
const initialDB: DatabaseStructure = {
  tenants: [
    { 
      id: 'T-001', 
      nombre: 'Mazmorra Games',
      ruc: '20601234567',
      razon_social: 'Mazmorra Games S.A.C.',
      estado: 'Activo',
      suscripcion_tipo: 'Anual',
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-12-31',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60'
    },
    { 
      id: 'T-002', 
      nombre: 'Inversiones Rímac SAC',
      ruc: '20556789123',
      razon_social: 'Inversiones Rímac S.A.C.',
      estado: 'Activo',
      suscripcion_tipo: 'Mensual',
      fecha_inicio: '2026-02-15',
      fecha_fin: '2027-02-14',
      logo_url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=80&auto=format&fit=crop&q=60'
    },
    { 
      id: 'T-003', 
      nombre: 'Importaciones Chiclayo',
      ruc: '20448976512',
      razon_social: 'Importaciones Chiclayo E.I.R.L.',
      estado: 'Suspendido',
      suscripcion_tipo: 'Mensual',
      fecha_inicio: '2025-10-10',
      fecha_fin: '2026-04-09',
      logo_url: ''
    }
  ],
  currentUser: {
    id: 'USR-001',
    nombre: 'Super Admin',
    email: 'admin@insureone.com',
    rol: 'Superadmin',
    avatar: 'SA',
    id_tenant: 'T-001'
  },
  activeTenantId: 'T-001',
  clientes: [
    {
      id: 'CLI-001',
      id_tenant: 'T-001',
      tipo: 'natural',
      nombre: 'Juan Perez Gomez',
      documento_tipo: 'DNI',
      documento_numero: '45897612',
      email: 'juan.perez@gmail.com',
      telefono: '998877665',
      direccion: 'Av. Larco 456, Miraflores',
      historial: [
        { fecha: '2026-05-10', accion: 'Creación de Asegurado', nota: 'Se registra cliente natural para seguro vehicular.', usuario: 'Super Admin' }
      ]
    },
    {
      id: 'CLI-002',
      id_tenant: 'T-001',
      tipo: 'natural',
      nombre: 'María Perez Lopez',
      documento_tipo: 'DNI',
      documento_numero: '70251489',
      email: 'maria.perez@gmail.com',
      telefono: '987654321',
      direccion: 'Av. Larco 456, Miraflores',
      id_parent: 'CLI-001', // Dependent of Juan Perez
      historial: [
        { fecha: '2026-05-11', accion: 'Vinculación', nota: 'Se vincula como dependiente (Cónyuge) de Juan Perez.', usuario: 'Super Admin' }
      ]
    },
    {
      id: 'CLI-003',
      id_tenant: 'T-001',
      tipo: 'juridica',
      nombre: 'Constructora Alfa S.A.C.',
      documento_tipo: 'RUC',
      documento_numero: '20601234567',
      email: 'contacto@constructoraalfa.pe',
      telefono: '014455667',
      direccion: 'Av. Primavera 1230, Surco',
      historial: [
        { fecha: '2026-04-20', accion: 'Creación de Asegurado', nota: 'Cliente corporativo creado por recomendación de leads.', usuario: 'Super Admin' }
      ]
    },
    {
      id: 'CLI-004',
      id_tenant: 'T-001',
      tipo: 'natural',
      nombre: 'Carlos Mendoza Ruiz',
      documento_tipo: 'DNI',
      documento_numero: '10234567',
      email: 'carlos.mendoza@alfa.pe',
      telefono: '994433221',
      direccion: 'Calle Las Lomas 234, Surco',
      id_parent: 'CLI-003', // Employee of Constructora Alfa
      historial: [
        { fecha: '2026-04-25', accion: 'Vinculación de Empleado', nota: 'Asegurado titular bajo póliza de SCTR corporativa de Constructora Alfa.', usuario: 'Super Admin' }
      ]
    }
  ],
  polizas: [
    {
      id: 'POL-001',
      id_tenant: 'T-001',
      id_cliente: 'CLI-001',
      compania_aseguradora: 'Rimac',
      ramo: 'Vehicular',
      numero_poliza: 'V-908754-2026',
      suma_asegurada: 25000,
      deducibles: 'USD 150 todo riesgo, 10% de la pérdida',
      coberturas: 'Daño propio, Responsabilidad Civil USD 100,000, Robo total',
      prima_neta: 1000,
      gastos_emision: 30,
      igv: 185.4,
      prima_total: 1215.4,
      porcentaje_comision: 15,
      comision_total: 150,
      fecha_inicio: '2026-05-10',
      fecha_fin: '2027-05-09',
      estado: 'Vigente'
    },
    {
      id: 'POL-002',
      id_tenant: 'T-001',
      id_cliente: 'CLI-003',
      compania_aseguradora: 'Pacifico',
      ramo: 'EPS',
      numero_poliza: 'E-334455-2026',
      suma_asegurada: 100000,
      deducibles: 'Copago S/ 40 en clínicas afiliadas, 10% coaseguro',
      coberturas: 'Atención ambulatoria, hospitalaria, emergencias 100%, maternidad',
      prima_neta: 4000,
      gastos_emision: 120,
      igv: 741.6,
      prima_total: 4861.6,
      porcentaje_comision: 10,
      comision_total: 400,
      fecha_inicio: '2026-06-01',
      fecha_fin: '2027-05-31',
      estado: 'Vigente'
    },
    {
      id: 'POL-003',
      id_tenant: 'T-001',
      id_cliente: 'CLI-001',
      compania_aseguradora: 'Mapfre',
      ramo: 'Vida',
      numero_poliza: 'VI-887722-2025',
      suma_asegurada: 50000,
      deducibles: 'Sin deducible',
      coberturas: 'Fallecimiento natural o accidental, invalidez permanente',
      prima_neta: 300,
      gastos_emision: 9,
      igv: 55.62,
      prima_total: 364.62,
      porcentaje_comision: 20,
      comision_total: 60,
      fecha_inicio: '2025-06-20',
      fecha_fin: '2026-06-19', // Vence pronto! (en 14 días)
      estado: 'Por Vencer'
    }
  ],
  cronograma: [
    {
      id: 'PAY-001',
      id_tenant: 'T-001',
      id_poliza: 'POL-001',
      numero_cuota: 1,
      monto_cuota_cliente: 303.85,
      comision_cuota_broker: 37.5,
      fecha_vencimiento: '2026-06-09', // Vence pronto!
      estado_pago: 'Pendiente',
      estado_comision: 'Pendiente'
    },
    {
      id: 'PAY-002',
      id_tenant: 'T-001',
      id_poliza: 'POL-001',
      numero_cuota: 2,
      monto_cuota_cliente: 303.85,
      comision_cuota_broker: 37.5,
      fecha_vencimiento: '2026-07-09',
      estado_pago: 'Pendiente',
      estado_comision: 'Pendiente'
    },
    {
      id: 'PAY-003',
      id_tenant: 'T-001',
      id_poliza: 'POL-001',
      numero_cuota: 3,
      monto_cuota_cliente: 303.85,
      comision_cuota_broker: 37.5,
      fecha_vencimiento: '2026-08-09',
      estado_pago: 'Pendiente',
      estado_comision: 'Pendiente'
    },
    {
      id: 'PAY-004',
      id_tenant: 'T-001',
      id_poliza: 'POL-001',
      numero_cuota: 4,
      monto_cuota_cliente: 303.85,
      comision_cuota_broker: 37.5,
      fecha_vencimiento: '2026-09-09',
      estado_pago: 'Pendiente',
      estado_comision: 'Pendiente'
    },
    // Poliza 2 EPS - 2 Cuotas, la primera ya se pago
    {
      id: 'PAY-005',
      id_tenant: 'T-001',
      id_poliza: 'POL-002',
      numero_cuota: 1,
      monto_cuota_cliente: 2430.8,
      comision_cuota_broker: 200,
      fecha_vencimiento: '2026-06-01',
      estado_pago: 'Pagado',
      estado_comision: 'Cobrado'
    },
    {
      id: 'PAY-006',
      id_tenant: 'T-001',
      id_poliza: 'POL-002',
      numero_cuota: 2,
      monto_cuota_cliente: 2430.8,
      comision_cuota_broker: 200,
      fecha_vencimiento: '2026-07-01',
      estado_pago: 'Pendiente',
      estado_comision: 'Pendiente'
    },
    // Poliza 3 - Vida (1 Cuota única), venció pago
    {
      id: 'PAY-007',
      id_tenant: 'T-001',
      id_poliza: 'POL-003',
      numero_cuota: 1,
      monto_cuota_cliente: 364.62,
      comision_cuota_broker: 60,
      fecha_vencimiento: '2025-07-20', // Pasado
      estado_pago: 'Pagado',
      estado_comision: 'Cobrado'
    }
  ],
  leads: [
    {
      id: 'LD-001',
      id_tenant: 'T-001',
      nombre: 'Ricardo Samaniego',
      compania: 'Minera Los Andes',
      documento: '20608976541',
      email: 'rsamaniego@andes.pe',
      telefono: '992345678',
      direccion: 'Av. Javier Prado Este 2500, San Borja',
      giro: 'Minería',
      estado: 'nuevo',
      prima_proyectada: 12000,
      ramo: 'SCTR',
      fecha_creacion: '2026-06-01'
    },
    {
      id: 'LD-002',
      id_tenant: 'T-001',
      nombre: 'Ana Sofía Vergara',
      compania: 'Estudio Vergara & Abogados',
      documento: '20556789123',
      email: 'avergara@estudiovergara.pe',
      telefono: '988776655',
      direccion: 'Av. Camino Real 450, San Isidro',
      giro: 'Legal',
      estado: 'contactado',
      prima_proyectada: 5000,
      ramo: 'Multirriesgo',
      fecha_creacion: '2026-06-02'
    },
    {
      id: 'LD-003',
      id_tenant: 'T-001',
      nombre: 'Roberto Gutierrez',
      compania: 'Roberto Gutierrez SAC',
      documento: '20123456789',
      email: 'rgutierrez@gmail.com',
      telefono: '999888777',
      direccion: 'Av. Benavides 1430, Miraflores',
      giro: 'Comercio',
      estado: 'cotizando',
      prima_proyectada: 1500,
      ramo: 'Vehicular',
      fecha_creacion: '2026-06-03'
    }
  ],
  siniestros: [
    {
      id: 'SIN-001',
      id_tenant: 'T-001',
      id_poliza: 'POL-001',
      id_cliente: 'CLI-001',
      fecha_evento: '2026-05-28',
      tipo_siniestro: 'Choque Vehicular Leve',
      ajustador: 'Roberto Quiroz (Rimac)',
      estado: 'En Evaluacion',
      fecha_creacion: '2026-05-29',
      bitacora: [
        { fecha: '2026-05-29', motivo: 'Apertura de Siniestro', hora: '09:30 AM', proximo_control: '2026-06-05' },
        { fecha: '2026-06-02', motivo: 'Envío de cotización de taller', hora: '03:15 PM', proximo_control: '2026-06-09' }
      ]
    }
  ]
};

// Database Initialization helper
function initializeDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
  }
}

// Read DB Helper
export function readDB(): DatabaseStructure {
  initializeDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file, returning seed data.', error);
    return initialDB;
  }
}

// Write DB Helper
export function writeDB(db: DatabaseStructure) {
  initializeDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file.', error);
  }
}

// Tenancy contextual retrieval
export function getActiveTenantId(): string {
  const db = readDB();
  return db.activeTenantId;
}

export function setActiveTenantId(tenantId: string) {
  const db = readDB();
  db.activeTenantId = tenantId;
  writeDB(db);
}

export function getCurrentUser(): User {
  const db = readDB();
  return db.currentUser;
}

export function updateCurrentUser(user: Partial<User>) {
  const db = readDB();
  db.currentUser = { ...db.currentUser, ...user };
  writeDB(db);
}

// CRUD - Tenants
export function getTenants(): Tenant[] {
  const db = readDB();
  return db.tenants;
}

export function updateTenant(id: string, updatedFields: Partial<Omit<Tenant, 'id'>>): Tenant {
  const db = readDB();
  const index = db.tenants.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Tenant no encontrado');
  
  const updated = { ...db.tenants[index], ...updatedFields };
  db.tenants[index] = updated;
  writeDB(db);
  return updated;
}

export function createTenant(tenantData: Omit<Tenant, 'id'>): Tenant {
  const db = readDB();
  // Find highest index or calculate new one
  const ids = db.tenants.map(t => Number(t.id.split('-')[1]) || 0);
  const nextNum = Math.max(...ids, 0) + 1;
  const newId = `T-${String(nextNum).padStart(3, '0')}`;
  
  const newTenant: Tenant = {
    id: newId,
    ...tenantData
  };
  db.tenants.push(newTenant);
  writeDB(db);
  return newTenant;
}

// CRUD - Clients
export function getClients(): Client[] {
  const db = readDB();
  const tenantId = getActiveTenantId();
  // If Superadmin, we can list everything or just tenant
  // For standard multitenant operations we filter by activeTenantId
  return db.clientes.filter(c => c.id_tenant === tenantId);
}

export function getClientById(id: string): Client | undefined {
  const db = readDB();
  return db.clientes.find(c => c.id === id && c.id_tenant === getActiveTenantId());
}

export function createClient(client: Omit<Client, 'id' | 'id_tenant' | 'historial'>): Client {
  const db = readDB();
  const tenantId = getActiveTenantId();
  const newClient: Client = {
    ...client,
    id: `CLI-${String(db.clientes.length + 1).padStart(3, '0')}`,
    id_tenant: tenantId,
    historial: [
      {
        fecha: new Date().toISOString().split('T')[0],
        accion: 'Registro',
        nota: 'Se creó la ficha del asegurado.',
        usuario: db.currentUser.nombre
      }
    ]
  };
  db.clientes.push(newClient);
  writeDB(db);
  return newClient;
}

export function updateClient(id: string, updatedFields: Partial<Omit<Client, 'id' | 'id_tenant' | 'historial'>>): Client {
  const db = readDB();
  const index = db.clientes.findIndex(c => c.id === id && c.id_tenant === getActiveTenantId());
  if (index === -1) throw new Error('Cliente no encontrado');
  
  const original = db.clientes[index];
  const updatedClient: Client = {
    ...original,
    ...updatedFields,
    historial: [
      ...original.historial,
      {
        fecha: new Date().toISOString().split('T')[0],
        accion: 'Actualización',
        nota: `Campos modificados: ${Object.keys(updatedFields).join(', ')}`,
        usuario: db.currentUser.nombre
      }
    ]
  };
  db.clientes[index] = updatedClient;
  writeDB(db);
  return updatedClient;
}

export function addClientHistory(id: string, action: string, note: string) {
  const db = readDB();
  const index = db.clientes.findIndex(c => c.id === id && c.id_tenant === getActiveTenantId());
  if (index === -1) return;
  db.clientes[index].historial.push({
    fecha: new Date().toISOString().split('T')[0],
    accion: action,
    nota: note,
    usuario: db.currentUser.nombre
  });
  writeDB(db);
}

// CRUD - Policies
export function getPolicies(): Policy[] {
  const db = readDB();
  const tenantId = getActiveTenantId();
  return db.polizas.filter(p => p.id_tenant === tenantId);
}

export function getPolicyById(id: string): Policy | undefined {
  const db = readDB();
  return db.polizas.find(p => p.id === id && p.id_tenant === getActiveTenantId());
}

export function createPolicy(policy: Omit<Policy, 'id' | 'id_tenant'>, installments: number): { policy: Policy; schedule: PaymentSchedule[] } {
  const db = readDB();
  const tenantId = getActiveTenantId();
  const policyId = `POL-${String(db.polizas.length + 1).padStart(3, '0')}`;
  
  const newPolicy: Policy = {
    ...policy,
    id: policyId,
    id_tenant: tenantId
  };
  db.polizas.push(newPolicy);
  
  // Generate schedule automatically
  const schedule: PaymentSchedule[] = [];
  const cuotaCliente = Number((newPolicy.prima_total / installments).toFixed(2));
  const comisionBroker = Number((newPolicy.comision_total / installments).toFixed(2));
  const startDay = new Date(newPolicy.fecha_inicio);
  
  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(startDay);
    dueDate.setDate(dueDate.getDate() + (i - 1) * 30);
    
    // Check if the due date is in the past compared to system date (June 5, 2026) to set state
    const systemDate = new Date('2026-06-05');
    let estadoPago: 'Pendiente' | 'Pagado' | 'Vencido' = 'Pendiente';
    if (dueDate < systemDate) {
      estadoPago = 'Vencido'; // Standard default for unpaid past debts
    }

    const pay: PaymentSchedule = {
      id: `PAY-${String(db.cronograma.length + schedule.length + 1).padStart(3, '0')}`,
      id_tenant: tenantId,
      id_poliza: policyId,
      numero_cuota: i,
      monto_cuota_cliente: cuotaCliente,
      comision_cuota_broker: comisionBroker,
      fecha_vencimiento: dueDate.toISOString().split('T')[0],
      estado_pago: estadoPago,
      estado_comision: 'Pendiente'
    };
    schedule.push(pay);
  }
  
  db.cronograma.push(...schedule);
  writeDB(db);
  
  // Log inside client history
  addClientHistory(newPolicy.id_cliente, 'Póliza Registrada', `Se emitió la póliza ${newPolicy.numero_poliza} (${newPolicy.ramo}) con ${installments} cuotas.`);
  
  return { policy: newPolicy, schedule };
}

export function updatePolicy(id: string, updatedFields: Partial<Omit<Policy, 'id' | 'id_tenant'>>): Policy {
  const db = readDB();
  const index = db.polizas.findIndex(p => p.id === id && p.id_tenant === getActiveTenantId());
  if (index === -1) throw new Error('Póliza no encontrada');
  
  const updated = { ...db.polizas[index], ...updatedFields };
  db.polizas[index] = updated;
  writeDB(db);
  return updated;
}

// CRUD - Payment Schedules
export function getPaymentSchedules(): PaymentSchedule[] {
  const db = readDB();
  const tenantId = getActiveTenantId();
  return db.cronograma.filter(c => c.id_tenant === tenantId);
}

export function updatePaymentStatus(id: string, estado_pago?: 'Pendiente' | 'Pagado' | 'Vencido', estado_comision?: 'Pendiente' | 'Cobrado'): PaymentSchedule {
  const db = readDB();
  const index = db.cronograma.findIndex(c => c.id === id && c.id_tenant === getActiveTenantId());
  if (index === -1) throw new Error('Cuota no encontrada');
  
  if (estado_pago) {
    db.cronograma[index].estado_pago = estado_pago;
  }
  if (estado_comision) {
    db.cronograma[index].estado_comision = estado_comision;
  }
  writeDB(db);
  return db.cronograma[index];
}

// CRUD - Leads
export function getLeads(): Lead[] {
  const db = readDB();
  return db.leads.filter(l => l.id_tenant === getActiveTenantId());
}

export function createLead(lead: Omit<Lead, 'id' | 'id_tenant' | 'fecha_creacion'>): Lead {
  const db = readDB();
  const newLead: Lead = {
    ...lead,
    id: `LD-${String(db.leads.length + 1).padStart(3, '0')}`,
    id_tenant: getActiveTenantId(),
    fecha_creacion: new Date().toISOString().split('T')[0]
  };
  db.leads.push(newLead);
  writeDB(db);
  return newLead;
}

export function updateLeadStatus(id: string, estado: Lead['estado']): Lead {
  const db = readDB();
  const index = db.leads.findIndex(l => l.id === id && l.id_tenant === getActiveTenantId());
  if (index === -1) throw new Error('Lead no encontrado');
  db.leads[index].estado = estado;
  writeDB(db);
  return db.leads[index];
}

export function deleteLead(id: string) {
  const db = readDB();
  db.leads = db.leads.filter(l => !(l.id === id && l.id_tenant === getActiveTenantId()));
  writeDB(db);
}

// CRUD - Claims (Siniestros)
export function getClaims(): Claim[] {
  const db = readDB();
  return db.siniestros.filter(s => s.id_tenant === getActiveTenantId());
}

export function createClaim(claim: Omit<Claim, 'id' | 'id_tenant' | 'fecha_creacion' | 'bitacora'>): Claim {
  const db = readDB();
  const newClaim: Claim = {
    ...claim,
    id: `SIN-${String(db.siniestros.length + 1).padStart(3, '0')}`,
    id_tenant: getActiveTenantId(),
    fecha_creacion: new Date().toISOString().split('T')[0],
    bitacora: [
      {
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        motivo: 'Apertura de Siniestro',
        proximo_control: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      }
    ]
  };
  db.siniestros.push(newClaim);
  writeDB(db);
  
  // Log inside client history
  addClientHistory(newClaim.id_cliente, 'Siniestro Declarado', `Se reportó siniestro (${newClaim.tipo_siniestro}) para póliza ID: ${newClaim.id_poliza}`);
  
  return newClaim;
}

export function addClaimLog(claimId: string, motivo: string, proximo_control: string): Claim {
  const db = readDB();
  const index = db.siniestros.findIndex(s => s.id === claimId && s.id_tenant === getActiveTenantId());
  if (index === -1) throw new Error('Siniestro no encontrado');
  
  db.siniestros[index].bitacora.push({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    motivo,
    proximo_control
  });
  writeDB(db);
  return db.siniestros[index];
}

export function updateClaimStatus(claimId: string, estado: Claim['estado']): Claim {
  const db = readDB();
  const index = db.siniestros.findIndex(s => s.id === claimId && s.id_tenant === getActiveTenantId());
  if (index === -1) throw new Error('Siniestro no encontrado');
  
  db.siniestros[index].estado = estado;
  db.siniestros[index].bitacora.push({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    motivo: `Cambio de estado a: ${estado}`,
    proximo_control: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  writeDB(db);
  return db.siniestros[index];
}
