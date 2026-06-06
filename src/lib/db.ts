import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno (.env o .env.local)');
}
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

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
  admin_email?: string;
  admin_password?: string;
}

export interface TenantPago {
  id: string;
  id_tenant: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  estado: 'Pagado' | 'Pendiente' | 'Fallido';
  comprobante_nro: string;
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
  id_parent?: string;
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

// Memory State fallback variables for session multi-tenancy
let activeTenantId = 'T-001';
let currentUser: User = {
  id: 'USR-001',
  nombre: 'Super Admin',
  email: 'admin@insureone.com',
  rol: 'Superadmin',
  avatar: 'SA',
  id_tenant: 'T-001'
};

// Database Initialization helper
let databaseInitialized = false;

export async function initializeDatabase() {
  if (databaseInitialized) return;

  try {
    // 1. Create tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(10) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        ruc VARCHAR(11) NOT NULL,
        razon_social VARCHAR(150) NOT NULL,
        estado VARCHAR(20) NOT NULL,
        suscripcion_tipo VARCHAR(20) NOT NULL,
        fecha_inicio VARCHAR(10) NOT NULL,
        fecha_fin VARCHAR(10) NOT NULL,
        logo_url TEXT
      );
      
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_email VARCHAR(150);
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_password VARCHAR(100);
      
      CREATE TABLE IF NOT EXISTS tenant_pagos (
        id VARCHAR(10) PRIMARY KEY,
        id_tenant VARCHAR(10) NOT NULL,
        monto NUMERIC(12, 2) NOT NULL,
        fecha_pago VARCHAR(10) NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL,
        estado VARCHAR(20) NOT NULL,
        comprobante_nro VARCHAR(50) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS clientes (
        id VARCHAR(10) PRIMARY KEY,
        id_tenant VARCHAR(10) NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        documento_tipo VARCHAR(10) NOT NULL,
        documento_numero VARCHAR(20) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        direccion TEXT NOT NULL,
        id_parent VARCHAR(10),
        historial JSONB NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS polizas (
        id VARCHAR(10) PRIMARY KEY,
        id_tenant VARCHAR(10) NOT NULL,
        id_cliente VARCHAR(10) NOT NULL,
        compania_aseguradora VARCHAR(50) NOT NULL,
        ramo VARCHAR(50) NOT NULL,
        numero_poliza VARCHAR(50) NOT NULL,
        suma_asegurada NUMERIC(15, 2) NOT NULL,
        deducibles TEXT NOT NULL,
        coberturas TEXT NOT NULL,
        prima_neta NUMERIC(12, 2) NOT NULL,
        gastos_emision NUMERIC(12, 2) NOT NULL,
        igv NUMERIC(12, 2) NOT NULL,
        prima_total NUMERIC(12, 2) NOT NULL,
        porcentaje_comision NUMERIC(5, 2) NOT NULL,
        comision_total NUMERIC(12, 2) NOT NULL,
        fecha_inicio VARCHAR(10) NOT NULL,
        fecha_fin VARCHAR(10) NOT NULL,
        estado VARCHAR(20) NOT NULL,
        moneda VARCHAR(5) NOT NULL,
        periodicidad VARCHAR(20) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS cronograma (
        id VARCHAR(10) PRIMARY KEY,
        id_tenant VARCHAR(10) NOT NULL,
        id_poliza VARCHAR(10) NOT NULL,
        numero_cuota INT NOT NULL,
        monto_cuota_cliente NUMERIC(12, 2) NOT NULL,
        comision_cuota_broker NUMERIC(12, 2) NOT NULL,
        fecha_vencimiento VARCHAR(10) NOT NULL,
        estado_pago VARCHAR(20) NOT NULL,
        estado_comision VARCHAR(20) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(10) PRIMARY KEY,
        id_tenant VARCHAR(10) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        compania VARCHAR(150),
        documento VARCHAR(20) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telefono VARCHAR(20) NOT NULL,
        direccion TEXT NOT NULL,
        giro VARCHAR(100) NOT NULL,
        estado VARCHAR(20) NOT NULL,
        prima_proyectada NUMERIC(12, 2) NOT NULL,
        ramo VARCHAR(50) NOT NULL,
        fecha_creacion VARCHAR(10) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS siniestros (
        id VARCHAR(10) PRIMARY KEY,
        id_tenant VARCHAR(10) NOT NULL,
        id_poliza VARCHAR(10) NOT NULL,
        id_cliente VARCHAR(10) NOT NULL,
        fecha_evento VARCHAR(10) NOT NULL,
        tipo_siniestro VARCHAR(150) NOT NULL,
        ajustador VARCHAR(100),
        estado VARCHAR(30) NOT NULL,
        fecha_creacion VARCHAR(10) NOT NULL,
        bitacora JSONB NOT NULL
      );
    `);

    // 2. Check if seeding is needed
    const tenantsCheck = await pool.query('SELECT count(*) FROM tenants');
    const tenantCount = parseInt(tenantsCheck.rows[0].count);

    if (tenantCount === 0) {
      console.log('Neon database is empty. Migrating local JSON data seeds...');
      const dbPath = path.join(process.cwd(), 'data', 'db.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const seedData = JSON.parse(raw);

        // Seeding tenants
        if (Array.isArray(seedData.tenants)) {
          for (const t of seedData.tenants) {
            await pool.query(
              `INSERT INTO tenants (id, nombre, ruc, razon_social, estado, suscripcion_tipo, fecha_inicio, fecha_fin, logo_url) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [t.id, t.nombre, t.ruc || '20601234567', t.razon_social || t.nombre, t.estado || 'Activo', t.suscripcion_tipo || 'Anual', t.fecha_inicio || '2026-01-01', t.fecha_fin || '2026-12-31', t.logo_url || '']
            );
          }
        }

        // Seeding clientes
        if (Array.isArray(seedData.clientes)) {
          for (const c of seedData.clientes) {
            await pool.query(
              `INSERT INTO clientes (id, id_tenant, tipo, nombre, documento_tipo, documento_numero, email, telefono, direccion, id_parent, historial) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [c.id, c.id_tenant, c.tipo, c.nombre, c.documento_tipo, c.documento_numero, c.email, c.telefono, c.direccion, c.id_parent || null, JSON.stringify(c.historial || [])]
            );
          }
        }

        // Seeding polizas
        if (Array.isArray(seedData.polizas)) {
          for (const p of seedData.polizas) {
            await pool.query(
              `INSERT INTO polizas (id, id_tenant, id_cliente, compania_aseguradora, ramo, numero_poliza, suma_asegurada, deducibles, coberturas, prima_neta, gastos_emision, igv, prima_total, porcentaje_comision, comision_total, fecha_inicio, fecha_fin, estado, moneda, periodicidad) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
              [p.id, p.id_tenant, p.id_cliente, p.compania_aseguradora, p.ramo, p.numero_poliza, p.suma_asegurada, p.deducibles, p.coberturas, p.prima_neta, p.gastos_emision, p.igv, p.prima_total, p.porcentaje_comision, p.comision_total, p.fecha_inicio, p.fecha_fin, p.estado, p.moneda || 'USD', p.periodicidad || 'Anual']
            );
          }
        }

        // Seeding cronograma
        if (Array.isArray(seedData.cronograma)) {
          for (const cr of seedData.cronograma) {
            await pool.query(
              `INSERT INTO cronograma (id, id_tenant, id_poliza, numero_cuota, monto_cuota_cliente, comision_cuota_broker, fecha_vencimiento, estado_pago, estado_comision) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [cr.id, cr.id_tenant, cr.id_poliza, cr.numero_cuota, cr.monto_cuota_cliente, cr.comision_cuota_broker, cr.fecha_vencimiento, cr.estado_pago || 'Pendiente', cr.estado_comision || 'Pendiente']
            );
          }
        }

        // Seeding leads
        if (Array.isArray(seedData.leads)) {
          for (const l of seedData.leads) {
            await pool.query(
              `INSERT INTO leads (id, id_tenant, nombre, compania, documento, email, telefono, direccion, giro, estado, prima_proyectada, ramo, fecha_creacion) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [l.id, l.id_tenant, l.nombre, l.compania || '', l.documento, l.email, l.telefono, l.direccion, l.giro, l.estado, l.prima_proyectada, l.ramo, l.fecha_creacion]
            );
          }
        }

        // Seeding siniestros
        if (Array.isArray(seedData.siniestros)) {
          for (const s of seedData.siniestros) {
            await pool.query(
              `INSERT INTO siniestros (id, id_tenant, id_poliza, id_cliente, fecha_evento, tipo_siniestro, ajustador, estado, fecha_creacion, bitacora) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [s.id, s.id_tenant, s.id_poliza, s.id_cliente, s.fecha_evento, s.tipo_siniestro, s.ajustador || '', s.estado, s.fecha_creacion, JSON.stringify(s.bitacora || [])]
            );
          }
        }

        console.log('Neon database seeded successfully.');
      }
    }

    // 3. Seed tenant payments if empty
    const pagosCheck = await pool.query('SELECT count(*) FROM tenant_pagos');
    const pagosCount = parseInt(pagosCheck.rows[0].count);
    if (pagosCount === 0) {
      console.log('Seeding initial tenant payments...');
      await pool.query(`
        INSERT INTO tenant_pagos (id, id_tenant, monto, fecha_pago, metodo_pago, estado, comprobante_nro)
        VALUES 
        ('PAG-001', 'T-001', 150.00, '2026-01-05', 'Tarjeta de Crédito', 'Pagado', 'FACT-001'),
        ('PAG-002', 'T-001', 150.00, '2026-02-05', 'Tarjeta de Crédito', 'Pagado', 'FACT-002'),
        ('PAG-003', 'T-001', 150.00, '2026-03-05', 'Transferencia Bancaria', 'Pagado', 'FACT-003'),
        ('PAG-004', 'T-001', 150.00, '2026-04-05', 'Tarjeta de Crédito', 'Pagado', 'FACT-004'),
        ('PAG-005', 'T-001', 150.00, '2026-05-05', 'Tarjeta de Crédito', 'Pagado', 'FACT-005')
      `);
    }

    databaseInitialized = true;
  } catch (err) {
    console.error('Error initializing Neon database:', err);
  }
}

// Dynamic Helper for SQL updates
async function updateTableRecord(tableName: string, id: string, updatedFields: Record<string, any>): Promise<any> {
  await initializeDatabase();
  const setClauses: string[] = [];
  const values: any[] = [];
  let index = 1;

  for (const [key, val] of Object.entries(updatedFields)) {
    if (val === undefined) continue;
    setClauses.push(`${key} = $${index}`);
    if (typeof val === 'object' && val !== null) {
      values.push(JSON.stringify(val));
    } else {
      values.push(val);
    }
    index++;
  }

  values.push(id);
  const idIndex = index;
  index++;

  const activeId = activeTenantId;
  values.push(activeId);
  const tenantIndex = index;

  const whereClause = tableName === 'tenants'
    ? `WHERE id = $${idIndex}`
    : `WHERE id = $${idIndex} AND id_tenant = $${tenantIndex}`;

  const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} ${whereClause} RETURNING *`;
  const res = await pool.query(query, values);
  return res.rows[0];
}

// Tenancy context getters/setters
export async function getActiveTenantId(): Promise<string> {
  return activeTenantId;
}

export async function setActiveTenantId(tenantId: string): Promise<void> {
  activeTenantId = tenantId;
  currentUser.id_tenant = tenantId;
}

export async function getCurrentUser(): Promise<User> {
  return currentUser;
}

export async function updateCurrentUser(user: Partial<User>): Promise<void> {
  currentUser = { ...currentUser, ...user };
}

// CRUD - Tenants
export async function getTenants(): Promise<Tenant[]> {
  await initializeDatabase();
  const res = await pool.query('SELECT * FROM tenants ORDER BY id ASC');
  return res.rows;
}

export async function createTenant(tenantData: Omit<Tenant, 'id'>): Promise<Tenant> {
  await initializeDatabase();
  const resIds = await pool.query('SELECT id FROM tenants ORDER BY id DESC LIMIT 1');
  const lastId = resIds.rows[0]?.id;
  let nextNum = 1;
  if (lastId) {
    const num = Number(lastId.split('-')[1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const newId = `T-${String(nextNum).padStart(3, '0')}`;

  const res = await pool.query(
    `INSERT INTO tenants (id, nombre, ruc, razon_social, estado, suscripcion_tipo, fecha_inicio, fecha_fin, logo_url, admin_email, admin_password) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [newId, tenantData.nombre, tenantData.ruc, tenantData.razon_social, tenantData.estado, tenantData.suscripcion_tipo, tenantData.fecha_inicio, tenantData.fecha_fin, tenantData.logo_url || '', tenantData.admin_email || '', tenantData.admin_password || '']
  );
  return res.rows[0];
}

export async function updateTenant(id: string, updatedFields: Partial<Omit<Tenant, 'id'>>): Promise<Tenant> {
  return updateTableRecord('tenants', id, updatedFields);
}

// CRUD - Tenant Subscription Payments
export async function getTenantPagos(tenantId: string): Promise<TenantPago[]> {
  await initializeDatabase();
  const res = await pool.query('SELECT * FROM tenant_pagos WHERE id_tenant = $1 ORDER BY fecha_pago DESC, id DESC', [tenantId]);
  return res.rows.map(row => ({
    ...row,
    monto: parseFloat(row.monto)
  }));
}

export async function createTenantPago(pago: Omit<TenantPago, 'id'>): Promise<TenantPago> {
  await initializeDatabase();
  const resIds = await pool.query('SELECT id FROM tenant_pagos ORDER BY id DESC LIMIT 1');
  const lastId = resIds.rows[0]?.id;
  let nextNum = 1;
  if (lastId) {
    const num = Number(lastId.split('-')[1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const newId = `PAG-${String(nextNum).padStart(3, '0')}`;

  const res = await pool.query(
    `INSERT INTO tenant_pagos (id, id_tenant, monto, fecha_pago, metodo_pago, estado, comprobante_nro)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [newId, pago.id_tenant, pago.monto, pago.fecha_pago, pago.metodo_pago, pago.estado, pago.comprobante_nro]
  );
  return {
    ...res.rows[0],
    monto: parseFloat(res.rows[0].monto)
  };
}

// CRUD - Clients
export async function getClients(): Promise<Client[]> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  const res = await pool.query('SELECT * FROM clientes WHERE id_tenant = $1 ORDER BY nombre ASC', [tenantId]);
  return res.rows;
}

export async function getClientById(id: string): Promise<Client | undefined> {
  await initializeDatabase();
  const res = await pool.query('SELECT * FROM clientes WHERE id = $1 AND id_tenant = $2', [id, activeTenantId]);
  return res.rows[0];
}

export async function createClient(client: Omit<Client, 'id' | 'id_tenant' | 'historial'>): Promise<Client> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  
  const resIds = await pool.query('SELECT id FROM clientes ORDER BY id DESC LIMIT 1');
  const lastId = resIds.rows[0]?.id;
  let nextNum = 1;
  if (lastId) {
    const num = Number(lastId.split('-')[1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const newId = `CLI-${String(nextNum).padStart(3, '0')}`;

  const initialHistory = [{
    fecha: new Date().toISOString().split('T')[0],
    accion: 'Registro',
    nota: 'Se creó la ficha del asegurado.',
    usuario: currentUser.nombre
  }];

  const res = await pool.query(
    `INSERT INTO clientes (id, id_tenant, tipo, nombre, documento_tipo, documento_numero, email, telefono, direccion, id_parent, historial) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [newId, tenantId, client.tipo, client.nombre, client.documento_tipo, client.documento_numero, client.email, client.telefono, client.direccion, client.id_parent || null, JSON.stringify(initialHistory)]
  );
  return res.rows[0];
}

export async function updateClient(id: string, updatedFields: Partial<Omit<Client, 'id' | 'id_tenant' | 'historial'>>): Promise<Client> {
  await initializeDatabase();
  const original = await getClientById(id);
  if (!original) throw new Error('Cliente no encontrado');

  const historyUpdate = [
    ...original.historial,
    {
      fecha: new Date().toISOString().split('T')[0],
      accion: 'Actualización',
      nota: `Campos modificados: ${Object.keys(updatedFields).join(', ')}`,
      usuario: currentUser.nombre
    }
  ];

  const merged = { ...updatedFields, historial: historyUpdate };
  return updateTableRecord('clientes', id, merged);
}

export async function addClientHistory(id: string, action: string, note: string): Promise<void> {
  await initializeDatabase();
  const original = await getClientById(id);
  if (!original) return;

  const historyUpdate = [
    ...original.historial,
    {
      fecha: new Date().toISOString().split('T')[0],
      accion: action,
      nota: note,
      usuario: currentUser.nombre
    }
  ];

  await updateTableRecord('clientes', id, { historial: historyUpdate });
}

// CRUD - Policies
export async function getPolicies(): Promise<Policy[]> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  const res = await pool.query('SELECT * FROM polizas WHERE id_tenant = $1 ORDER BY id DESC', [tenantId]);
  // Map numeric strings back to floats/numbers for safety
  return res.rows.map(row => ({
    ...row,
    suma_asegurada: parseFloat(row.suma_asegurada),
    prima_neta: parseFloat(row.prima_neta),
    gastos_emision: parseFloat(row.gastos_emision),
    igv: parseFloat(row.igv),
    prima_total: parseFloat(row.prima_total),
    porcentaje_comision: parseFloat(row.porcentaje_comision),
    comision_total: parseFloat(row.comision_total),
  }));
}

export async function getPolicyById(id: string): Promise<Policy | undefined> {
  await initializeDatabase();
  const res = await pool.query('SELECT * FROM polizas WHERE id = $1 AND id_tenant = $2', [id, activeTenantId]);
  const row = res.rows[0];
  if (!row) return undefined;
  return {
    ...row,
    suma_asegurada: parseFloat(row.suma_asegurada),
    prima_neta: parseFloat(row.prima_neta),
    gastos_emision: parseFloat(row.gastos_emision),
    igv: parseFloat(row.igv),
    prima_total: parseFloat(row.prima_total),
    porcentaje_comision: parseFloat(row.porcentaje_comision),
    comision_total: parseFloat(row.comision_total),
  };
}

export async function createPolicy(policy: Omit<Policy, 'id' | 'id_tenant'>, installments: number): Promise<{ policy: Policy; schedule: PaymentSchedule[] }> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  
  const resIds = await pool.query('SELECT id FROM polizas ORDER BY id DESC LIMIT 1');
  const lastId = resIds.rows[0]?.id;
  let nextNum = 1;
  if (lastId) {
    const num = Number(lastId.split('-')[1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const policyId = `POL-${String(nextNum).padStart(3, '0')}`;

  const res = await pool.query(
    `INSERT INTO polizas (id, id_tenant, id_cliente, compania_aseguradora, ramo, numero_poliza, suma_asegurada, deducibles, coberturas, prima_neta, gastos_emision, igv, prima_total, porcentaje_comision, comision_total, fecha_inicio, fecha_fin, estado, moneda, periodicidad) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
    [
      policyId, tenantId, policy.id_cliente, policy.compania_aseguradora, policy.ramo, policy.numero_poliza, 
      policy.suma_asegurada, policy.deducibles, policy.coberturas, policy.prima_neta, policy.gastos_emision, 
      policy.igv, policy.prima_total, policy.porcentaje_comision, policy.comision_total, policy.fecha_inicio, 
      policy.fecha_fin, policy.estado || 'Vigente', policy.moneda || 'USD', policy.periodicidad || 'Anual'
    ]
  );

  const newPolicy = {
    ...res.rows[0],
    suma_asegurada: parseFloat(res.rows[0].suma_asegurada),
    prima_neta: parseFloat(res.rows[0].prima_neta),
    gastos_emision: parseFloat(res.rows[0].gastos_emision),
    igv: parseFloat(res.rows[0].igv),
    prima_total: parseFloat(res.rows[0].prima_total),
    porcentaje_comision: parseFloat(res.rows[0].porcentaje_comision),
    comision_total: parseFloat(res.rows[0].comision_total),
  };

  // Generate schedule automatically in database
  const schedule: PaymentSchedule[] = [];
  const cuotaCliente = Number((newPolicy.prima_total / installments).toFixed(2));
  const comisionBroker = Number((newPolicy.comision_total / installments).toFixed(2));
  const startDay = new Date(newPolicy.fecha_inicio);

  const resCronogramas = await pool.query('SELECT count(*) FROM cronograma');
  let startCronNum = parseInt(resCronogramas.rows[0].count) + 1;

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(startDay);
    dueDate.setDate(dueDate.getDate() + (i - 1) * 30);
    
    const systemDate = new Date('2026-06-05');
    let estadoPago: 'Pendiente' | 'Pagado' | 'Vencido' = 'Pendiente';
    if (dueDate < systemDate) {
      estadoPago = 'Vencido';
    }

    const payId = `PAY-${String(startCronNum + i - 1).padStart(3, '0')}`;

    const resPay = await pool.query(
      `INSERT INTO cronograma (id, id_tenant, id_poliza, numero_cuota, monto_cuota_cliente, comision_cuota_broker, fecha_vencimiento, estado_pago, estado_comision) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        payId, tenantId, policyId, i, cuotaCliente, comisionBroker, 
        dueDate.toISOString().split('T')[0], estadoPago, 'Pendiente'
      ]
    );

    schedule.push({
      ...resPay.rows[0],
      monto_cuota_cliente: parseFloat(resPay.rows[0].monto_cuota_cliente),
      comision_cuota_broker: parseFloat(resPay.rows[0].comision_cuota_broker),
    });
  }

  // Log in client history
  await addClientHistory(newPolicy.id_cliente, 'Póliza Registrada', `Se emitió la póliza ${newPolicy.numero_poliza} (${newPolicy.ramo}) con ${installments} cuotas.`);

  return { policy: newPolicy, schedule };
}

export async function updatePolicy(id: string, updatedFields: Partial<Omit<Policy, 'id' | 'id_tenant'>>): Promise<Policy> {
  const row = await updateTableRecord('polizas', id, updatedFields);
  return {
    ...row,
    suma_asegurada: parseFloat(row.suma_asegurada),
    prima_neta: parseFloat(row.prima_neta),
    gastos_emision: parseFloat(row.gastos_emision),
    igv: parseFloat(row.igv),
    prima_total: parseFloat(row.prima_total),
    porcentaje_comision: parseFloat(row.porcentaje_comision),
    comision_total: parseFloat(row.comision_total),
  };
}

// CRUD - Payment Schedules
export async function getPaymentSchedules(): Promise<PaymentSchedule[]> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  const res = await pool.query('SELECT * FROM cronograma WHERE id_tenant = $1 ORDER BY fecha_vencimiento ASC, numero_cuota ASC', [tenantId]);
  return res.rows.map(row => ({
    ...row,
    monto_cuota_cliente: parseFloat(row.monto_cuota_cliente),
    comision_cuota_broker: parseFloat(row.comision_cuota_broker),
  }));
}

export async function updatePaymentStatus(id: string, estado_pago?: 'Pendiente' | 'Pagado' | 'Vencido', estado_comision?: 'Pendiente' | 'Cobrado'): Promise<PaymentSchedule> {
  await initializeDatabase();
  const fieldsToUpdate: Record<string, any> = {};
  if (estado_pago !== undefined) fieldsToUpdate.estado_pago = estado_pago;
  if (estado_comision !== undefined) fieldsToUpdate.estado_comision = estado_comision;

  const row = await updateTableRecord('cronograma', id, fieldsToUpdate);
  return {
    ...row,
    monto_cuota_cliente: parseFloat(row.monto_cuota_cliente),
    comision_cuota_broker: parseFloat(row.comision_cuota_broker),
  };
}

// CRUD - Leads
export async function getLeads(): Promise<Lead[]> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  const res = await pool.query('SELECT * FROM leads WHERE id_tenant = $1 ORDER BY id DESC', [tenantId]);
  return res.rows.map(row => ({
    ...row,
    prima_proyectada: parseFloat(row.prima_proyectada)
  }));
}

export async function createLead(lead: Omit<Lead, 'id' | 'id_tenant' | 'fecha_creacion'>): Promise<Lead> {
  await initializeDatabase();
  const tenantId = activeTenantId;

  const resIds = await pool.query('SELECT id FROM leads ORDER BY id DESC LIMIT 1');
  const lastId = resIds.rows[0]?.id;
  let nextNum = 1;
  if (lastId) {
    const num = Number(lastId.split('-')[1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const leadId = `LD-${String(nextNum).padStart(3, '0')}`;

  const res = await pool.query(
    `INSERT INTO leads (id, id_tenant, nombre, compania, documento, email, telefono, direccion, giro, estado, prima_proyectada, ramo, fecha_creacion) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      leadId, tenantId, lead.nombre, lead.compania || '', lead.documento, lead.email, lead.telefono, 
      lead.direccion, lead.giro, lead.estado || 'nuevo', lead.prima_proyectada, lead.ramo, 
      new Date().toISOString().split('T')[0]
    ]
  );
  return {
    ...res.rows[0],
    prima_proyectada: parseFloat(res.rows[0].prima_proyectada)
  };
}

export async function updateLeadStatus(id: string, estado: Lead['estado']): Promise<Lead> {
  const row = await updateTableRecord('leads', id, { estado });
  return {
    ...row,
    prima_proyectada: parseFloat(row.prima_proyectada)
  };
}

export async function deleteLead(id: string): Promise<void> {
  await initializeDatabase();
  await pool.query('DELETE FROM leads WHERE id = $1 AND id_tenant = $2', [id, activeTenantId]);
}

// CRUD - Claims (Siniestros)
export async function getClaims(): Promise<Claim[]> {
  await initializeDatabase();
  const tenantId = activeTenantId;
  const res = await pool.query('SELECT * FROM siniestros WHERE id_tenant = $1 ORDER BY id DESC', [tenantId]);
  return res.rows;
}

export async function createClaim(claim: Omit<Claim, 'id' | 'id_tenant' | 'fecha_creacion' | 'bitacora'>): Promise<Claim> {
  await initializeDatabase();
  const tenantId = activeTenantId;

  const resIds = await pool.query('SELECT id FROM siniestros ORDER BY id DESC LIMIT 1');
  const lastId = resIds.rows[0]?.id;
  let nextNum = 1;
  if (lastId) {
    const num = Number(lastId.split('-')[1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const claimId = `SIN-${String(nextNum).padStart(3, '0')}`;

  const initialBitacora = [
    {
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      motivo: 'Apertura de Siniestro',
      proximo_control: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ];

  const res = await pool.query(
    `INSERT INTO siniestros (id, id_tenant, id_poliza, id_cliente, fecha_evento, tipo_siniestro, ajustador, estado, fecha_creacion, bitacora) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      claimId, tenantId, claim.id_poliza, claim.id_cliente, claim.fecha_evento, claim.tipo_siniestro, 
      claim.ajustador || '', claim.estado || 'Reportado', new Date().toISOString().split('T')[0], 
      JSON.stringify(initialBitacora)
    ]
  );

  // Log in client history
  await addClientHistory(claim.id_cliente, 'Siniestro Declarado', `Se reportó siniestro (${claim.tipo_siniestro}) para póliza ID: ${claim.id_poliza}`);

  return res.rows[0];
}

export async function addClaimLog(claimId: string, motivo: string, proximo_control: string): Promise<Claim> {
  await initializeDatabase();
  const resClaims = await pool.query('SELECT * FROM siniestros WHERE id = $1 AND id_tenant = $2', [claimId, activeTenantId]);
  const claim = resClaims.rows[0];
  if (!claim) throw new Error('Siniestro no encontrado');

  const bitacoraUpdated = [
    ...claim.bitacora,
    {
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      motivo,
      proximo_control
    }
  ];

  return updateTableRecord('siniestros', claimId, { bitacora: bitacoraUpdated });
}

export async function updateClaimStatus(claimId: string, estado: Claim['estado']): Promise<Claim> {
  await initializeDatabase();
  const resClaims = await pool.query('SELECT * FROM siniestros WHERE id = $1 AND id_tenant = $2', [claimId, activeTenantId]);
  const claim = resClaims.rows[0];
  if (!claim) throw new Error('Siniestro no encontrado');

  const bitacoraUpdated = [
    ...claim.bitacora,
    {
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      motivo: `Cambio de estado a: ${estado}`,
      proximo_control: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ];

  return updateTableRecord('siniestros', claimId, { estado, bitacora: bitacoraUpdated });
}
