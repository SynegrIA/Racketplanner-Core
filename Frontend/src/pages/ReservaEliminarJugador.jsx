import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DOMINIO_BACKEND } from "../config/config.js";
import { useTranslation } from 'react-i18next';

export default function ReservaEliminarJugador() {
  const [searchParams] = useSearchParams();
  const [partida, setPartida] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState("");
  const { t } = useTranslation()

  // Obtener parámetros de la URL
  const eventId = searchParams.get("eventId");
  const partidaId = searchParams.get("partidaId");
  const calendarId = searchParams.get("calendarId");
  const numero = searchParams.get("numero");

  // Cargar detalles de la partida al montar el componente
  useEffect(() => {
    const cargarDetallesPartida = async () => {
      if (!eventId || !calendarId) {
        setError("Faltan parámetros necesarios para identificar la partida.");
        setCargando(false);
        return;
      }
      try {
        const response = await fetch(`${DOMINIO_BACKEND}/reservas/detalles?eventId=${encodeURIComponent(eventId)}&calendarId=${encodeURIComponent(calendarId)}`);
        if (!response.ok) {
          throw new Error("Error al obtener detalles de la partida");
        }
        const data = await response.json();
        if (data.status === "success") {
          setPartida(data.reserva);

          // Extraer jugadores invitados de la reserva
          const jugadoresArray = extraerJugadoresInvitados(data.reserva);
          setJugadores(jugadoresArray);
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

  // Función para extraer jugadores invitados de la reserva
  // Modificar la función en ReservaEliminarJugador.jsx
  const extraerJugadoresInvitados = reserva => {
    // Si ya tenemos la lista procesada desde el backend, usarla directamente
    if (reserva.jugadores && Array.isArray(reserva.jugadores)) {
      // Filtrar solo los jugadores que no son organizadores
      return reserva.jugadores.filter(jugador => !jugador.esOrganizador).map(jugador => ({
        nombre: jugador.nombre,
        posicion: jugador.posicion
      }));
    }

    // Método alternativo: usar las propiedades individuales
    const jugadoresArray = [];

    // Excluir al organizador de la lista
    const organizadorNombre = reserva.organizador;

    // En estos sistemas, usualmente la información de jugadores viene en pares
    for (let i = 2; i <= 4; i++) {
      // Acceder a propiedades como "jugador2", "jugador3", etc.
      const nombreJugador = reserva[`jugador${i}`];
      if (nombreJugador && nombreJugador.trim() !== '' && nombreJugador !== organizadorNombre) {
        jugadoresArray.push({
          nombre: nombreJugador,
          posicion: i
        });
      }
    }
    return jugadoresArray;
  };

  // Manejador para iniciar el proceso de eliminación
  const handleSubmit = e => {
    e.preventDefault();
    if (jugadorSeleccionado) {
      setConfirmando(true);
    }
  };

  // Manejador para confirmar la eliminación
  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      const response = await fetch(`${DOMINIO_BACKEND}/reservas/eliminar-jugador`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventId,
          calendarId,
          partidaId,
          numero,
          nombreJugador: jugadorSeleccionado
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setMensaje(data.message || "El jugador ha sido eliminado exitosamente.");
        setConfirmando(false);
      } else {
        throw new Error(data.message || "Ocurrió un error al eliminar al jugador.");
      }
    } catch (err) {
      console.error("Error al eliminar jugador:", err);
      setError(err.message || "Error al procesar la solicitud. Por favor, intenta de nuevo.");
      setConfirmando(false);
    } finally {
      setEliminando(false);
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

  // Renderizar mensaje de error
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

  // Renderizar mensaje de éxito
  if (mensaje) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_2")}</div>
              <h3 className="text-success mb-3">{t("jugador-eliminado")}</h3>
              {/* <p className="lead">{mensaje}</p> */}
              <p>{t("se-ha-enviado-una-notificacion-a-los-jugadores-afe")}</p>
              <button onClick={() => window.close()} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
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
                <h3 className="text-warning">{t("confirmar-eliminacion")}</h3>
              </div>
              <p className="lead text-center mb-4">{t("estas-seguro-que-deseas-eliminar-a")}<strong> {jugadorSeleccionado} </strong>{t("de-esta-partida")}</p>
              <p className="text-center text-danger">{t("esta-accion-no-se-puede-deshacer")}</p>

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
              </ul>

              <div className="d-grid gap-2">
                <button className="btn btn-danger" onClick={confirmarEliminacion} disabled={eliminando}>
                  {eliminando ? t('http-procesando') : t('btn-confirmar-eliminacion-jugador')}
                </button>
                <button className="btn btn-secondary" onClick={cancelarConfirmacion} disabled={eliminando}>{t("volver")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Formulario principal para eliminar jugador
  return <div className="container min-vh-100 d-flex align-items-center">
    <div className="row w-100">
      <div className="col-12 col-md-8 col-lg-6 mx-auto">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="mb-4 text-center">{t("eliminar-jugador")}</h3>

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
              <li className="list-group-item">{t("organizador")} {partida.organizador}</li>
              <li className="list-group-item">{t("jugadores-actuales")} {partida.jugadores_actuales}</li>
            </ul>

            {/* Formulario para eliminar jugador */}
            {jugadores.length > 0 ? <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor={t("jugadorseleccionado")} className="form-label">{t("selecciona-el-jugador-a-eliminar")}</label>
                <select className="form-select" id="jugadorSeleccionado" value={jugadorSeleccionado} onChange={e => setJugadorSeleccionado(e.target.value)} required>
                  <option value="">{t("seleccionar-jugador")}</option>
                  {jugadores.map((jugador, index) => <option key={index} value={jugador.nombre}>
                    {jugador.nombre}
                  </option>)}
                </select>
              </div>

              <div className="alert alert-warning">
                <p className="mb-1"><strong>{t("aviso-importante")}</strong></p>
                <p className="mb-0">{t("al-eliminar-un-jugador-se-actualizara-el-estado-d")}</p>
              </div>

              <button type={t("submit")} className="btn btn-danger w-100" disabled={!jugadorSeleccionado}>{t("eliminar-jugador_1")}</button>
            </form> : <div className="alert alert-info">
              <p className="mb-0">{t("no-hay-jugadores-invitados-en-esta-partida")}</p>
            </div>}
          </div>
        </div>
      </div>
    </div>
  </div>;
}