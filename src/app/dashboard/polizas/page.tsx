'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  ChevronDown,
  Upload,
  CheckCircle,
  XCircle,
  History
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

interface Claim {
  id: string;
  id_tenant: string;
  id_poliza: string;
  id_cliente: string;
  fecha_evento: string;
  tipo_siniestro: string;
  ajustador: string;
  estado: 'Reportado' | 'En Evaluacion' | 'Documentacion Pendiente' | 'Liquidado' | 'Rechazado';
  fecha_creacion: string;
  monto_siniestro: number;
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

  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return '';
  };

  const downloadExcelTemplate = () => {
    const headers = [
      'Cliente Tipo', 'Cliente Nombre', 'Cliente Doc Tipo', 'Cliente Doc Número', 
      'Cliente Email', 'Cliente Teléfono', 'Cliente Dirección', 
      'Aseguradora', 'Ramo', 'Número de Póliza', 'Suma Asegurada', 
      'Moneda', 'Prima Neta', 'Porcentaje Comisión', 'Periodicidad', 
      'Cuotas', 'Fecha de Inicio', 'Fecha de Fin', 'Coberturas', 'Deducibles'
    ];
    const sampleRow1 = [
      'natural', 'Juan Pérez', 'DNI', '44445555', 
      'juan.perez@email.com', '999111222', 'Av. Arequipa 1122, Miraflores', 
      'Rimac', 'Vehicular', 'CAR-12345-2026', 15000, 
      'USD', 650.00, 15, 'Anual', 4, 
      '2026-06-06', '2027-06-06', 
      'Daño Propio, Responsabilidad Civil', 'Deducible general USD 150, Copago 10%'
    ];
    const sampleRow2 = [
      'juridica', 'Agroindustrias S.A.', 'RUC', '20601122334', 
      'contacto@agroindustrias.com', '014445555', 'Av. Industrial 456, Ate', 
      'Pacífico', 'SCTR', 'SCTR-9988-2026', 50000, 
      'PEN', 1200.00, 10, 'Mensual', 12, 
      '2026-06-15', '', 
      'Accidentes de Trabajo, Invalidez, Muerte', 'Deducible USD 100, Copago 15%, Deducible lunas 10%'
    ];
    const wsData = [headers, sampleRow1, sampleRow2];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Carga');
    XLSX.writeFile(wb, 'plantilla_carga_polizas.xlsx');
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

          const cliTipo = valAt(0).toLowerCase();
          const cliNombre = valAt(1);
          const cliDocTipo = valAt(2).toUpperCase();
          const cliDocNum = valAt(3);
          const cliEmail = valAt(4);
          const cliTelefono = valAt(5);
          const cliDireccion = valAt(6);

          const companiaAseg = valAt(7);
          const ramoSeguro = valAt(8);
          const nroPoliza = valAt(9);
          const sumaAseg = rawNumAt(10) || 0;
          const monedaContrato = valAt(11).toUpperCase() || 'USD';
          const netPremium = rawNumAt(12) || 0;
          const comisionPct = rawNumAt(13) || 15;
          const period = valAt(14) || 'Anual';
          const nroCuotas = rawNumAt(15) || 4;
          const startD = parseExcelDate(row[16]);
          const endD = parseExcelDate(row[17]);
          const cobList = valAt(18);
          const dedList = valAt(19);

          // Validation Rules
          if (!cliNombre) errorsList.push(`Fila ${lineNum}: Nombre del Cliente es requerido.`);
          if (!cliDocTipo || !['DNI', 'RUC', 'CE'].includes(cliDocTipo)) {
            errorsList.push(`Fila ${lineNum}: Tipo de Documento de cliente inválido o vacío (debe ser DNI, RUC o CE).`);
          }
          if (!cliDocNum) errorsList.push(`Fila ${lineNum}: Número de Documento es requerido.`);
          if (cliTipo && !['natural', 'juridica'].includes(cliTipo)) {
            errorsList.push(`Fila ${lineNum}: Tipo de Cliente inválido (debe ser 'natural' o 'juridica').`);
          }

          if (!companiaAseg) errorsList.push(`Fila ${lineNum}: Compañía Aseguradora es requerida.`);
          if (!ramoSeguro) errorsList.push(`Fila ${lineNum}: Ramo es requerido.`);
          if (!nroPoliza) errorsList.push(`Fila ${lineNum}: Número de Póliza es requerido.`);
          if (isNaN(netPremium) || netPremium <= 0) errorsList.push(`Fila ${lineNum}: Prima Neta debe ser un número positivo.`);
          if (isNaN(comisionPct) || comisionPct < 0 || comisionPct > 100) {
            errorsList.push(`Fila ${lineNum}: Porcentaje de Comisión debe estar entre 0 y 100.`);
          }
          if (!['USD', 'PEN'].includes(monedaContrato)) {
            errorsList.push(`Fila ${lineNum}: Moneda debe ser USD o PEN.`);
          }
          if (!['Anual', 'Semestral', 'Mensual'].includes(period)) {
            errorsList.push(`Fila ${lineNum}: Periodicidad debe ser Anual, Semestral o Mensual.`);
          }
          if (![1, 2, 4, 12].includes(nroCuotas)) {
            errorsList.push(`Fila ${lineNum}: El número de cuotas debe ser 1, 2, 4 o 12.`);
          }
          if (!startD) {
            errorsList.push(`Fila ${lineNum}: Fecha de Inicio de póliza es requerida y debe tener formato YYYY-MM-DD.`);
          }

          const clientExists = clients.some(c => c.documento_numero === cliDocNum);

          previewList.push({
            linea: lineNum,
            cliente: {
              tipo: cliTipo || 'natural',
              nombre: cliNombre,
              documento_tipo: cliDocTipo,
              documento_numero: cliDocNum,
              email: cliEmail || `${cliDocNum.toLowerCase()}@insureone-mail.com`,
              telefono: cliTelefono || '999999999',
              direccion: cliDireccion || 'Dirección no especificada',
              existe: clientExists
            },
            poliza: {
              compania_aseguradora: companiaAseg,
              ramo: ramoSeguro,
              numero_poliza: nroPoliza,
              suma_asegurada: sumaAseg,
              moneda: monedaContrato,
              prima_neta: netPremium,
              porcentaje_comision: comisionPct,
              periodicidad: period,
              cuotas: nroCuotas,
              fecha_inicio: startD,
              fecha_fin: endD,
              coberturas: cobList,
              deducibles: dedList
            }
          });
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
    setUploadProgress(0);

    let importadasCount = 0;
    let creadosCount = 0;

    const localClientsMap = new Map<string, string>();
    clients.forEach(c => localClientsMap.set(c.documento_numero, c.id));

    try {
      for (let i = 0; i < filePreviewData.length; i++) {
        const item = filePreviewData[i];
        
        let clientDbId = localClientsMap.get(item.cliente.documento_numero);
        
        if (!clientDbId) {
          const cliRes = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              tipo: item.cliente.tipo,
              nombre: item.cliente.nombre,
              documento_tipo: item.cliente.documento_tipo,
              documento_numero: item.cliente.documento_numero,
              email: item.cliente.email,
              telefono: item.cliente.telefono,
              direccion: item.cliente.direccion
            })
          });

          if (cliRes.ok) {
            const cliData = await cliRes.json();
            clientDbId = cliData.client.id;
            localClientsMap.set(item.cliente.documento_numero, clientDbId!);
            creadosCount++;
          } else {
            throw new Error(`No se pudo crear el cliente para la fila ${item.linea}`);
          }
        }

        const net = Number(item.poliza.prima_neta);
        const emis = Number((net * 0.03).toFixed(2));
        const sub = Number((net + emis).toFixed(2));
        const tax = Number((sub * 0.18).toFixed(2));
        const tot = Number((sub + tax).toFixed(2));
        const com = Number((net * (item.poliza.porcentaje_comision / 100)).toFixed(2));

        let endD = item.poliza.fecha_fin;
        if (!endD) {
          const start = new Date(item.poliza.fecha_inicio);
          const end = new Date(start);
          if (item.poliza.periodicidad === 'Anual') {
            end.setFullYear(start.getFullYear() + 1);
          } else if (item.poliza.periodicidad === 'Semestral') {
            end.setMonth(start.getMonth() + 6);
          } else if (item.poliza.periodicidad === 'Mensual') {
            end.setMonth(start.getMonth() + 1);
          }
          endD = end.toISOString().split('T')[0];
        }

        const polRes = await fetch('/api/polizas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            id_cliente: clientDbId,
            compania_aseguradora: item.poliza.compania_aseguradora,
            ramo: item.poliza.ramo,
            numero_poliza: item.poliza.numero_poliza,
            suma_asegurada: item.poliza.suma_asegurada,
            deducibles: item.poliza.deducibles,
            coberturas: item.poliza.coberturas,
            prima_neta: net,
            gastos_emision: emis,
            igv: tax,
            prima_total: tot,
            porcentaje_comision: item.poliza.porcentaje_comision,
            comision_total: com,
            fecha_inicio: item.poliza.fecha_inicio,
            fecha_fin: endD,
            moneda: item.poliza.moneda,
            periodicidad: item.poliza.periodicidad,
            installments: item.poliza.cuotas
          })
        });

        if (polRes.ok) {
          importadasCount++;
        } else {
          throw new Error(`No se pudo crear la póliza para la fila ${item.linea}`);
        }

        const progress = Math.round(((i + 1) / filePreviewData.length) * 100);
        setUploadProgress(progress);
      }

      await fetchData();

      setUploadResults({
        polizasImportadas: importadasCount,
        clientesCreados: creadosCount
      });
    } catch (err: any) {
      console.error(err);
      alert(`Error durante el proceso de carga masiva: ${err.message || 'Error desconocido'}`);
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

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<'lista' | 'catalogo' | 'renovaciones'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [renewalFilterDays, setRenewalFilterDays] = useState<30 | 60 | 90>(30);

  // Aseguradoras Catalog States
  interface Aseguradora {
    id: number;
    nombre: string;
    telefono: string;
    ejecutivo: string;
    email: string;
    direccion: string;
  }
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [editAseguradoraId, setEditAseguradoraId] = useState<number | null>(null);
  const [asegNombre, setAsegNombre] = useState('');
  const [asegTelefono, setAsegTelefono] = useState('');
  const [asegEjecutivo, setAsegEjecutivo] = useState('');
  const [asegEmail, setAsegEmail] = useState('');
  const [asegDireccion, setAsegDireccion] = useState('');
  const [asegModalOpen, setAsegModalOpen] = useState(false);

  // Bulk Upload States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filePreviewData, setFilePreviewData] = useState<any[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ polizasImportadas: number; clientesCreados: number } | null>(null);

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

  const fetchAseguradoras = async () => {
    try {
      const res = await fetch('/api/aseguradoras');
      if (res.ok) {
        const data = await res.json();
        setAseguradoras(data);
      }
    } catch (err) {
      console.error('Error fetching aseguradoras:', err);
    }
  };

  const handleEditAseguradora = (a: Aseguradora) => {
    setEditAseguradoraId(a.id);
    setAsegNombre(a.nombre);
    setAsegTelefono(a.telefono);
    setAsegEjecutivo(a.ejecutivo);
    setAsegEmail(a.email);
    setAsegDireccion(a.direccion);
    setAsegModalOpen(true);
  };

  const handleSubmitAseguradora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAseguradoraId || !asegNombre || !asegTelefono || !asegEjecutivo || !asegEmail || !asegDireccion) {
      alert('Todos los campos son requeridos');
      return;
    }

    try {
      const res = await fetch('/api/aseguradoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editAseguradoraId,
          nombre: asegNombre,
          telefono: asegTelefono,
          ejecutivo: asegEjecutivo,
          email: asegEmail,
          direccion: asegDireccion
        })
      });

      if (res.ok) {
        await fetchAseguradoras();
        setAsegModalOpen(false);
        setEditAseguradoraId(null);
      } else {
        const data = await res.json();
        alert(`Error al actualizar aseguradora: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al actualizar aseguradora');
    }
  };

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
      const claimsRes = await fetch('/api/siniestros');
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData);
      }
      await fetchAseguradoras();
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

  // Helper to calculate loss ratio metrics for selected policy
  const getPolicyLossRatioMetrics = () => {
    if (!editPolicyId) return null;
    const editingPolicy = policies.find(p => p.id === editPolicyId);
    if (!editingPolicy) return null;

    const getBasePolicyNumber = (num: string) => {
      if (!num) return '';
      const parts = num.split('-');
      if (parts.length > 1) {
        const last = parts[parts.length - 1];
        if (/^\d{4}$/.test(last) || /^\d+$/.test(last)) {
          return parts.slice(0, -1).join('-');
        }
      }
      return num;
    };

    const baseNumber = getBasePolicyNumber(editingPolicy.numero_poliza);
    const relatedPolicies = policies.filter(p => 
      p.id_cliente === editingPolicy.id_cliente &&
      p.ramo === editingPolicy.ramo &&
      getBasePolicyNumber(p.numero_poliza) === baseNumber
    );

    // Current term claims & loss ratio (Liquidado only)
    const currentClaims = claims.filter(c => c.id_poliza === editingPolicy.id && c.estado === 'Liquidado');
    const currentClaimsSum = currentClaims.reduce((sum, c) => sum + c.monto_siniestro, 0);
    const currentNetPremium = editingPolicy.prima_neta || 0;
    const currentLossRatio = currentNetPremium > 0 ? (currentClaimsSum / currentNetPremium) * 100 : 0;

    // Accumulated claims & loss ratio (Liquidado only)
    const relatedPolicyIds = relatedPolicies.map(p => p.id);
    const accumulatedClaims = claims.filter(c => relatedPolicyIds.includes(c.id_poliza) && c.estado === 'Liquidado');
    const accumulatedClaimsSum = accumulatedClaims.reduce((sum, c) => sum + c.monto_siniestro, 0);
    const accumulatedNetPremium = relatedPolicies.reduce((sum, p) => sum + (p.prima_neta || 0), 0);
    const accumulatedLossRatio = accumulatedNetPremium > 0 ? (accumulatedClaimsSum / accumulatedNetPremium) * 100 : 0;

    // Ordered related policies (vigencias anteriores) - from most recent to oldest, excluding the current one
    const previousTerms = relatedPolicies
      .filter(p => p.id !== editingPolicy.id)
      .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

    return {
      editingPolicy,
      baseNumber,
      relatedPolicies,
      currentClaims,
      currentClaimsSum,
      currentLossRatio,
      accumulatedClaims,
      accumulatedClaimsSum,
      accumulatedLossRatio,
      previousTerms,
      moneda: editingPolicy.moneda || 'USD'
    };
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setUploadModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} />
            Carga Masiva
          </button>
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            Registrar Póliza
          </button>
        </div>
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
                      <tr 
                        key={p.id}
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleEditPolicy(p)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleEditPolicy(p);
                          }
                        }}
                      >
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
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar doble ejecución por el click en tr
                              handleEditPolicy(p);
                            }}
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
          {aseguradoras.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              Cargando aseguradoras...
            </div>
          ) : (
            aseguradoras.map((a) => (
              <div 
                key={a.id} 
                className="premium-card animate-slide-in" 
                style={{ 
                  margin: 0, 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, box-shadow 0.2s', 
                  border: '1px solid #E2E8F0' 
                }}
                onClick={() => handleEditAseguradora(a)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
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
            ))
          )}
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
              {/* Header Cards for Siniestralidad (Only when editing an existing policy) */}
              {(() => {
                const metrics = getPolicyLossRatioMetrics();
                if (!metrics) return null;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px 24px 0 24px' }}>
                    <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #3B82F6', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Siniestralidad Póliza Vigente</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626', marginTop: '4px', fontFamily: 'var(--font-title)' }}>
                        {metrics.currentLossRatio.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                        Siniestros: {metrics.moneda} {metrics.currentClaimsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })} / Prima Neta: {metrics.moneda} {metrics.editingPolicy.prima_neta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: '4px solid #8B5CF6', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Siniestralidad Acumulada (Histórica)</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626', marginTop: '4px', fontFamily: 'var(--font-title)' }}>
                        {metrics.accumulatedLossRatio.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                        Siniestros: {metrics.moneda} {metrics.accumulatedClaimsSum.toLocaleString('en-US', { minimumFractionDigits: 2 })} / Prima Neta: {metrics.moneda} {metrics.relatedPolicies.reduce((s, p) => s + (p.prima_neta || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
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
                        {aseguradoras.map(a => (
                          <option key={a.id} value={a.nombre}>{a.nombre}</option>
                        ))}
                        {aseguradoras.length === 0 && (
                          <>
                            <option value="Rimac">Rimac</option>
                            <option value="Pacifico">Pacífico</option>
                            <option value="Mapfre">Mapfre</option>
                            <option value="La Positiva">La Positiva</option>
                          </>
                        )}
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
                        onClick={() => setShowCoverageDropdown(true)}
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

              {/* Grilla de Vigencias Anteriores */}
              {editPolicyId && (() => {
                const metrics = getPolicyLossRatioMetrics();
                if (!metrics || metrics.previousTerms.length === 0) return null;
                return (
                  <div style={{ padding: '0 24px 20px 24px', borderTop: '1px solid #E2E8F0', marginTop: '20px', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '14px', color: '#0F172A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <History size={16} style={{ color: '#2563EB' }} />
                      Vigencias / Renovaciones Anteriores
                    </h4>
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                      <table className="premium-table" style={{ fontSize: '12px', margin: 0 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F8FAFC' }}>
                            <th>Nro de Póliza</th>
                            <th>Periodo / Vigencia</th>
                            <th>Aseguradora</th>
                            <th>Suma Asegurada</th>
                            <th>Prima Neta</th>
                            <th>Prima Total</th>
                            <th>Comisión Total</th>
                            <th>Siniestros Liquidados</th>
                            <th>Siniestralidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.previousTerms.map((term) => {
                            const termClaims = claims.filter(c => c.id_poliza === term.id && c.estado === 'Liquidado');
                            const termClaimsSum = termClaims.reduce((s, c) => s + c.monto_siniestro, 0);
                            const termLossRatio = term.prima_neta > 0 ? (termClaimsSum / term.prima_neta) * 100 : 0;
                            return (
                              <tr key={term.id}>
                                <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{term.numero_poliza}</td>
                                <td>{formatDateToLocal(term.fecha_inicio)} al {formatDateToLocal(term.fecha_fin)}</td>
                                <td>{term.compania_aseguradora}</td>
                                <td>{formatCurrency(term.suma_asegurada, term.moneda || 'USD')}</td>
                                <td>{formatCurrency(term.prima_neta, term.moneda || 'USD')}</td>
                                <td>{formatCurrency(term.prima_total, term.moneda || 'USD')}</td>
                                <td>{formatCurrency(term.comision_total, term.moneda || 'USD')}</td>
                                <td>
                                  {termClaims.length > 0 ? (
                                    <span style={{ fontWeight: 600, color: '#DC2626' }}>
                                      {formatCurrency(termClaimsSum, term.moneda || 'USD')} ({termClaims.length})
                                    </span>
                                  ) : (
                                    <span style={{ color: '#64748B' }}>{term.moneda || 'USD'} 0.00 (0)</span>
                                  )}
                                </td>
                                <td>
                                  <span className="badge" style={{ backgroundColor: termLossRatio > 50 ? '#FEE2E2' : '#F1F5F9', color: termLossRatio > 50 ? '#EF4444' : '#475569', fontWeight: 600 }}>
                                    {termLossRatio.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

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

      {/* BULK UPLOAD EXCEL MODAL */}
      {uploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} style={{ color: '#2563EB' }} />
                Carga Masiva de Pólizas
              </h3>
              <button className="modal-close-btn" onClick={handleCloseUploadModal} disabled={uploading}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Carga pólizas y asegurados masivamente. Si el asegurado no existe (evaluado por su número de documento), el sistema lo registrará automáticamente.
              </p>

              {/* Template Download Option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155' }}>¿No tienes el formato de Excel?</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Descarga la plantilla con ejemplos listos para rellenar.</span>
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
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>¡Carga Masiva Exitosa!</h4>
                  <p style={{ fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                    Se importaron correctamente <strong>{uploadResults.polizasImportadas}</strong> pólizas de seguro y se crearon <strong>{uploadResults.clientesCreados}</strong> nuevos asegurados en el sistema.
                  </p>
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
                          <th>Cliente</th>
                          <th>Aseguradora</th>
                          <th>Ramo</th>
                          <th>Prima Neta</th>
                          <th>Cuotas</th>
                          <th>Cliente Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filePreviewData.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.linea}</td>
                            <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{item.poliza.numero_poliza}</td>
                            <td>
                              <div>
                                <div style={{ fontWeight: 500 }}>{item.cliente.nombre}</div>
                                <div style={{ fontSize: '10px', color: '#64748B' }}>{item.cliente.documento_tipo}: {item.cliente.documento_numero}</div>
                              </div>
                            </td>
                            <td>{item.poliza.compania_aseguradora}</td>
                            <td>{item.poliza.ramo}</td>
                            <td style={{ fontWeight: 600 }}>
                              {formatCurrency(item.poliza.prima_neta, item.poliza.moneda)}
                            </td>
                            <td>{item.poliza.cuotas}</td>
                            <td>
                              {item.cliente.existe ? (
                                <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10px', padding: '2px 6px' }}>Existente</span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>¡Crear Nuevo!</span>
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
                  {uploading ? `Subiendo...` : 'Iniciar Carga'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT INSURER MODAL */}
      {asegModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Aseguradora</h3>
              <button className="modal-close-btn" onClick={() => { setAsegModalOpen(false); setEditAseguradoraId(null); }}>&times;</button>
            </div>
            <form onSubmit={handleSubmitAseguradora}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Nombre de la Aseguradora *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={asegNombre} 
                    onChange={(e) => setAsegNombre(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono de Emergencias *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={asegTelefono} 
                    onChange={(e) => setAsegTelefono(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ejecutivo de Cuenta *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={asegEjecutivo} 
                    onChange={(e) => setAsegEjecutivo(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email del Ejecutivo *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={asegEmail} 
                    onChange={(e) => setAsegEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Oficina Principal *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={asegDireccion} 
                    onChange={(e) => setAsegDireccion(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setAsegModalOpen(false); setEditAseguradoraId(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
