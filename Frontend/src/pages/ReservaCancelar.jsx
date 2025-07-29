import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DOMINIO_BACKEND } from "../config/config.js";
import { useTranslation } from 'react-i18next';

export default function CancelarReserva() {
  const [searchParams] = useSearchParams();
  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const { t } = useTranslation()

  // Obtener los parámetros de la URL
  const eventId = searchParams.get("eventId");
  const calendarId = searchParams.get("calendarId");
  const numero = searchParams.get("numero");

  // Cargar los detalles de la reserva
  useEffect(() => {
    const cargarDetallesReserva = async () => {
      if (!eventId || !calendarId || !numero) {
        setError("Faltan parámetros requeridos: eventId, calendarId y numero.");
        setCargando(false);
        return;
      }
      try {
        // Llamada al backend para obtener detalles de la reserva
        const response = await fetch(`${DOMINIO_BACKEND}/reservas/detalles?eventId=${eventId}&calendarId=${calendarId}`);
        const data = await response.json();
        if (data.status === "success") {
          setReserva(data.reserva);
        } else {
          setError(data.message || "No se pudieron obtener los detalles de la reserva.");
        }
      } catch (err) {
        setError("Error al cargar los detalles de la reserva. Por favor, inténtalo de nuevo.");
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarDetallesReserva();
  }, [eventId, calendarId, numero]);

  // Mostrar confirmación antes de cancelar
  const mostrarConfirmacion = () => {
    setConfirmando(true);
  };

  // Cancelar la reserva
  const handleCancelar = async () => {
    setCancelando(true);
    setMensaje("");
    setError("");
    try {
      // Construir URL con query params
      const queryParams = new URLSearchParams({
        calendarId,
        numero,
        ...(motivoCancelacion && {
          motivo: motivoCancelacion
        })
      }).toString();

      // Enviar solicitud de cancelación al backend
      const response = await fetch(`${DOMINIO_BACKEND}/reservas/cancelar/${eventId}?${queryParams}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.status === "success") {
        setMensaje('reserva-cancelada-long');
        setConfirmando(false);
      } else {
        setError(data.message || "Ocurrió un error al cancelar la reserva.");
        setConfirmando(false);
      }
    } catch (err) {
      setError("Error al procesar la cancelación. Por favor, inténtalo de nuevo.");
      console.error(err);
    } finally {
      setCancelando(false);
    }
  };

  // Renderizado para estado de carga
  if (cargando) {
    return <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-primary" role={t("status")}>
        <span className="visually-hidden">{t("cargando")}</span>
      </div>
    </div>;
  }

  // Renderizado para mensaje de error
  if (error) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_1")}</div>
              <h3 className="text-danger mb-3">{t("error")}</h3>
              <p className="lead">{error}</p>
              <button onClick={() => window.close()} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Renderizado para mensaje de éxito
  if (mensaje) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_2")}</div>
              <h3 className="text-success mb-3">{t("reserva-cancelada")}</h3>
              <p className="lead">{t(mensaje)}</p>
              <p>{t("se-ha-enviado-una-confirmacion-a-tu-numero-de-what")}</p>
              <button onClick={() => window.close()} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Validar si hay datos de reserva
  if (!reserva) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_6")}</div>
              <h3 className="text-warning mb-3">{t("informacion-no-disponible")}</h3>
              <p className="lead">{t("no-se-encontraron-datos-de-la-reserva")}</p>
              <button onClick={() => window.close()} className="btn btn-primary mt-3">{t("cerrar")}</button>
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
                <div className="display-1">{t("key_6")}</div>
                <h3 className="text-warning">{t("confirmar-cancelacion")}</h3>
              </div>
              <p className="lead text-center mb-4">{t("estas-seguro-que-deseas-cancelar-esta-partida")}</p>

              <div className="mb-3">
                <label className="form-label">{t("motivo-de-la-cancelacion-opcional")}</label>
                <textarea className="form-control" rows={t("3")} value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} placeholder={t("por-ejemplo-no-puedo-asistir-tengo-un-compromiso")}></textarea>
              </div>

              <div className="d-grid gap-2">
                <button className="btn btn-danger" onClick={handleCancelar} disabled={cancelando}>
                  {cancelando ? t('http-procesando') : t('btn-confirmar-cancelacion')}
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmando(false)} disabled={cancelando}>{t("volver")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Pantalla principal con detalles de la reserva
  return <div className="container min-vh-100 d-flex align-items-center">
    <div className="row w-100">
      <div className="col-12 col-md-8 col-lg-6 mx-auto">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="mb-4 text-center">{t("detalles-de-la-partida-a-cancelar")}</h3>
            <ul className="list-group mb-4">
              <li className="list-group-item">{t("fecha")}{new Date(reserva.inicio).toLocaleDateString("es-ES", {
                timeZone: 'Europe/Madrid'
              })}</li>
              <li className="list-group-item">{t("hora")}{new Date(reserva.inicio).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: 'Europe/Madrid'
              })}</li>
              <li className="list-group-item">{t("nivel_3")}{reserva.nivel || "No especificado"}</li>
              <li className="list-group-item">{t("pista_1")}{reserva.pista}</li>
              <li className="list-group-item">{t("organizador")}{reserva.organizador}</li>
              <li className="list-group-item">{t("telefono_2")}{numero}</li>
            </ul>

            <div className="alert alert-warning">
              <p className="mb-1"><strong>{t("aviso-importante")}</strong></p>
              <p className="mb-0">{t("solo-puedes-cancelar-partidas-con-al-menos-5-horas")}</p>
            </div>

            <button className="btn btn-danger w-100" onClick={mostrarConfirmacion}>{t("cancelar-partida")}</button>
          </div>
        </div>
      </div>
    </div>
  </div>;
}