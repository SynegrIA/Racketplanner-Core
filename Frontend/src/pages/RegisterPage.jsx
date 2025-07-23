import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { DOMINIO_BACKEND } from "../config/config.js";
export default function RegisterPage() {
  const {
    currentTheme
  } = useTheme();
  const navigate = useNavigate();

  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [codigoPais, setCodigoPais] = useState("34"); // Por defecto España
  const [numero, setNumero] = useState("");
  const [nivel, setNivel] = useState(1);
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [frecuenciaSemanal, setFrecuenciaSemanal] = useState(3);
  const [preferencias, setPreferencias] = useState({
    mañana: false,
    tarde: false,
    noche: false
  });

  // Estado para mensajes y proceso de envío
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState(""); // "success" o "danger"
  const [registroExitoso, setRegistroExitoso] = useState(false); // Nuevo estado para controlar la visualización de la tarjeta de éxito

  // Incrementar o decrementar la frecuencia
  const ajustarFrecuencia = incremento => {
    setFrecuenciaSemanal(prev => {
      const nuevoValor = prev + incremento;
      if (nuevoValor < 1) return 1;
      if (nuevoValor > 10) return 10;
      return nuevoValor;
    });
  };

  // Cambiar una preferencia específica
  const togglePreferencia = preferencia => {
    setPreferencias(prev => ({
      ...prev,
      [preferencia]: !prev[preferencia]
    }));
  };

  // Enviar el formulario
  const handleSubmit = async e => {
    e.preventDefault();

    // Validar que al menos una preferencia esté seleccionada si las notificaciones están activas
    if (notificacionesActivas) {
      const algunaPreferenciaSeleccionada = Object.values(preferencias).some(v => v);
      if (!algunaPreferenciaSeleccionada) {
        setMensaje("Debes seleccionar al menos una preferencia horaria");
        setTipoMensaje("danger");
        return;
      }
    }

    // Validar número de teléfono (9 dígitos para España)
    if (numero.length !== 9 || !/^\d+$/.test(numero)) {
      setMensaje("El número de teléfono debe tener 9 dígitos");
      setTipoMensaje("danger");
      return;
    }
    setEnviando(true);
    setMensaje("");
    try {
      // Preparar los datos para enviar
      const datosRegistro = {
        nombre,
        telefono: `${codigoPais}${numero}`,
        nivel,
        notificaciones: notificacionesActivas,
        frecuenciaSemanal: notificacionesActivas ? frecuenciaSemanal : 0,
        preferencias: notificacionesActivas ? preferencias : {
          mañana: false,
          tarde: false,
          noche: false
        }
      };
      const response = await fetch(`${DOMINIO_BACKEND}/jugadores/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datosRegistro)
      });
      const data = await response.json();
      if (data.status === "success") {
        setRegistroExitoso(true); // Activar la tarjeta de éxito
        // Ya no redirigimos inmediatamente
      } else {
        throw new Error(data.message || "Error en el registro");
      }
    } catch (err) {
      console.error("Error en el registro:", err);
      setMensaje(err.message || "Error en el proceso de registro");
      setTipoMensaje("danger");
    } finally {
      setEnviando(false);
    }
  };

  // Función para continuar después del éxito
  const handleContinuar = () => {
    navigate("/home");
  };
  return <div className="container min-vh-100 d-flex align-items-center py-5">
            <div className="row w-100">
                <div className="col-12 col-md-8 col-lg-6 mx-auto">
                    <div className="card shadow" style={{
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
                        <div className="card-header text-center py-4" style={{
            background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
            color: '#FFFFFF',
            borderBottom: 'none'
          }}>
                            <h2 className="mb-0 fw-bold">
                                <i className="bi bi-person-plus-fill me-2"></i>
                                {registroExitoso ? "Registro completado" : "Registro de jugador"}
                            </h2>
                        </div>

                        <div className="card-body p-4">
                            {mensaje && !registroExitoso && <div className={`alert alert-${tipoMensaje} mb-4`}>
                                    {mensaje}
                                </div>}

                            {registroExitoso ?
            // Tarjeta de éxito
            <div className="text-center py-5">
                                    <div className="mb-4 d-flex justify-content-center align-items-center mx-auto" style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: currentTheme.primaryColor,
                color: 'white',
                animation: 'pulse 1.5s ease-in-out'
              }}>
                                        <i className="bi bi-check-lg" style={{
                  fontSize: '4rem'
                }}></i>
                                    </div>
                                    <h3 className="mb-3 fw-bold">{t("registro-completado-con-exito")}</h3>
                                    <p className="mb-4 fs-5 text-secondary">{t("se-enviara-un-whatsapp-de-confirmacion-al-numero")}</p>
                                    <div className="mb-4 fs-4 fw-bold">{t("key_4")}{codigoPais} {numero}
                                    </div>
                                    <p className="mb-5">{t("recibiras-notificaciones-de-partidas-disponibles-s")}</p>
                                    <button type={t("button")} className="btn btn-lg w-100" onClick={handleContinuar} style={{
                backgroundColor: currentTheme.primaryColor,
                borderColor: currentTheme.primaryColor,
                color: 'white'
              }}>
                                        <i className="bi bi-arrow-right-circle me-2"></i>{t("continuar")}</button>
                                </div> :
            // Formulario de registro (todo el contenido existente)
            <form onSubmit={handleSubmit}>
                                    {/* Nombre completo */}
                                    <div className="mb-4">
                                        <label htmlFor={t("nombre_1")} className="form-label fw-medium">
                                            <i className="bi bi-person me-2"></i>{t("nombre-completo")}</label>
                                        <input type={t("text")} className="form-control form-control-lg" id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder={t("introduce-tu-nombre-completo")} required />
                                    </div>

                                    {/* ... Resto del formulario ... */}
                                    {/* Mantener todo el código del formulario existente aquí */}

                                    {/* Teléfono con prefijo */}
                                    <div className="mb-4">
                                        <label htmlFor={t("telefono_1")} className="form-label fw-medium">
                                            <i className="bi bi-telephone me-2"></i>{t("numero-de-telefono")}</label>
                                        <div className="input-group">
                                            <select className="form-select" value={codigoPais} onChange={e => setCodigoPais(e.target.value)} style={{
                    maxWidth: "130px"
                  }}>
                                                <option value={t("34")}>{t("34_1")}</option>
                                                <option value={t("54")}>{t("54_1")}</option>
                                                <option value={t("1")}>{t("1_1")}</option>
                                                <option value={t("44")}>{t("44_1")}</option>
                                                <option value={t("49")}>{t("49_1")}</option>
                                                <option value={t("33")}>{t("33_1")}</option>
                                                <option value={t("351")}>{t("351_1")}</option>
                                                <option value={t("52")}>{t("52_1")}</option>
                                                <option value={t("55")}>{t("55_1")}</option>
                                                <option value={t("56")}>{t("56_1")}</option>
                                                <option value={t("57")}>{t("57_1")}</option>
                                                <option value={t("58")}>{t("58_1")}</option>
                                            </select>
                                            <input type={t("tel")} className="form-control" id="telefono" value={numero} onChange={e => setNumero(e.target.value.replace(/\D/g, ''))} placeholder={t("612345678")} pattern={t("0-9")} minLength={9} maxLength={9} required />
                                        </div>
                                        <div className="form-text">{t("recibiras-confirmaciones-por-whatsapp")}</div>
                                    </div>

                                    {/* Selector de Nivel */}
                                    <div className="mb-4">
                                        <label htmlFor={t("nivel_2")} className="form-label fw-medium">
                                            <i className="bi bi-bar-chart me-2"></i>{t("nivel-de-juego_1")}</label>
                                        <select className="form-select" id="nivel" value={nivel} onChange={e => setNivel(parseInt(e.target.value))} required>
                                            <option value={t("1")}>{t("nivel-1-principiante")}</option>
                                            <option value={t("2")}>{t("nivel-2-intermedio")}</option>
                                            <option value={t("3")}>{t("nivel-3-avanzado")}</option>
                                        </select>
                                        <div className="form-text">{t("selecciona-tu-nivel-actual-de-juego")}</div>
                                    </div>

                                    {/* Activar/desactivar notificaciones */}
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <label htmlFor={t("notificaciones")} className="form-label fw-medium mb-0">
                                                <i className="bi bi-bell me-2"></i>{t("notificaciones-invitaciones-partidas-abiertas")}</label>
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type={t("checkbox")} role={t("switch")} id="notificaciones" checked={notificacionesActivas} onChange={() => setNotificacionesActivas(!notificacionesActivas)} style={{
                      cursor: 'pointer',
                      backgroundColor: notificacionesActivas ? currentTheme.primaryColor : null
                    }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Opciones adicionales que aparecen solo si las notificaciones están activas */}
                                    {notificacionesActivas && <>
                                            <div className="card bg-light mb-4">
                                                <div className="card-body">
                                                    <h5 className="mb-3">{t("preferencias-de-notificaciones")}</h5>

                                                    {/* Frecuencia semanal */}
                                                    <div className="mb-4">
                                                        <label className="form-label fw-medium d-block">
                                                            <i className="bi bi-calendar-week me-2"></i>{t("frecuencia-semanal-maxima")}</label>
                                                        <div className="d-flex align-items-center">
                                                            <button type={t("button")} className="btn btn-outline-secondary" onClick={() => ajustarFrecuencia(-1)} disabled={frecuenciaSemanal <= 0}>
                                                                <i className="bi bi-dash"></i>{t("key_5")}</button>
                                                            <div className="px-4 py-2 mx-2 rounded-2 text-center fw-bold fs-5" style={{
                          minWidth: '60px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6'
                        }}>
                                                                {frecuenciaSemanal}
                                                            </div>
                                                            <button type={t("button")} className="btn btn-outline-secondary" onClick={() => ajustarFrecuencia(1)} disabled={frecuenciaSemanal >= 10}>
                                                                <i className="bi bi-plus"></i>{t("key_4")}</button>
                                                            <span className="text-muted ms-3">{t("invitacionessemana")}</span>
                                                        </div>
                                                        <div className="form-text">{t("numero-maximo-de-invitaciones-que-recibiras-por-se")}</div>
                                                    </div>

                                                    {/* Preferencias horarias */}
                                                    <div>
                                                        <label className="form-label fw-medium">
                                                            <i className="bi bi-clock me-2"></i>{t("preferencias-horarias")}</label>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            <button type={t("button")} className={`btn ${preferencias.mañana ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => togglePreferencia('mañana')} style={{
                          backgroundColor: preferencias.mañana ? currentTheme.primaryColor : 'transparent',
                          borderColor: currentTheme.primaryColor,
                          color: preferencias.mañana ? '#fff' : currentTheme.primaryColor
                        }}>
                                                                <i className={`bi bi-sunrise${preferencias.mañana ? '-fill' : ''} me-2`}></i>{t("manana-0900-1400")}</button>
                                                            <button type={t("button")} className={`btn ${preferencias.tarde ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => togglePreferencia('tarde')} style={{
                          backgroundColor: preferencias.tarde ? currentTheme.primaryColor : 'transparent',
                          borderColor: currentTheme.primaryColor,
                          color: preferencias.tarde ? '#fff' : currentTheme.primaryColor
                        }}>
                                                                <i className={`bi bi-sun${preferencias.tarde ? '-fill' : ''} me-2`}></i>{t("tarde-1500-1900")}</button>
                                                            <button type={t("button")} className={`btn ${preferencias.noche ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => togglePreferencia('noche')} style={{
                          backgroundColor: preferencias.noche ? currentTheme.primaryColor : 'transparent',
                          borderColor: currentTheme.primaryColor,
                          color: preferencias.noche ? '#fff' : currentTheme.primaryColor
                        }}>
                                                                <i className={`bi bi-moon${preferencias.noche ? '-fill' : ''} me-2`}></i>{t("noche-1900-2300")}</button>
                                                        </div>
                                                        <div className="form-text">{t("selecciona-los-momentos-del-dia-en-los-que-prefier")}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>}

                                    <button type={t("submit")} className="btn btn-success btn-lg w-100" disabled={enviando} style={{
                backgroundColor: currentTheme.primaryColor,
                borderColor: currentTheme.primaryColor
              }}>
                                        {enviando ? <>
                                                <span className="spinner-border spinner-border-sm me-2" role={t("status")} aria-hidden={t("true")}></span>{t("procesando")}</> : <>
                                                <i className="bi bi-check-circle me-2"></i>{t("completar-registro")}</>}
                                    </button>
                                </form>}
                        </div>

                        <div className="card-footer text-center py-3" style={{
            background: '#f8f9fa',
            borderTop: '1px solid rgba(0,0,0,0.05)'
          }}>
                            <p className="mb-0">
                                <i className="bi bi-shield-check me-2"></i>{t("tus-datos-estan-protegidos-y-solo-se-usaran-para-g")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
}