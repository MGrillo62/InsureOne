'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  Send, 
  User, 
  FileText, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
}

interface Policy {
  id: string;
  id_cliente: string;
  numero_poliza: string;
  ramo: string;
  prima_total: number;
}

interface PaymentSchedule {
  id: string;
  id_poliza: string;
  fecha_vencimiento: string;
  monto_cuota_cliente: string;
}

interface MessageLog {
  id: string;
  cliente: string;
  canal: 'whatsapp' | 'email';
  mensaje: string;
  fecha: string;
}

export default function AlertasPage() {
  const formatDateToLocal = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);

  // Selected details
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('pago');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // Custom message body
  const [messageText, setMessageText] = useState('');
  
  // WhatsApp screen mockup chat list
  const [simulatedMessages, setSimulatedMessages] = useState<Array<{ text: string; time: string; sent: boolean }>>([
    { text: 'Hola, bienvenido al canal de notificaciones automáticas de BrokerSync.', time: '10:00 AM', sent: false }
  ]);

  const fetchData = async () => {
    try {
      const cliRes = await fetch('/api/clientes');
      if (cliRes.ok) setClients(await cliRes.json());

      const polRes = await fetch('/api/polizas');
      if (polRes.ok) setPolicies(await polRes.json());

      const schRes = await fetch('/api/cronograma');
      if (schRes.ok) setSchedules(await schRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Templates
  const templates = {
    pago: 'Estimado(a) {{CLIENT_NAME}},\n\nLe saludamos de BrokerSync. Le recordamos que su cuota de la póliza {{POLICY_NUMBER}} vence el {{DUE_DATE}} por un monto de USD {{AMOUNT}}.\n\nEvite la pérdida de cobertura realizando su abono antes de la fecha límite. Si ya realizó el pago, por favor ignore este mensaje.\n\nAtentamente,\nBrokerSync Cobranzas',
    renovacion: 'Estimado(a) {{CLIENT_NAME}},\n\nLe informamos que su póliza de seguro {{POLICY_NUMBER}} (Ramo: {{RAMO}}) está próxima a vencer el {{DUE_DATE}}.\n\nPara iniciar el trámite de renovación comercial y mantener sus beneficios activos con las mejores tarifas del mes, por favor responda a este mensaje.\n\nSaludos cordiales,\nBrokerSync Renovaciones'
  };

  // Compile template based on selected customer
  useEffect(() => {
    if (!selectedClientId) {
      setMessageText('');
      return;
    }

    const clientObj = clients.find(c => c.id === selectedClientId);
    const policyObj = policies.find(p => p.id_cliente === selectedClientId);
    const scheduleObj = policyObj ? schedules.find(s => s.id_poliza === policyObj.id) : null;

    const name = clientObj ? clientObj.nombre : '[Nombre del Cliente]';
    const policy = policyObj ? policyObj.numero_poliza : '[Número de Póliza]';
    const ramo = policyObj ? policyObj.ramo : '[Ramo]';
    const dueDate = scheduleObj ? formatDateToLocal(scheduleObj.fecha_vencimiento) : '[Fecha Vencimiento]';
    const amount = policyObj ? (policyObj.prima_total / 4).toFixed(2) : '0.00'; // mock cuota amount

    let temp = selectedTemplate === 'pago' ? templates.pago : templates.renovacion;
    temp = temp
      .replace(/{{CLIENT_NAME}}/g, name)
      .replace(/{{POLICY_NUMBER}}/g, policy)
      .replace(/{{RAMO}}/g, ramo)
      .replace(/{{DUE_DATE}}/g, dueDate)
      .replace(/{{AMOUNT}}/g, amount);

    setMessageText(temp);
  }, [selectedClientId, selectedTemplate, clients, policies, schedules]);

  // Send Trigger Action
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !messageText) return;

    const clientObj = clients.find(c => c.id === selectedClientId);
    if (!clientObj) return;

    // Simulate sending
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    // Add to simulation screen
    setSimulatedMessages(prev => [
      ...prev,
      { text: messageText, time: timeStr, sent: true }
    ]);

    // Add log
    const newLog: MessageLog = {
      id: `LOG-${Date.now()}`,
      cliente: clientObj.nombre,
      canal: channel,
      mensaje: messageText,
      fecha: dateStr
    };
    setLogs(prev => [newLog, ...prev]);

    // Save history note to database client
    try {
      await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addNote',
          id: clientObj.id,
          noteAction: channel === 'whatsapp' ? 'WhatsApp Enviado' : 'Correo Enviado',
          noteText: `Mensaje de cobranza/renovación enviado: "${messageText.substring(0, 80)}..."`
        })
      });
    } catch (err) {
      console.error('Error logging history note:', err);
    }

    alert(`Mensaje notificado con éxito a través de ${channel.toUpperCase()}`);
  };

  return (
    <div className="animate-fade-in">
      {/* Title bar */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={24} style={{ color: '#2563EB' }} />
          Alertas y Comunicaciones Omnicanal
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
          Automatiza o despacha recordatorios de pago e inicio de trámites de renovación a tus clientes por WhatsApp o Email.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '25px', alignItems: 'start' }}>
        
        {/* LEFT PANEL: COMPOSER */}
        <div className="premium-card">
          <div className="card-header">
            <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#2563EB' }} />
              Gestor de Envío Individual
            </h2>
          </div>
          
          <form onSubmit={handleSend} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">1. Seleccione Cliente Asegurado</label>
              <select 
                className="form-input" 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (Cel: {c.telefono})</option>
                ))}
              </select>
            </div>

            <div className="grid-cols-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">2. Tipo de Alerta (Plantilla)</label>
                <select 
                  className="form-input" 
                  value={selectedTemplate} 
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value="pago">Recordatorio de Pago de Cuota</option>
                  <option value="renovacion">Aviso de Renovación de Póliza</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">3. Canal de Envío</label>
                <select 
                  className="form-input" 
                  value={channel} 
                  onChange={(e: any) => setChannel(e.target.value)}
                >
                  <option value="whatsapp">WhatsApp Directo</option>
                  <option value="email">Correo Electrónico</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">4. Cuerpo del Mensaje</label>
              <textarea 
                className="form-input" 
                style={{ height: '180px', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: '1.5', resize: 'none' }}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Seleccione un cliente para pre-poblar la plantilla..."
                required
              />
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                Puede editar el cuerpo del mensaje antes del envío; las variables se actualizan automáticamente en tiempo real.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!selectedClientId}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Send size={16} />
                Despachar Alerta
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT PANEL: SIMULATOR OR HISTORY LOG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* WHATSAPP PHONE SIMULATOR */}
          <div className="premium-card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '12px 20px', background: '#075E54', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
              <div>
                <h2 style={{ fontSize: '14px', color: '#FFFFFF' }}>Simulador Móvil: WhatsApp BrokerSync</h2>
                <p className="card-subtitle" style={{ color: '#E2E8F0', fontSize: '10.5px' }}>Canal de notificaciones en tiempo real del Tenant</p>
              </div>
            </div>

            <div className="whatsapp-chat-container">
              {simulatedMessages.map((msg, index) => (
                <div key={index} className={`whatsapp-bubble ${msg.sent ? 'sent' : ''} animate-slide-in`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  <div className="whatsapp-bubble-time">
                    {msg.time} {msg.sent && <Check size={10} style={{ display: 'inline', marginLeft: '3px', color: '#34B7F1' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEND HISTORY LOG */}
          <div className="premium-card">
            <div className="card-header" style={{ padding: '12px 20px' }}>
              <h2 style={{ fontSize: '14.5px' }}>Historial Reciente de Envíos</h2>
            </div>
            
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '12.5px' }}>
                  No se han registrado despachos en esta sesión.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} style={{ padding: '10px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{log.cliente}</div>
                      <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                        {log.mensaje}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${log.canal === 'whatsapp' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {log.canal.toUpperCase()}
                      </span>
                      <div style={{ color: '#94A3B8', fontSize: '10px', marginTop: '2px' }}>{formatDateToLocal(log.fecha)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
