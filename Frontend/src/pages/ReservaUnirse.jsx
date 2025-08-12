import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DOMINIO_BACKEND, NUMBER_PREFIX } from "../config/config.js";
import { useTranslation } from 'react-i18next';
import { PASARELA } from "../config/config.js";

export default function ReservaUnirse() {
  const [searchParams] = useSearchParams();
  const [partida, setPartida] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Nuevo estado para controlar si el usuario necesita registrarse
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation()

  // Datos del formulario
  const [nombreInvitado, setNombreInvitado] = useState("");
  const [numeroInvitado, setNumeroInvitado] = useState("");
  const [codigoPais, setCodigoPais] = useState(NUMBER_PREFIX);
  // Se elimina la opción de tipo de unión, solo permitimos con notificaciones
  const tipoUnion = "new"; // Fijo a "new" = con notificaciones

  const PASARELA_ENABLED = PASARELA === 'true';
  const [paymentLink, setPaymentLink] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentReused, setPaymentReused] = useState(false);

  // Obtener parámetros de la URL
  const eventId = searchParams.get("eventId");
  const organizador = searchParams.get("nombre");
  const invitado = searchParams.get("nombreinvitado");
  const numeroOrganizador = searchParams.get("numero");
  const invitadoNumero = searchParams.get("numeroinvitado");
  const calendarId = searchParams.get("calendarId");

  // Modificar la función cargarDetallesPartida dentro del useEffect
  useEffect(() => {
    const cargarDetallesPartida = async () => {
      if (!eventId) {
        setError("Falta el identificador de la partida.");
        setCargando(false);
        return;
      }

      // Validar que también tenemos calendarId
      if (!calendarId) {
        setError("Falta el identificador del calendario.");
        setCargando(false);
        return;
      }
      if (invitado) {
        setNombreInvitado(invitado);

        // Procesamiento del número de teléfono para separar prefijo y número
        if (invitadoNumero) {
          // Prefijos comunes ordenados por longitud (de más largo a más corto)
          const prefijosPaises = ["351", "44", "34", "54", "49", "33", "52", "55", "56", "57", "58", "1"];
          let prefijo = "34"; // Por defecto España
          let numero = invitadoNumero;

          // Intentar detectar el prefijo
          for (const posiblePrefijo of prefijosPaises) {
            if (invitadoNumero.startsWith(posiblePrefijo)) {
              prefijo = posiblePrefijo;
              numero = invitadoNumero.substring(posiblePrefijo.length);
              break;
            }
          }

          // Actualizar estados
          setCodigoPais(prefijo);
          setNumeroInvitado(numero);
        }
      }
      try {
        // Incluir calendarId en la solicitud
        const response = await fetch(`${DOMINIO_BACKEND}/reservas/detalles?eventId=${encodeURIComponent(eventId)}&calendarId=${encodeURIComponent(calendarId)}`);
        if (!response.ok) {
          throw new Error("Error al obtener detalles de la partida");
        }
        if (response.status == 401) {
          throw new Error("Para unirse a una partida debe estar registrado en el sistema");
        }
        const data = await response.json();
        if (data.status === "success") {
          setPartida(data.reserva);
        } else {
          throw new Error(data.message || "No se pudo obtener información de la partida");
        }
      } catch (err) {
        console.error("Error al cargar detalles de la partida:", err);
        setError("No se pudieron cargar los detalles de la partida. Por favor, intenta de nuevo.");
      } finally {
        setCargando(false);
      }
    };
    cargarDetallesPartida();
  }, [eventId, calendarId]);

  async function generarLinkPago(eventId) {
    if (!PASARELA_ENABLED || !eventId) return;
    if (paymentLink || paymentLoading) return;
    try {
      setPaymentLoading(true);
      setPaymentError(null);
      const resp = await fetch(`${DOMINIO_BACKEND}/pagos/reserva/${encodeURIComponent(eventId)}/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enviar: true })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.message || 'error-link-pago');
      let link = null;
      let reused = false;
      if (data?.pagos?.length) {
        const numeroCompleto = `${codigoPais}${numeroInvitado}`;
        const propio = data.pagos.find(p => p.telefono === numeroCompleto) || data.pagos[0];
        link = propio?.url;
        reused = !!propio?.reused;
      } else {
        link = data.url || data.paymentLink;
        reused = !!data.reused;
      }
      if (!link) throw new Error('error-link-pago');
      setPaymentLink(link);
      setPaymentReused(reused);
    } catch (e) {
      setPaymentError(e.message || 'error-link-pago');
    } finally {
      setPaymentLoading(false);
    }
  }

  // Manejador para unirse a la partida
  const handleSubmit = e => {
    e.preventDefault();
    setConfirmando(true);
  };

  // Manejador para confirmar la unión a la partida
  const confirmarUnion = async () => {
    setEnviando(true);
    try {
      const numeroCompleto = `${codigoPais}${numeroInvitado}`;

      // Intentar hacer la solicitud al backend
      let response;
      let responseData; // Variable para almacenar los datos de la respuesta

      try {
        response = await fetch(`${DOMINIO_BACKEND}/reservas/unirse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            eventId,
            calendarId,
            nombreInvitado,
            numeroInvitado: numeroCompleto,
            organizador,
            numeroOrganizador,
            tipoUnion
          })
        });

        // Leer el cuerpo de la respuesta UNA SOLA VEZ
        responseData = await response.json();

        // Actualizar el nombre si está disponible en la respuesta
        if (responseData.nombre) {
          setNombreInvitado(responseData.nombre);
        }
      } catch (networkError) {
        // Error específico para problemas de red (incluidos CORS)
        console.error("Error de red al conectar con el servidor:", networkError);
        setError('message-union-error');

        // Establecer estado para mostrar botón de registro
        setNeedsRegistration(true);
        setConfirmando(false);
        setEnviando(false);
        return;
      }

      // Usar los datos ya leídos en lugar de volver a llamar a response.json()
      if (responseData.status === "success") {
        setMensaje(true);
        setConfirmando(false);
        // Intentar capturar link ya devuelto
        const preLink = responseData.paymentLink || responseData.linkPago;
        if (preLink) {
          setPaymentLink(preLink);
          setPaymentReused(!!responseData.paymentReused);
        } else {
          const evId = responseData.data?.eventId || responseData.eventId || eventId;
          if (PASARELA_ENABLED) generarLinkPago(evId);
        }
      } else if (responseData.status === "unauthorized") {
        // Detectar específicamente el error de usuario no registrado
        setError('message-union-error');

        // Guardar los datos del intento de unión en localStorage
        localStorage.setItem("unionPendiente", JSON.stringify({
          eventId,
          calendarId,
          nombreInvitado,
          numeroInvitado: numeroCompleto,
          organizador,
          numeroOrganizador,
          tipoUnion
        }));

        // Establecer estado para mostrar botón de registro
        setNeedsRegistration(true);
        setConfirmando(false);
      } else {
        throw new Error(responseData.message || "Ocurrió un error al unirte a la partida.");
      }
    } catch (err) {
      console.error("Error al unirse a la partida:", err);
      setError(err.message || "Error al procesar la solicitud. Por favor, intenta de nuevo.");
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  };

  // Cancelar la confirmación
  const cancelarConfirmacion = () => {
    setConfirmando(false);
  };

  // Renderizar estado de carga
  if (cargando) {
    return <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-primary" role={t("status")}>
        <span className="visually-hidden">{t("cargando")}</span>
      </div>
    </div>;
  }

  // Renderizar mensaje de error con opción de registro si es necesario
  if (error) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_1")}</div>
              <h3 className="text-danger mb-3">{t("error")}</h3>
              <p className="lead">{t(error)}</p>

              {needsRegistration ? <div className="alert alert-warning mb-3">
                <button onClick={() => navigate('/signup')} className="btn btn-outline-primary mt-2">{t("ir-a-la-pagina-de-registro")}</button>
              </div> : null}

              <button onClick={() => navigate('/home')} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Renderizar mensaje de éxito
  if (mensaje) {
    const evId = partida?.eventId || eventId;
    return (
      <div className="container min-vh-100 d-flex align-items-center">
        <div className="row w-100">
          <div className="col-12 col-md-8 col-lg-6 mx-auto">
            <div className="card shadow">
              <div className="card-body text-center">
                <div className="display-1 mb-4">{t("key_2")}</div>
                <h3 className="text-success mb-3">{t("te-has-unido-a-la-partida")}</h3>
                <p>{t("se-ha-enviado-una-confirmacion-a-tu-numero-de-what")}</p>

                {PASARELA_ENABLED && (
                  <div className="mt-3">
                    {!paymentLink && !paymentError && (
                      <button
                        className="btn btn-outline-success w-100"
                        disabled={paymentLoading}
                        onClick={() => generarLinkPago(evId)}
                      >
                        {paymentLoading ? t("generando-link-pago") : t("generar-link-pago")}
                      </button>
                    )}
                    {paymentError && (
                      <div className="alert alert-danger py-2 mt-3">
                        {t(paymentError)}
                        <div>
                          <button
                            className="btn btn-sm btn-outline-danger mt-2"
                            onClick={() => generarLinkPago(evId)}
                          >{t("reintentar")}</button>
                        </div>
                      </div>
                    )}
                    {paymentLink && (
                      <div className="alert alert-info py-2 mt-3">
                        <p className="mb-2">{paymentReused ? t("link-pago-reutilizado") : t("link-pago-disponible")}</p>
                        <button
                          className="btn btn-success w-100"
                          onClick={() => window.location.href = paymentLink}
                        >{t("ir-a-pasarela")}</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button onClick={() => navigate('/home')} className="btn btn-primary">{t("cerrar")}</button>
                  {paymentLink && (
                    <button
                      className="btn btn-outline-success"
                      onClick={() => window.location.href = paymentLink}
                    >{t("pagar")}</button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validar si hay datos de partida
  if (!partida) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_6")}</div>
              <h3 className="text-warning mb-3">{t("informacion-no-disponible")}</h3>
              <p className="lead">{t("no-se-encontraron-datos-de-la-partida")}</p>
              <button onClick={() => navigate('/home')} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Pantalla de confirmación
  if (confirmando) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="display-1">{t("key_3")}</div>
                <h3 className="text-primary">{t("confirmar-union")}</h3>
              </div>
              <p className="lead text-center mb-4">{t("estas-seguro-que-deseas-unirte-a-esta-partida")}</p>

              <ul className="list-group mb-4">
                <li className="list-group-item">{t("fecha")} {new Date(partida.inicio).toLocaleDateString("es-ES", {
                  timeZone: 'Europe/Madrid'
                })}</li>
                <li className="list-group-item">{t("hora")} {new Date(partida.inicio).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: 'Europe/Madrid'
                })}</li>
                <li className="list-group-item">{t("nivel_3")} {partida.nivel || "No especificado"}</li>
                <li className="list-group-item">{t("pista_1")} {partida.pista}</li>
                {/* <li className="list-group-item">👥 Nombre: {nombreInvitado}</li> */}
                <li className="list-group-item">{t("telefono_3")}{codigoPais} {numeroInvitado}</li>
              </ul>

              <div className="d-grid gap-2">
                <button className="btn btn-success" onClick={confirmarUnion} disabled={enviando}>
                  {enviando ? t('http-procesando') : t('btn-confirmar-union')}
                </button>
                <button className="btn btn-secondary" onClick={cancelarConfirmacion} disabled={enviando}>{t("volver")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Formulario principal para unirse
  return <div className="container min-vh-100 d-flex align-items-center">
    <div className="row w-100">
      <div className="col-12 col-md-8 col-lg-6 mx-auto">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="mb-4 text-center">{t("unete-a-la-partida")}</h3>

            {/* Detalles de la partida */}
            <ul className="list-group mb-4">
              <li className="list-group-item">{t("fecha")} {new Date(partida.inicio).toLocaleDateString("es-ES", {
                timeZone: 'Europe/Madrid'
              })}</li>
              <li className="list-group-item">{t("hora")} {new Date(partida.inicio).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: 'Europe/Madrid'
              })}</li>
              <li className="list-group-item">{t("nivel_3")} {partida.nivel || "No especificado"}</li>
              <li className="list-group-item">{t("pista_1")} {partida.pista}</li>
              <li className="list-group-item">{t("organizador")} {organizador || partida.organizador}</li>
              <li className="list-group-item">{t("jugadores-actuales")} {partida.jugadores_actuales}</li>
              <li className="list-group-item">{t("jugadores-faltantes_1")} {partida.jugadores_faltan}</li>
            </ul>

            {/* Formulario para unirse */}
            <form onSubmit={handleSubmit}>
              {invitado && <div className="mb-3">
                <label htmlFor={t("nombreinvitado")} className="form-label">{t("tu-nombre")}</label>
                <input type={t("text")} className="form-control" id="nombreInvitado" value={nombreInvitado} onChange={e => setNombreInvitado(e.target.value)} placeholder={t("tu-nombre-completo")} required />
              </div>}

              <div className="mb-4">
                <label htmlFor={t("numeroinvitado")} className="form-label">{t("tu-numero-de-telefono_1")}</label>
                <div className="input-group">
                  <select className="form-select" value={codigoPais} onChange={e => setCodigoPais(e.target.value)} style={{
                    maxWidth: "130px"
                  }}>
                    <option value={t("212")}>{t("212_1")}</option>
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
                  <input type={t("tel")} className="form-control" id="numeroInvitado" value={numeroInvitado} onChange={e => setNumeroInvitado(e.target.value)} placeholder={t("612345678")} pattern={t("0-9")} minLength={9} maxLength={9} required />
                </div>
                <div className="form-text">{t("recibiras-confirmacion-por-whatsapp")}</div>
              </div>

              <button type={t("submit")} className="btn btn-success w-100" disabled={!numeroInvitado}>{t("unirme-a-la-partida")}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>;
}