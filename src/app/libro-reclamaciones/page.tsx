'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  ShieldCheck,
  Phone,
  Mail,
  Home,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Printer,
  ChevronLeft,
  Briefcase
} from 'lucide-react';

export default function LibroReclamacionesPage() {
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'DNI',
    nroDocumento: '',
    domicilio: '',
    telefono: '',
    correo: '',
    representante: '',
    tipoBien: 'SERVICIO',
    montoReclamado: '',
    descripcionBien: '',
    tipoReclamacion: 'RECLAMO',
    detalle: '',
    pedido: '',
    declaroVerdad: false
  });

  // Anti-bot state
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate simple math challenge
  const generateCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 8) + 2,
      num2: Math.floor(Math.random() * 7) + 2,
      answer: ''
    });
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check captcha
    if (parseInt(captcha.answer) !== captcha.num1 + captcha.num2) {
      setErrorMsg('Desafío anti-bots incorrecto. Por favor verifique la suma.');
      generateCaptcha();
      return;
    }

    if (!formData.declaroVerdad) {
      setErrorMsg('Debe aceptar la declaración bajo juramento.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reclamaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessData(data.reclamacion);
      } else {
        setErrorMsg(data.error || 'Error al enviar la reclamación.');
      }
    } catch (err) {
      setErrorMsg('Error de red al registrar la reclamación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // SUCCESS SCREEN
  if (successData) {
    const claimDate = new Date(successData.created_at || new Date());
    const dateFormatted = `${String(claimDate.getDate()).padStart(2, '0')}/${String(claimDate.getMonth() + 1).padStart(2, '0')}/${claimDate.getFullYear()}`;

    return (
      <div className="reclamacion-success-page">
        <div className="success-card">
          
          <div className="success-header no-print">
            <CheckCircle size={56} className="text-success animate-bounce" />
            <h1>¡Reclamación Registrada!</h1>
            <div className="claim-code">{successData.id}</div>
            <p className="subtitle">Conserve este número para el seguimiento de su solicitud.</p>
          </div>

          <div className="success-body no-print">
            <div className="info-box">
              <h3>Estimado(a) {successData.nombres} {successData.apellidos},</h3>
              <p>Su hoja de reclamación ha sido registrada de forma exitosa en el Libro de Reclamaciones Virtual de <strong>Optimus Systems & Process EIRL</strong>.</p>
              <p>Se ha guardado una copia en la base de datos de <strong>InsureONE</strong> para su respectiva atención legal.</p>
              <p className="legal-notice">
                ⚠️ Conforme a la legislación peruana vigente (INDECOPI), daremos respuesta a su solicitud en un plazo máximo e improrrogable de <strong>quince (15) días hábiles</strong>.
              </p>
            </div>
          </div>

          {/* Printable Document Preview (Matches the INDECOPI structure) */}
          <div className="printable-claim-section">
            <div className="print-header-top">
              <div className="print-brand-title">LIBRO DE RECLAMACIONES VIRTUAL</div>
              <div className="print-company-details">
                <strong>Optimus Systems & Process EIRL</strong><br />
                RUC: 20600259751
              </div>
            </div>
            
            <div className="print-divider"></div>
            
            <div className="print-title-section">
              <div className="print-title-left">
                <h2>HOJA DE RECLAMACIÓN</h2>
                <p className="print-address-sub">Calle Españoleto 141 Dpto 102, San Borja, Lima-Perú</p>
              </div>
              <div className="print-title-right">
                <div className="print-number-box">
                  <div><strong>N° RECLAMO:</strong> {successData.id}</div>
                  <div className="mt-1"><strong>Fecha:</strong> {dateFormatted}</div>
                </div>
              </div>
            </div>
            
            <p className="print-legal-italic">
              Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, esta institución cuenta con un Libro de Reclamaciones a su disposición.
            </p>
            
            <div className="print-section-title">👤 1. IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE</div>
            <div className="print-fields-container">
              <div className="print-row-2">
                <div className="print-cell">
                  <label>Nombres</label>
                  <div className="print-value">{successData.nombres}</div>
                </div>
                <div className="print-cell">
                  <label>Apellidos</label>
                  <div className="print-value">{successData.apellidos}</div>
                </div>
              </div>
              
              <div className="print-row-2">
                <div className="print-cell">
                  <label>Tipo Documento</label>
                  <div className="print-value">{successData.tipo_documento}</div>
                </div>
                <div className="print-cell">
                  <label>Número Documento</label>
                  <div className="print-value">{successData.nro_documento}</div>
                </div>
              </div>
              
              <div className="print-row-1">
                <div className="print-cell">
                  <label>Domicilio</label>
                  <div className="print-value">{successData.domicilio}</div>
                </div>
              </div>
              
              {successData.representante && (
                <div className="print-row-1">
                  <div className="print-cell">
                    <label>Representante Legal (Apoderado/Tutor)</label>
                    <div className="print-value">{successData.representante}</div>
                  </div>
                </div>
              )}
              
              <div className="print-row-2">
                <div className="print-cell">
                  <label>Teléfono / Celular</label>
                  <div className="print-value">{successData.telefono}</div>
                </div>
                <div className="print-cell">
                  <label>Correo Electrónico</label>
                  <div className="print-value">{successData.correo}</div>
                </div>
              </div>
            </div>
            
            <div className="print-section-title">👜 2. IDENTIFICACIÓN DEL BIEN CONTRATADO</div>
            <div className="print-fields-container">
              <div className="print-row-2">
                <div className="print-cell print-radio-cell">
                  <label>Tipo de Bien</label>
                  <div className="print-radio-options">
                    <span className="print-radio-item">
                      <span className={`print-radio-dot ${successData.tipo_bien === 'PRODUCTO' ? 'selected' : ''}`}></span>
                      PRODUCTO
                    </span>
                    <span className="print-radio-item" style={{ marginLeft: '25px' }}>
                      <span className={`print-radio-dot ${successData.tipo_bien === 'SERVICIO' ? 'selected' : ''}`}></span>
                      SERVICIO
                    </span>
                  </div>
                </div>
                <div className="print-cell">
                  <label>Monto Reclamado</label>
                  <div className="print-value">S/. {Number(successData.monto_reclamado).toFixed(2)}</div>
                </div>
              </div>
              
              <div className="print-row-1">
                <div className="print-cell">
                  <label>Descripción del Bien</label>
                  <div className="print-value textarea-style">{successData.descripcion_bien}</div>
                </div>
              </div>
            </div>
            
            <div className="print-section-title">📄 3. DETALLE DE LA RECLAMACIÓN Y PEDIDO</div>
            <div className="print-fields-container">
              <div className="print-row-1">
                <div className="print-cell print-radio-cell">
                  <label>Tipo de Registro</label>
                  <div className="print-radio-options-desc">
                    <div className="print-radio-desc-item">
                      <span className={`print-radio-dot ${successData.tipo_reclamacion === 'RECLAMO' ? 'selected' : ''}`}></span>
                      <div>
                        <strong>RECLAMO</strong>
                        <span className="print-desc-small">Disconformidad relacionada a los productos o servicios.</span>
                      </div>
                    </div>
                    <div className="print-radio-desc-item" style={{ marginTop: '6px' }}>
                      <span className={`print-radio-dot ${successData.tipo_reclamacion === 'QUEJA' ? 'selected' : ''}`}></span>
                      <div>
                        <strong>QUEJA</strong>
                        <span className="print-desc-small">Insatisfacción respecto a la atención o servicio general.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="print-row-1">
                <div className="print-cell">
                  <label>Detalle y Sustento de la Reclamación</label>
                  <div className="print-value textarea-style" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                    {successData.detalle}
                  </div>
                </div>
              </div>
              
              <div className="print-row-1">
                <div className="print-cell">
                  <label>Pedido o Solicitud del Consumidor</label>
                  <div className="print-value textarea-style" style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                    {successData.pedido}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="print-signature-section">
              <div className="print-sig-col">
                <div className="print-sig-line"></div>
                <div className="print-sig-label">
                  <strong>FIRMA DEL CONSUMIDOR</strong><br />
                  (En caso de presentación física)
                </div>
              </div>
              <div className="print-date-col">
                <div className="print-date-boxes">
                  <span className="print-date-val">{String(claimDate.getDate()).padStart(2, '0')}</span> / <span className="print-date-val">{String(claimDate.getMonth() + 1).padStart(2, '0')}</span> / <span className="print-date-val">{claimDate.getFullYear()}</span>
                </div>
                <div className="print-date-label">FECHA DE RECEPCIÓN</div>
              </div>
            </div>
            
            <div className="print-footer">
              <div className="print-footer-title">INSUREONE</div>
              <div className="print-footer-address">
                Calle Españoleto 141 Dpto 102, San Borja, Lima-Perú | Optimus Systems & Process EIRL
              </div>
              <div className="print-footer-bottom">LIBRO DE RECLAMACIONES CONFORME AL D.S. 011-2011-PCM</div>
            </div>
          </div>

          <div className="success-footer no-print">
            <button className="btn btn-secondary flex-align" onClick={handlePrint}>
              <Printer size={16} /> Imprimir Hoja
            </button>
            <button className="btn btn-primary" onClick={() => router.push('/login')}>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // COMPLAINT ENTRY FORM
  return (
    <div className="libro-reclamaciones-page">
      <div className="form-card animate-fade-in">
        
        <div className="form-header">
          <button 
            type="button" 
            className="back-btn" 
            onClick={() => router.push('/login')}
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <h1>Libro de Reclamaciones Virtual</h1>
          <p className="subtitle">Hoja de Reclamación Conforme al D.S. 011-2011-PCM</p>
        </div>

        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* SECTION 1: CONSUMER DATA */}
          <section className="form-section">
            <div className="section-header">
              <User size={18} className="icon-blue" />
              <h3>1. Identificación del Consumidor Reclamante</h3>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nombres *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tipo Documento *</label>
                <select
                  className="form-input"
                  value={formData.tipoDocumento}
                  onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                  required
                >
                  <option value="DNI">DNI (Persona Natural)</option>
                  <option value="CE">CE (Carnet de Extranjería)</option>
                  <option value="RUC">RUC (Persona Jurídica)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Número Documento *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nroDocumento}
                  onChange={(e) => setFormData({ ...formData, nroDocumento: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Domicilio *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Av. Larco 123, Dpto 202, Miraflores, Lima"
                value={formData.domicilio}
                onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Representante Legal (Solo en caso de menores de edad o apoderados)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombres y Apellidos del Padre/Madre/Tutor"
                value={formData.representante}
                onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Teléfono / Celular *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  required
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: PRODUCT/SERVICE DATA */}
          <section className="form-section">
            <div className="section-header">
              <Briefcase size={18} className="icon-blue" />
              <h3>2. Identificación del Bien Contratado</h3>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tipo de Bien *</label>
                <div className="radio-group">
                  <label className={`radio-label ${formData.tipoBien === 'PRODUCTO' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="tipoBien"
                      checked={formData.tipoBien === 'PRODUCTO'}
                      onChange={() => setFormData({ ...formData, tipoBien: 'PRODUCTO' })}
                    />
                    Producto
                  </label>
                  <label className={`radio-label ${formData.tipoBien === 'SERVICIO' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="tipoBien"
                      checked={formData.tipoBien === 'SERVICIO'}
                      onChange={() => setFormData({ ...formData, tipoBien: 'SERVICIO' })}
                    />
                    Servicio (InsureONE SaaS)
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Monto Reclamado (S/. PEN - Estimado) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.montoReclamado}
                  onChange={(e) => setFormData({ ...formData, montoReclamado: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción detallada del Bien contratado *</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Indique detalles del servicio (Ej. Licencia de software, plan de suscripción, póliza contratada) respecto al cual presenta disconformidad..."
                value={formData.descripcionBien}
                onChange={(e) => setFormData({ ...formData, descripcionBien: e.target.value })}
                required
              />
            </div>
          </section>

          {/* SECTION 3: DETALLE RECLAMACION */}
          <section className="form-section">
            <div className="section-header">
              <FileText size={18} className="icon-blue" />
              <h3>3. Detalle de la Reclamación y Pedido</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Registro *</label>
              <div className="radio-group-vertical">
                <label className="radio-vertical-item">
                  <input
                    type="radio"
                    name="tipoReclamacion"
                    checked={formData.tipoReclamacion === 'RECLAMO'}
                    onChange={() => setFormData({ ...formData, tipoReclamacion: 'RECLAMO' })}
                  />
                  <div>
                    <strong>Reclamo</strong>
                    <small>Disconformidad relacionada directamente a los planes, cuotas o cobros del sistema.</small>
                  </div>
                </label>
                <label className="radio-vertical-item mt-2">
                  <input
                    type="radio"
                    name="tipoReclamacion"
                    checked={formData.tipoReclamacion === 'QUEJA'}
                    onChange={() => setFormData({ ...formData, tipoReclamacion: 'QUEJA' })}
                  />
                  <div>
                    <strong>Queja</strong>
                    <small>Descontento respecto al servicio al cliente, soporte o desatención de la plataforma.</small>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detalle y Sustento del Reclamo o Queja *</label>
              <textarea
                rows={4}
                className="form-input"
                placeholder="Describa de forma clara los inconvenientes experimentados con el sistema de corretaje o soporte..."
                value={formData.detalle}
                onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pedido o Solicitud del Consumidor *</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Escriba la solución concreta que solicita..."
                value={formData.pedido}
                onChange={(e) => setFormData({ ...formData, pedido: e.target.value })}
                required
              />
            </div>
          </section>

          {/* ANTI-BOT CHALLENGE */}
          <section className="form-section captcha-section">
            <div className="section-header">
              <ShieldCheck size={18} className="icon-blue" />
              <h3>Seguridad Anti-Bots</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Resuelva este desafío matemático simple para confirmar que es humano:</label>
              <div className="captcha-container">
                <span className="captcha-math">{captcha.num1} + {captcha.num2} =</span>
                <input
                  type="text"
                  className="form-input captcha-input"
                  placeholder="?"
                  value={captcha.answer}
                  onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value })}
                  required
                />
              </div>
            </div>
          </section>

          {/* OATH CHECKBOX */}
          <div className="form-checkbox-wrapper statement-box">
            <input
              type="checkbox"
              id="declaroVerdad"
              checked={formData.declaroVerdad}
              onChange={(e) => setFormData({ ...formData, declaroVerdad: e.target.checked })}
              required
            />
            <label htmlFor="declaroVerdad" className="checkbox-label">
              <strong>Declaración bajo juramento:</strong> Declaro ser el titular del reclamo respecto al servicio de <strong>InsureONE</strong> y que los datos consignados en la presente hoja de reclamación son verdaderos y de total conformidad con el Código de Protección y Defensa del Consumidor de Perú.
            </label>
          </div>

          {/* ACTIONS */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-glow btn-lg font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando Reclamación...' : 'Enviar Hoja de Reclamación'}
            </button>
          </div>

        </form>
      </div>

      {/* SCOPED COMPLAINTS STYLES */}
      <style jsx>{`
        .libro-reclamaciones-page {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1f2937 100%);
          padding: 3rem 1.5rem;
          box-sizing: border-box;
        }

        .form-card {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          width: 100%;
          max-width: 760px;
          color: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-sizing: border-box;
        }

        .form-header {
          position: relative;
          margin-bottom: 2rem;
          text-align: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 1.25rem;
        }

        .back-btn {
          position: absolute;
          left: 0;
          top: 0;
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
          transition: opacity 0.2s;
        }

        .back-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .form-header h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1.5rem;
          font-family: 'Outfit', sans-serif;
        }

        .subtitle {
          color: #64748b;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .form-section {
          margin-bottom: 2.5rem;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          border-radius: 0.75rem;
          background: #f8fafc;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.25rem;
          color: #2563eb;
        }

        .section-header h3 {
          font-size: 1.1rem;
          font-weight: 750;
          color: #0f172a;
          margin: 0;
          font-family: 'Outfit', sans-serif;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.45rem;
          font-size: 0.775rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .form-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.75rem 0.85rem;
          color: #0f172a;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        /* Radio layout */
        .radio-group {
          display: flex;
          gap: 1rem;
          margin-top: 4px;
        }

        .radio-label {
          flex: 1;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 0.65rem 1rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .radio-label input[type="radio"] {
          cursor: pointer;
        }

        .radio-label.active {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.02);
          color: #2563eb;
        }

        .radio-group-vertical {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .radio-vertical-item {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          padding: 1rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .radio-vertical-item input[type="radio"] {
          margin-top: 0.2rem;
          cursor: pointer;
        }

        .radio-vertical-item strong {
          display: block;
          font-size: 0.875rem;
          color: #0f172a;
        }

        .radio-vertical-item small {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.3;
        }

        /* Captcha Math */
        .captcha-section {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .captcha-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .captcha-math {
          font-size: 1.25rem;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 2px;
          background: rgba(255,255,255,0.8);
          padding: 0.5rem 1.2rem;
          border-radius: 0.375rem;
          border: 1px solid #cbd5e1;
          user-select: none;
        }

        .captcha-input {
          width: 80px !important;
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .statement-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
        }

        .form-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
        }

        .form-checkbox-wrapper input[type="checkbox"] {
          margin-top: 0.25rem;
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        .checkbox-label {
          font-size: 0.825rem;
          color: #475569;
          line-height: 1.45;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
        }

        .btn-glow {
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .btn-glow:hover {
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
        }

        /* Success screen specifics */
        .reclamacion-success-page {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1f2937 100%);
          padding: 2rem 1.5rem;
          box-sizing: border-box;
        }

        .success-card {
          background: #ffffff;
          border-radius: 1.25rem;
          max-width: 700px;
          width: 100%;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          color: #1e293b;
          box-sizing: border-box;
        }

        .success-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .text-success {
          color: #10b981;
          margin: 0 auto 1rem auto;
        }

        .success-header h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.5rem;
          font-family: 'Outfit', sans-serif;
        }

        .claim-code {
          display: inline-block;
          background: rgba(37, 99, 235, 0.08);
          color: #2563eb;
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: 0.5px;
          border: 1px dashed rgba(37, 99, 235, 0.3);
          margin: 0.5rem 0;
        }

        .info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .info-box h3 {
          margin-top: 0;
          color: #0f172a;
          margin-bottom: 0.75rem;
        }

        .legal-notice {
          background: #fffbeb;
          color: #b45309;
          border-left: 4px solid #f59e0b;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
          margin-top: 1rem;
          font-weight: 500;
        }

        /* PREVIEW OF THE COMPLAINT PRINTABLE SHEET */
        .printable-claim-section {
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 2rem;
          margin-bottom: 2rem;
          background: #ffffff;
          color: #0f172a;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          text-align: left;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .print-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .print-brand-title {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: #0f172a;
        }

        .print-company-details {
          text-align: right;
          font-size: 0.7rem;
          color: #334155;
          line-height: 1.3;
        }

        .print-divider {
          height: 1px;
          background-color: #e2e8f0;
          margin-bottom: 1.25rem;
        }

        .print-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .print-title-left h2 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0 0 0.25rem 0;
          color: #0f172a;
          letter-spacing: 0.5px;
        }

        .print-address-sub {
          font-size: 0.7rem;
          color: #475569;
          margin: 0;
        }

        .print-title-right {
          text-align: right;
        }

        .print-number-box {
          border-left: 2px solid #cbd5e1;
          padding-left: 0.75rem;
          font-size: 0.75rem;
          line-height: 1.4;
          color: #0f172a;
          text-align: left;
        }

        .print-legal-italic {
          font-size: 0.65rem;
          font-style: italic;
          color: #475569;
          margin: 0 0 1.25rem 0;
          line-height: 1.4;
          border-bottom: 1.5px solid #0f172a;
          padding-bottom: 0.75rem;
        }

        .print-section-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #0f172a;
          border-bottom: 1px solid #94a3b8;
          padding-bottom: 0.25rem;
          margin: 1.5rem 0 0.75rem 0;
          display: flex;
          align-items: center;
        }

        .print-fields-container {
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          overflow: hidden;
          background: #ffffff;
          margin-bottom: 1rem;
        }

        .print-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #cbd5e1;
        }

        .print-row-2:last-child {
          border-bottom: none;
        }

        .print-row-1 {
          border-bottom: 1px solid #cbd5e1;
        }

        .print-row-1:last-child {
          border-bottom: none;
        }

        .print-cell {
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #cbd5e1;
        }

        .print-cell:last-child {
          border-right: none;
        }

        .print-cell label {
          font-size: 0.6rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
          letter-spacing: 0.5px;
        }

        .print-value {
          font-size: 0.8rem;
          font-weight: 500;
          color: #0f172a;
          min-height: 1.2rem;
        }

        .textarea-style {
          line-height: 1.5;
          font-size: 0.75rem;
          color: #1e293b;
        }

        .print-radio-cell {
          justify-content: center;
        }

        .print-radio-options {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #0f172a;
          padding: 0.25rem 0;
        }

        .print-radio-item {
          display: inline-flex;
          align-items: center;
          cursor: default;
        }

        .print-radio-dot {
          width: 12px;
          height: 12px;
          border: 2px solid #0f172a;
          border-radius: 50%;
          margin-right: 6px;
          display: inline-block;
          position: relative;
        }

        .print-radio-dot.selected::after {
          content: '';
          width: 6px;
          height: 6px;
          background: #0f172a;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .print-radio-options-desc {
          display: flex;
          flex-direction: column;
          padding: 0.25rem 0;
        }

        .print-radio-desc-item {
          display: flex;
          align-items: flex-start;
          font-size: 0.75rem;
          color: #0f172a;
        }

        .print-radio-desc-item .print-radio-dot {
          margin-top: 3px;
          flex-shrink: 0;
        }

        .print-desc-small {
          display: block;
          font-size: 0.6rem;
          font-weight: 400;
          color: #475569;
          margin-top: 1px;
          line-height: 1.3;
        }

        .print-signature-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          margin-top: 3rem;
          margin-bottom: 2rem;
        }

        .print-sig-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }

        .print-sig-line {
          width: 80%;
          height: 1px;
          background-color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .print-sig-label {
          text-align: center;
          font-size: 0.65rem;
          color: #0f172a;
          line-height: 1.4;
        }

        .print-date-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
        }

        .print-date-boxes {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          letter-spacing: 1px;
        }

        .print-date-val {
          display: inline-block;
          min-width: 25px;
          text-align: center;
        }

        .print-date-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.5px;
        }

        .print-footer {
          text-align: center;
          font-size: 0.7rem;
          color: #475569;
          margin-top: 3rem;
          border-top: 1.5px solid #0f172a;
          padding-top: 1rem;
          line-height: 1.5;
        }

        .print-footer-title {
          font-size: 0.8rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .print-footer-address {
          font-size: 0.65rem;
          color: #334155;
          margin-bottom: 4px;
        }

        .print-footer-bottom {
          font-size: 0.65rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .success-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .flex-align {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .mt-2 { margin-top: 0.5rem; }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }

        @media (max-width: 600px) {
          .grid-2 {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .form-card, .success-card {
            padding: 1.5rem;
          }
          .printable-claim-section {
            padding: 1rem;
          }
          .print-signature-section {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        /* PRINT CONFIGURATION */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .libro-reclamaciones-page {
            background: #ffffff !important;
            padding: 0 !important;
            min-height: auto !important;
            display: block !important;
          }
          .success-card {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
          }
          .no-print, .success-footer {
            display: none !important;
          }
          .printable-claim-section {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
