'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  Check,
  Lock,
  Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Wizard Steps: 'login' | 'terms' | 'profile_setup' | 'select_plan' | 'culqui_payment'
  const [step, setStep] = useState<'login' | 'terms' | 'profile_setup' | 'select_plan' | 'culqui_payment'>('login');
  
  // Login Form States
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Form States
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regPolicyAccepted, setRegPolicyAccepted] = useState(false);
  const [regError, setRegError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const [regData, setRegData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    celular: '',
    username: '',
    password: '',
    ruc: '',
    razonSocial: '',
    direccion: '',
    plan: 'mensual' // 'mensual' | 'anual'
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Culqui Payment States
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Clean error messages on step transition
  useEffect(() => {
    setLoginError('');
    setRegError('');
    setPaymentError('');
  }, [step]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPassword })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Force complete page reload to update cookie context in Next.js
        window.location.href = '/dashboard';
      } else {
        setLoginError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setLoginError('Error al conectar con el servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Profile data validation before moving to Plan selection
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regData.nombres || !regData.apellidos || !regData.correo || !regData.celular || !regData.username || !regData.password || !regData.ruc || !regData.razonSocial) {
      setRegError('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    if (regData.ruc.length !== 11) {
      setRegError('El RUC en el Perú debe constar exactamente de 11 dígitos.');
      return;
    }

    setStep('select_plan');
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(v);
    }
  };

  // Format Expiry Date (adds slash MM/YY)
  const handleCardExpiryChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue.length >= 2) {
      setCardExpiry(`${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`);
    } else {
      setCardExpiry(cleanValue);
    }
  };

  // Handle Payment Form Submit (Final Step)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setPaymentError('Número de tarjeta inválido (requiere 16 dígitos).');
      return;
    }
    if (cardExpiry.length < 5) {
      setPaymentError('Fecha de vencimiento inválida (formato MM/YY).');
      return;
    }
    if (cardCvv.length < 3) {
      setPaymentError('Código CVV inválido (mínimo 3 dígitos).');
      return;
    }
    if (!cardName) {
      setPaymentError('Nombre del titular es requerido.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Simulate Culqui API network latency
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Successfully registered and session cookie set
        window.location.href = '/dashboard';
      } else {
        setPaymentError(data.error || 'Error al procesar el registro.');
        setIsProcessingPayment(false);
      }
    } catch (err) {
      setPaymentError('Error de red al procesar el pago.');
      setIsProcessingPayment(false);
    }
  };

  const currentPrice = regData.plan === 'anual' ? '$490 USD' : '$49 USD';

  return (
    <div className="login-page">
      <div className={`login-container ${step !== 'login' ? 'register-wide' : ''}`}>
        
        {/* STEP 0: LOGIN CARD */}
        {step === 'login' && (
          <div className="login-card animate-fade-in">
            <h1 className="login-title">InsureONE</h1>
            <p className="login-subtitle">Sistema de Control de Pólizas y Cobranzas</p>
            
            {loginError && <div className="error-message">{loginError}</div>}
            
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">USUARIO</label>
                <div className="form-input-container">
                  <span className="input-icon-left"><User size={16} /></span>
                  <input
                    type="text"
                    className="form-input has-icon-left"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Introduce tu usuario o email"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">CONTRASEÑA</label>
                <div className="form-input-container">
                  <span className="input-icon-left"><Lock size={16} /></span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    className="form-input has-icon-left"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary full-width font-bold mt-2"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            
            <div className="register-option-wrapper">
              <button
                type="button"
                className="register-btn-toggle"
                onClick={() => setStep('terms')}
              >
                <UserPlus size={16} /> ¿No tienes cuenta? Crear usuario
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: TERMS AND CONDITIONS */}
        {step === 'terms' && (
          <div className="login-card animate-slide-in">
            <h2 className="register-title">
              <ShieldCheck size={24} className="icon-primary inline-icon" /> Registro en la Plataforma
            </h2>
            <p className="login-subtitle">Paso 1: Lectura y Aceptación de Políticas de la Empresa</p>
            
            <div className="document-links-box">
              <div className="doc-link-item">
                <div className="doc-details">
                  <span className="doc-icon"><FileText size={20} /></span>
                  <div>
                    <strong>Términos y Condiciones</strong>
                    <small>Sistema Web de Cotización de Importaciones</small>
                  </div>
                </div>
                <a
                  href="https://res.cloudinary.com/dsqe7utsy/image/upload/v1780280028/T%C3%A9rminos_y_Condiciones_-_Sistema_Web_de_Cotizaci%C3%B3n_de_Importaciones_spfnae.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Ver Documento
                </a>
              </div>
              
              <div className="doc-link-item">
                <div className="doc-details">
                  <span className="doc-icon"><FileText size={20} /></span>
                  <div>
                    <strong>Política de Cambios y Devoluciones</strong>
                    <small>Devoluciones y Cancelaciones - Sistema SaaS</small>
                  </div>
                </div>
                <a
                  href="https://res.cloudinary.com/dsqe7utsy/image/upload/v1780280028/Pol%C3%ADtica_de_Cambios_Devoluciones_y_Cancelaciones_-_Sistema_SaaS_tpplbe.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Ver Documento
                </a>
              </div>
            </div>
            
            <div className="checkboxes-section">
              <div className="form-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="chkTerms"
                  checked={regTermsAccepted}
                  onChange={(e) => setRegTermsAccepted(e.target.checked)}
                />
                <label htmlFor="chkTerms" className="checkbox-label">
                  He leído, comprendo y acepto en su totalidad los <strong>Términos y Condiciones</strong> de uso.
                </label>
              </div>
              
              <div className="form-checkbox-wrapper mt-3">
                <input
                  type="checkbox"
                  id="chkPolicy"
                  checked={regPolicyAccepted}
                  onChange={(e) => setRegPolicyAccepted(e.target.checked)}
                />
                <label htmlFor="chkPolicy" className="checkbox-label">
                  He leído, comprendo y acepto la <strong>Política de cambios</strong>, devoluciones y cancelaciones.
                </label>
              </div>
            </div>
            
            <div className="actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep('login')}
              >
                <ArrowLeft size={16} /> Cancelar
              </button>
              
              <button
                type="button"
                className="btn btn-primary"
                disabled={!regTermsAccepted || !regPolicyAccepted}
                onClick={() => setStep('profile_setup')}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE SETUP */}
        {step === 'profile_setup' && (
          <div className="login-card animate-slide-in">
            <h2 className="register-title">Crear Cuenta (Mi Perfil)</h2>
            <p className="login-subtitle">Paso 2: Complete sus datos personales y los de su empresa</p>
            
            {regError && <div className="error-message">{regError}</div>}
            
            <form onSubmit={handleProfileSubmit}>
              <div className="register-scroll-container">
                
                <h3 className="sub-section-title">👤 Datos Personales</h3>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombres *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regData.nombres}
                      onChange={(e) => setRegData({ ...regData, nombres: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regData.apellidos}
                      onChange={(e) => setRegData({ ...regData, apellidos: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="ejemplo@correo.com"
                      value={regData.correo}
                      onChange={(e) => setRegData({ ...regData, correo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Celular *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="999888777"
                      value={regData.celular}
                      onChange={(e) => setRegData({ ...regData, celular: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre de Usuario *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={regData.username}
                      onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña *</label>
                    <div className="form-input-container">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        className="form-input"
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        tabIndex={-1}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <h3 className="sub-section-title">🏢 Datos de su Empresa</h3>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Razón Social *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nombre Legal de la Empresa"
                      value={regData.razonSocial}
                      onChange={(e) => setRegData({ ...regData, razonSocial: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RUC (11 dígitos) *</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength={11}
                      placeholder="RUC de la empresa"
                      value={regData.ruc}
                      onChange={(e) => setRegData({ ...regData, ruc: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Dirección Fiscal</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Av. Javier Prado 123, San Isidro"
                    value={regData.direccion}
                    onChange={(e) => setRegData({ ...regData, direccion: e.target.value })}
                  />
                </div>
                
              </div>
              
              <div className="actions-row mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep('terms')}
                >
                  <ArrowLeft size={16} /> Atrás
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Crear Usuario y Continuar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SELECT PLAN */}
        {step === 'select_plan' && (
          <div className="login-card animate-slide-in">
            <h2 className="register-title">Elegir Plan de Suscripción</h2>
            <p className="login-subtitle">Paso 3: Seleccione el plan que mejor se adapte a su negocio</p>
            
            <div className="plans-grid">
              {/* PLAN MENSUAL */}
              <div 
                className={`plan-card ${regData.plan === 'mensual' ? 'selected' : ''}`}
                onClick={() => setRegData({ ...regData, plan: 'mensual' })}
              >
                <div className="plan-header">
                  <span className="plan-name">Plan Mensual</span>
                  <div className="plan-price">
                    <span className="price-amount">$49 USD</span>
                    <span className="price-period">/ mes</span>
                  </div>
                </div>
                <div className="plan-body">
                  <ul className="plan-features">
                    <li><Check size={14} className="feature-check" /> Gestión de Pólizas e Historial</li>
                    <li><Check size={14} className="feature-check" /> CRM y Seguimiento de Clientes</li>
                    <li><Check size={14} className="feature-check" /> Alertas de Vencimiento de Cuotas</li>
                    <li><Check size={14} className="feature-check" /> Soporte Estándar</li>
                  </ul>
                </div>
              </div>
              
              {/* PLAN ANUAL */}
              <div 
                className={`plan-card recommended ${regData.plan === 'anual' ? 'selected' : ''}`}
                onClick={() => setRegData({ ...regData, plan: 'anual' })}
              >
                <span className="recommended-badge">Recomendado - Ahorra 15%</span>
                <div className="plan-header">
                  <span className="plan-name">Plan Anual</span>
                  <div className="plan-price">
                    <span className="price-amount">$490 USD</span>
                    <span className="price-period">/ año</span>
                  </div>
                  <span className="save-period">(2 Meses Gratis)</span>
                </div>
                <div className="plan-body">
                  <ul className="plan-features">
                    <li><Check size={14} className="feature-check" /> Todo lo del Plan Mensual</li>
                    <li><Check size={14} className="feature-check" /> Reportes de Comisiones Avanzadas</li>
                    <li><Check size={14} className="feature-check" /> Envío de Alertas a WhatsApp</li>
                    <li><Check size={14} className="feature-check" /> Soporte Prioritario 24/7</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="actions-row mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep('profile_setup')}
              >
                <ArrowLeft size={16} /> Atrás
              </button>
              
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep('culqui_payment')}
              >
                Continuar al Pago <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CULQUI PAYMENT GATEWAY */}
        {step === 'culqui_payment' && (
          <div className="login-card animate-slide-in">
            <div className="culqui-logo-container">
              {/* Culqui custom SVG logo */}
              <svg width="120" height="32" viewBox="0 0 100 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 4.5 C7.5 4.5, 4.5 7.5, 4.5 12.5 C4.5 17.5, 7.5 20.5, 12.5 20.5 C16.5 20.5, 19.5 18.5, 20 14 L15 14 C14.5 15, 13.5 15.5, 12.5 15.5 C10.5 15.5, 9.5 14.5, 9.5 12.5 C9.5 10.5, 10.5 9.5, 12.5 9.5 C13.5 9.5, 14.5 10, 15 11 L20 11 C19.5 6.5, 16.5 4.5, 12.5 4.5 Z" fill="#00D2C4" />
                <path d="M28 4.5 L28 15 C28 17, 29 18, 31 18 C33 18, 34 17, 34 15 L34 4.5 L39 4.5 L39 15 C39 20, 35.5 22.5, 31 22.5 C26.5 22.5, 23 20, 23 15 L23 4.5 L28 4.5 Z" fill="#4f46e5" />
                <path d="M46 4.5 L46 22 L56 22 L56 17.5 L51 17.5 L51 4.5 L46 4.5 Z" fill="#4f46e5" />
                <path d="M63 4.5 L63 22 L72 22 L72 17.5 L68 17.5 L68 4.5 L63 4.5 Z" fill="#4f46e5" />
                <path d="M78 4.5 L78 22 L83 22 L83 4.5 L78 4.5 Z" fill="#4f46e5" />
              </svg>
            </div>
            <p className="login-subtitle">Paso 4: Ingrese su tarjeta para procesar el pago de {currentPrice}</p>
            
            {paymentError && <div className="error-message">{paymentError}</div>}
            
            {/* Interactive Credit Card Graphic */}
            <div className={`interactive-card ${isCardFlipped ? 'flipped' : ''}`}>
              <div className="card-front">
                <div className="card-chip"></div>
                <div className="card-number-display">{cardNumber || '•••• •••• •••• ••••'}</div>
                <div className="card-holder-display">
                  <span className="card-label font-bold">TITULAR</span>
                  <div className="card-value">{cardName.toUpperCase() || 'NOMBRE APELLIDO'}</div>
                </div>
                <div className="card-expiry-display">
                  <span className="card-label font-bold">VENCE</span>
                  <div className="card-value">{cardExpiry || 'MM/YY'}</div>
                </div>
                <div className="card-brand">VISA</div>
              </div>
              
              <div className="card-back">
                <div className="card-magnetic-strip"></div>
                <div className="card-signature-box">
                  <div className="card-cvv-display">{cardCvv || '•••'}</div>
                </div>
                <div className="card-back-text">Esta tarjeta es simulada para entorno de pruebas.</div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label className="form-label">Número de Tarjeta *</label>
                <div className="form-input-container">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    onFocus={() => setIsCardFlipped(false)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Vencimiento (MM/YY) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => handleCardExpiryChange(e.target.value)}
                    onFocus={() => setIsCardFlipped(false)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CVV *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setIsCardFlipped(true)}
                    onBlur={() => setIsCardFlipped(false)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Nombre del Titular *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="NOMBRE APELLIDO EN LA TARJETA"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  onFocus={() => setIsCardFlipped(false)}
                  required
                />
              </div>

              <div className="actions-row mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep('select_plan')}
                  disabled={isProcessingPayment}
                >
                  <ArrowLeft size={16} /> Atrás
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary btn-glow"
                  disabled={isProcessingPayment}
                >
                  <CreditCard size={16} /> 
                  {isProcessingPayment ? 'Procesando pago seguro...' : `Pagar ahora (${currentPrice})`}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* COMPREHENSIVE FOOTER */}
        <footer className="login-footer">
          <div className="footer-details">
            <span className="company-name">Optimus Systems & Process EIRL</span>
            <span className="divider">|</span>
            <span className="contact-item">📞 +51 981 519 853</span>
            <span className="divider">|</span>
            <span className="contact-item">✉️ martin.grillo@optimussp.com</span>
            <span className="divider">|</span>
            <span className="address-item">📍 Calle Españoleto 141 Dpto 102, San Borja, Lima-Perú</span>
          </div>
          <div className="footer-links">
            <button 
              type="button" 
              className="book-link"
              onClick={() => router.push('/libro-reclamaciones')}
            >
              📖 Libro de Reclamaciones
            </button>
          </div>
        </footer>

      </div>
      
      {/* SCOPED STYLING FOR PREMIUM LOGIN AND REGISTER EXPERIENCE */}
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1f2937 100%);
          padding: 2rem 1.5rem;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          transition: max-width 0.3s ease;
        }

        .login-container.register-wide {
          max-width: 620px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.98);
          padding: 2.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          width: 100%;
          color: #1e293b;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-sizing: border-box;
        }

        .login-title {
          text-align: center;
          color: #4f46e5;
          margin-bottom: 0.35rem;
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          font-family: 'Outfit', sans-serif;
        }

        .register-title {
          text-align: center;
          color: #4f46e5;
          margin-bottom: 0.35rem;
          font-size: 1.6rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: 'Outfit', sans-serif;
        }

        .login-subtitle {
          text-align: center;
          color: #64748b;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.45rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.5px;
        }

        .form-input-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
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
        }

        .form-input.has-icon-left {
          padding-left: 2.5rem;
        }

        .form-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .input-icon-left {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }

        .password-toggle-btn:hover {
          color: #4f46e5;
        }

        .full-width {
          width: 100%;
        }

        .font-bold {
          font-weight: 700;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1.25rem;
          font-size: 0.825rem;
          text-align: center;
          font-weight: 600;
        }

        /* Register flow specifics */
        .document-links-box {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .doc-link-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.875rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .doc-link-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .doc-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .doc-icon {
          font-size: 1.5rem;
          color: #4f46e5;
        }

        .doc-details strong {
          display: block;
          font-size: 0.875rem;
          color: #0f172a;
        }

        .doc-details small {
          font-size: 0.725rem;
          color: #64748b;
          display: block;
        }

        .checkboxes-section {
          margin-bottom: 2rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1.25rem;
          border-radius: 0.75rem;
        }

        .form-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
        }

        .form-checkbox-wrapper input[type="checkbox"] {
          margin-top: 0.25rem;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 0.825rem;
          color: #475569;
          line-height: 1.4;
          cursor: pointer;
        }

        .actions-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .register-scroll-container {
          max-height: 48vh;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .sub-section-title {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.35rem;
          margin: 1.5rem 0 1rem 0;
          font-weight: 700;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .register-option-wrapper {
          margin-top: 1.5rem;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 1.25rem;
        }

        .register-btn-toggle {
          background: none;
          border: none;
          color: #4f46e5;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          margin: 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: opacity 0.2s;
        }

        .register-btn-toggle:hover {
          opacity: 0.85;
          text-decoration: underline;
        }

        /* Plans Grid */
        .plans-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin: 1.5rem 0;
        }

        .plan-card {
          border: 2px solid #cbd5e1;
          border-radius: 0.75rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.25s ease;
          background: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .plan-card:hover {
          border-color: #4f46e5;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .plan-card.selected {
          border-color: #4f46e5;
          background: rgba(79, 70, 229, 0.02);
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1);
        }

        .plan-card.recommended {
          border-color: #cbd5e1;
        }

        .plan-card.recommended.selected {
          border-color: #00d2c4;
          background: rgba(0, 210, 196, 0.01);
        }

        .recommended-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #00d2c4 0%, #4f46e5 100%);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .plan-header {
          text-align: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1rem;
        }

        .plan-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          display: block;
        }

        .plan-price {
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          align-items: baseline;
        }

        .price-amount {
          font-size: 1.75rem;
          font-weight: 800;
          color: #4f46e5;
        }

        .plan-card.recommended.selected .price-amount {
          color: #00d2c4;
        }

        .price-period {
          font-size: 0.875rem;
          color: #64748b;
          margin-left: 2px;
        }

        .save-period {
          font-size: 0.75rem;
          font-weight: 700;
          color: #10b981;
          display: block;
          margin-top: 2px;
        }

        .plan-body {
          flex: 1;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .plan-features li {
          font-size: 0.8rem;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .feature-check {
          color: #10b981;
          flex-shrink: 0;
        }

        /* Culqui Payment Page Specifics */
        .culqui-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        /* Interactive Credit Card Graphic */
        .interactive-card {
          width: 100%;
          max-width: 340px;
          height: 190px;
          perspective: 1000px;
          margin: 0 auto 2rem auto;
          position: relative;
        }

        .interactive-card.flipped .card-front {
          transform: rotateY(180deg);
        }

        .interactive-card.flipped .card-back {
          transform: rotateY(0deg);
        }

        .card-front, .card-back {
          width: 100%;
          height: 100%;
          border-radius: 0.75rem;
          position: absolute;
          top: 0;
          left: 0;
          backface-visibility: hidden;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          color: #ffffff;
          padding: 1.25rem 1.5rem;
          box-sizing: border-box;
          box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        }

        .card-front {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%);
          transform: rotateY(0deg);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-back {
          background: linear-gradient(135deg, #4f46e5 0%, #312e81 60%, #1e1b4b 100%);
          transform: rotateY(-180deg);
          padding: 1.25rem 0; /* Signature strip needs to go full width */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-chip {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 6px;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);
        }

        .card-number-display {
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.25rem;
          letter-spacing: 2px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          margin: 1rem 0;
          white-space: nowrap;
        }

        .card-holder-display {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          max-width: 70%;
          overflow: hidden;
        }

        .card-expiry-display {
          position: absolute;
          right: 1.5rem;
          bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .card-label {
          font-size: 0.55rem;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .card-value {
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .card-brand {
          position: absolute;
          top: 1.25rem;
          right: 1.5rem;
          font-size: 1.25rem;
          font-weight: 850;
          font-style: italic;
          opacity: 0.8;
        }

        .card-magnetic-strip {
          height: 38px;
          background: #000000;
          width: 100%;
          margin-top: 8px;
        }

        .card-signature-box {
          background: #e2e8f0;
          height: 32px;
          width: 80%;
          margin: 0 auto;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 0 10px;
          box-sizing: border-box;
        }

        .card-cvv-display {
          color: #0f172a;
          font-family: 'Courier New', Courier, monospace;
          font-weight: 700;
          font-style: italic;
          letter-spacing: 1px;
          font-size: 0.95rem;
        }

        .card-back-text {
          font-size: 0.55rem;
          text-align: center;
          color: #cbd5e1;
          padding: 0 1.5rem;
        }

        /* PIE DE PÁGINA (Footer) */
        .login-footer {
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          width: 100%;
        }

        .footer-details {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.35rem 0.5rem;
        }

        .company-name {
          font-weight: 700;
          color: #cbd5e1;
        }

        .divider {
          color: #475569;
        }

        .contact-item, .address-item {
          white-space: nowrap;
        }

        .footer-links {
          margin-top: 0.25rem;
          display: flex;
          justify-content: center;
        }

        .book-link {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          padding: 0.35rem 1rem;
          border-radius: 99px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.725rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .book-link:hover {
          background: rgba(245, 158, 11, 0.15);
          border-color: #f59e0b;
          transform: translateY(-1px);
        }

        /* Custom buttons, borders, animations */
        .border-top {
          border-top: 1px solid #e2e8f0;
        }

        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1.5rem; }
        .pt-3 { padding-top: 0.75rem; }
        .inline-icon {
          vertical-align: middle;
        }
        .icon-primary {
          color: #4f46e5;
        }

        .btn-glow {
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
        }

        .btn-glow:hover {
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 600px) {
          .grid-2, .plans-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .login-card {
            padding: 1.5rem;
          }
          .footer-details {
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
          }
          .divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
