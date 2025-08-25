import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DOMINIO_BACKEND, NUMBER_PREFIX } from "../config/config.js";
import { useTranslation } from 'react-i18next';
import { PASARELA, PARTIDAS_MIXTAS_OPTION } from "../config/config.js";

export default function ReservaConfirmar() {
  const [searchParams] = useSearchParams();
  // Estado para almacenar la partida (datos estáticos)
  const [partida, setPartida] = useState(null);
  // Estados independientes para los campos de formulario
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [codigoPais, setCodigoPais] = useState(NUMBER_PREFIX);
  const [jugadoresFaltan, setJugadoresFaltan] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [enviando, setEnviando] = useState(false);
  const [esMixta, setEsMixta] = useState(true);
  // Bandera para controlar la inicialización de datos
  const [datosInicializados, setDatosInicializados] = useState(false);
  // Estado para controlar si la reserva fue confirmada exitosamente
  const [reservaConfirmada, setReservaConfirmada] = useState(false);
  // Estado para almacenar los datos de la reserva confirmada
  const [reservaData, setReservaData] = useState(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation()

  const PASARELA_ENABLED = PASARELA === 'true';
  const [paymentLink, setPaymentLink] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentReused, setPaymentReused] = useState(false);

  function resolveEventId() {
    return (
      reservaData?.eventoId ||        // backend actual
      reservaData?.eventId ||         // por si cambias
      partida?.eventoId ||
      partida?.eventId ||
      searchParams.get('eventId') ||
      null
    );
  }

  async function generarLinkPago(forcedId) {
    const realEventId = forcedId || resolveEventId();
    if (!PASARELA_ENABLED) return;
    if (!realEventId) {
      setPaymentError('error-link-sin-evento');
      return;
    }
    if (paymentLink || paymentLoading) return;
    try {
      setPaymentLoading(true);
      setPaymentError(null);
      const body = {
        enviar: true,
        totalAmountCents: 2400,
        currency: 'EUR'
      };
      const resp = await fetch(`${DOMINIO_BACKEND}/pagos/reserva/${encodeURIComponent(realEventId)}/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const raw = await resp.text();
      let data; try { data = JSON.parse(raw); } catch { data = {}; }

      if (!resp.ok) throw new Error(data.message || 'error-link-pago');

      // Nuevo: normalizar formatos posibles
      // Formato actual: { status:"success", data:[ { telefono, url, reused } ] }
      let collection = [];
      if (Array.isArray(data)) collection = data;
      else if (Array.isArray(data.data)) collection = data.data;
      else if (Array.isArray(data.pagos)) collection = data.pagos;
      else if (Array.isArray(data.links)) collection = data.links;

      let link = null;
      let reused = false;

      if (collection.length) {
        const fullPhone = `${codigoPais}${numero}`.replace(/^\+/, '');
        let propio = collection.find(p => (p.telefono || '').replace(/^\+/, '') === fullPhone);
        if (!propio) propio = collection[0];
        link = propio?.url || propio?.stripe_session_url || propio?.link;
        reused = !!propio?.reused;
      } else {
        // fallback si algún día viene como objeto
        link = data.url || data.paymentLink || data.data?.url;
        reused = !!(data.reused || data.data?.reused);
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

  useEffect(() => {
    // Solo inicializar los datos una vez
    if (!datosInicializados) {
      try {
        const data = searchParams.get("data");
        if (data) {
          const partidaData = JSON.parse(decodeURIComponent(data));
          setPartida(partidaData);
          // Inicializa los valores del formulario solo una vez
          if (partidaData.nombre) setNombre(partidaData.nombre);

          // Procesar el número de teléfono para separar prefijo si existe
          if (partidaData.numero) {
            const numStr = partidaData.numero.toString();
            // Si el número comienza con algún prefijo conocido
            if (numStr.startsWith("34")) {
              setCodigoPais("34");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("54")) {
              setCodigoPais("54");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("1")) {
              setCodigoPais("1");
              setNumero(numStr.substring(1));
            } else if (numStr.startsWith("44")) {
              setCodigoPais("44");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("49")) {
              setCodigoPais("49");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("33")) {
              setCodigoPais("33");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("351")) {
              setCodigoPais("351");
              setNumero(numStr.substring(3));
            } else if (numStr.startsWith("52")) {
              setCodigoPais("52");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("55")) {
              setCodigoPais("55");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("56")) {
              setCodigoPais("56");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("57")) {
              setCodigoPais("57");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("58")) {
              setCodigoPais("58");
              setNumero(numStr.substring(2));
            } else if (numStr.startsWith("212")) {
              setCodigoPais("212")
              setNumero(numStr.substring(3))
            } else {
              // Si no hay prefijo reconocido, establecer el número completo
              setNumero(numStr);
            }
          }

          if (partidaData.jugadores_faltan) setJugadoresFaltan(partidaData.jugadores_faltan);
        }
        // Marcar que ya se inicializaron los datos
        setDatosInicializados(true);
      } catch (e) {
        console.error("Error al parsear datos:", e);
        setDatosInicializados(true);
      }
    }
  }, [searchParams, datosInicializados, t]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!jugadoresFaltan || jugadoresFaltan === "?" || jugadoresFaltan === "") {
      setMensaje('mensaje-especificaJugadores');
      setTipoMensaje("danger");
      return;
    }
    const numeroCompleto = `${codigoPais}${numero}`;
    setEnviando(true);
    setMensaje("");
    const inicioDate = new Date(partida?.inicio);
    const finDate = new Date(inicioDate.getTime() + 90 * 60000);
    const fin = finDate.toISOString();
    let tipoPartida = partida?.partida || "abierta";
    if (jugadoresFaltan === "0") {
      tipoPartida = "completa";
    }
    try {
      // Crear objeto de datos para la reserva
      const reservaData = {
        pista: partida?.pista,
        inicio: partida?.inicio,
        fin,
        nombre,
        numero: numeroCompleto,
        partida: tipoPartida,
        jugadores_faltan: jugadoresFaltan,
        mixta: PARTIDAS_MIXTAS_OPTION ? esMixta : undefined
      };

      // Enviamos los datos al backend
      const response = await fetch(`${DOMINIO_BACKEND}/reservas/confirmar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reservaData)
      });

      // Comprobamos el código de estado primero
      if (response.status === 401) {
        // Detectar específicamente el error de usuario no registrado
        setMensaje('mensaje-401');
        setTipoMensaje("warning");

        // Guardar los datos del intento de reserva
        localStorage.setItem("reservaPendiente", JSON.stringify(reservaData));

        // Establecer estado para mostrar botón de registro
        setNeedsRegistration(true);
        return;
      }

      // Si llegamos aquí, es porque no es un 401, procesamos normalmente
      const data = await response.json();
      if (data.status === 'success') {
        const payload = data.data;
        setReservaData(payload);
        setNombre(payload.nombre);
        setMensaje('mensaje-reservaConfirmada');
        setTipoMensaje('success');
        setReservaConfirmada(true);            // <-- IMPORTANTE
        const evId = payload.eventoId || payload.eventId;
        if (PASARELA_ENABLED) await generarLinkPago(evId);
      } else {
        setMensaje('error-reserva');
        setTipoMensaje("danger");
      }
    } catch (err) {
      console.error("Error en la solicitud:", err);

      // Aquí manejamos los errores de red, incluyendo CORS
      // Para estos casos, asumimos que podría ser un 401, especialmente en producción
      if (window.location.hostname !== 'localhost') {
        setMensaje('mensaje-401');
        setTipoMensaje("warning");

        // Guardar los datos del intento de reserva
        localStorage.setItem("reservaPendiente", JSON.stringify({
          pista: partida?.pista,
          inicio: partida?.inicio,
          fin,
          nombre,
          numero: numeroCompleto,
          partida: tipoPartida,
          jugadores_faltan: jugadoresFaltan
        }));

        // Mostrar botón de registro
        setNeedsRegistration(true);
      } else {
        // Para desarrollo local, mostramos el error técnico
        setMensaje('error-reserva');
        setTipoMensaje("danger");
      }
    } finally {
      setEnviando(false);
    }
  };

  if (!partida) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_6")}</div>
              <h3 className="text-warning mb-3">{t("informacion-no-disponible")}</h3>
              <p className="lead">{t("no-se-han-recibido-datos-de-la-partida")}</p>
              <button onClick={() => navigate('/home')} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Pantalla de reserva confirmada exitosamente
  if (reservaConfirmada) {
    const evId = reservaData?.eventId || reservaData?.['ID Event'] || partida?.eventId;
    return (
      <div className="container min-vh-100 d-flex align-items-center">
        <div className="row w-100">
          <div className="col-12 col-md-8 col-lg-6 mx-auto">
            <div className="card shadow">
              <div className="card-body text-center">
                <div className="display-1 mb-4">{t("key_2")}</div>
                <div className="alert alert-success">
                  <h4 className="alert-heading">{t('reserva-confirmada')}</h4>
                  <p>{t('mensaje-reservaConfirmada')}</p>
                </div>
                <ul className="list-group mb-4 text-start">
                  <li className="list-group-item">{t("fecha")} {new Date(partida.inicio).toLocaleDateString("es-ES", { timeZone: 'Europe/Madrid' })}</li>
                  <li className="list-group-item">{t("hora")} {new Date(partida.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Madrid' })}</li>
                  <li className="list-group-item">{t("pista_1")} {partida.pista}</li>
                  <li className="list-group-item">{t("a-tu-nombre")} {nombre}</li>
                  <li className="list-group-item">{t("jugadores-que-faltan")} {jugadoresFaltan}</li>
                  {/* Mostrar el tipo de partida si la opción está habilitada */}
                  {PARTIDAS_MIXTAS_OPTION && (
                    <li className="list-group-item">
                      {t("tipo-de-partida")} {reservaData.mixta ? t("mixta") : t("restringida-por-genero")}
                    </li>
                  )}
                </ul>

                {PASARELA_ENABLED && (
                  <div className="mb-3">
                    {!paymentLink && !paymentError && (
                      <button
                        type="button"
                        className="btn btn-outline-success w-100"
                        disabled={paymentLoading}
                        onClick={() => generarLinkPago()}
                      >
                        {paymentLoading ? t('generando-link-pago') : t('generar-link-pago')}
                      </button>
                    )}
                    {paymentError && (
                      <div className="alert alert-danger py-2 mt-2">
                        {t(paymentError)}
                        <button
                          className="btn btn-sm btn-outline-danger mt-2"
                          onClick={() => generarLinkPago()}
                        >{t('reintentar')}</button>
                      </div>
                    )}
                    {paymentLink && (
                      <div className="alert alert-info py-2 mt-2">
                        <p className="mb-2">{paymentReused ? t('link-pago-reutilizado') : t('link-pago-disponible')}</p>
                        <button
                          type="button"
                          className="btn btn-success w-100"
                          onClick={() => window.location.href = paymentLink}
                        >
                          {t('ir-a-pasarela')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-center">
                  <button onClick={() => navigate('/home')} className="btn btn-primary">{t("cerrar")}</button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de confirmación de reserva
  return <div className="container min-vh-100 d-flex align-items-center">
    <div className="row w-100">
      <div className="col-12 col-md-8 col-lg-6 mx-auto">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="mb-4 text-center">{t("detalles-de-la-partida")}</h3>
            <ul className="list-group mb-4">
              <li className="list-group-item">{t("fecha")} {new Date(partida.inicio).toLocaleDateString("es-ES", {
                timeZone: 'Europe/Madrid'
              })}</li>
              <li className="list-group-item">{t("hora")} {new Date(partida.inicio).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: 'Europe/Madrid'
              })}</li>
              <li className="list-group-item">{t("pista_1") + " "}{partida.pista}</li>
              <li className="list-group-item">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">{t("jugadores-faltantes")}</div>
                  <div className="w-50">
                    <select className="form-select form-select-sm" value={jugadoresFaltan} onChange={e => setJugadoresFaltan(e.target.value)} required>
                      <option value="">{t("selecciona-cantidad")}</option>
                      <option value={t("0")}>{t("0-jugadores")}</option>
                      <option value={t("1")}>{t("1-jugador")}</option>
                      <option value={t("2")}>{t("2-jugadores")}</option>
                      <option value={t("3")}>{t("3-jugadores")}</option>
                    </select>
                  </div>
                </div>
              </li>
            </ul>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t("tu-numero-de-telefono")}</label>
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
                  <input type={t("tel")} className="form-control" value={numero} onChange={e => setNumero(e.target.value)} placeholder={t("612345678")} required />
                </div>
                <div className="form-text">{t("recibiras-notificaciones-por-whatsapp")}</div>
              </div>

              {/* Nuevo selector de tipo de partida (mixta o restringida) */}
              {PARTIDAS_MIXTAS_OPTION && (
                <div className="mb-3">
                  <label className="form-label d-flex align-items-center">
                    <i className="bi bi-people me-2"></i>{t("tipo-de-partida")}
                  </label>

                  <div className="btn-group w-100" role="group" aria-label="Tipo de partida">
                    <input
                      type="radio"
                      className="btn-check"
                      name="tipoPartida"
                      id="tipoMixta"
                      autoComplete="off"
                      checked={esMixta}
                      onChange={() => setEsMixta(true)}
                    />
                    <label
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                      htmlFor="tipoMixta"
                    >
                      <i className="bi bi-gender-ambiguous"></i>
                      <span>{t("partida-mixta")}</span>
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="tipoPartida"
                      id="tipoRestringida"
                      autoComplete="off"
                      checked={!esMixta}
                      onChange={() => setEsMixta(false)}
                    />
                    <label
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                      htmlFor="tipoRestringida"
                    >
                      <span className="d-flex align-items-center">
                        <i className="bi bi-gender-male me-1"></i>
                        <i className="bi bi-gender-female"></i>
                      </span>
                      <span>{t("partida-restringida")}</span>
                    </label>
                  </div>

                  <div className="form-text small mt-2">
                    {esMixta
                      ? t("la-partida-permite-jugadores-de-cualquier-genero")
                      : t("la-partida-solo-permite-jugadores-del-mismo-genero")}
                  </div>
                </div>
              )}

              {mensaje && tipoMensaje === "danger" && <div className={`alert alert-${tipoMensaje} mb-3`}>{t(mensaje)}</div>}

              {mensaje && tipoMensaje === "warning" && needsRegistration && <div className="alert alert-warning mb-3 text-center">
                <p>{t(mensaje)}</p>
                <div className="d-flex justify-content-center">
                  <button type={t("button")} className="btn btn-outline-primary mt-2" onClick={() => navigate("/signup")}>{t("ir-a-la-pagina-de-registro")}</button>
                </div>
              </div>}

              <button className="btn btn-success w-100" disabled={enviando}>
                {enviando ? t('http-enviando') : t('btn-confirmarReserva')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>;
}