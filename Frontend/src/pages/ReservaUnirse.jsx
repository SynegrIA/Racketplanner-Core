import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DOMINIO_BACKEND } from "../config/config.js";

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

    // Datos del formulario
    const [nombreInvitado, setNombreInvitado] = useState("");
    const [numeroInvitado, setNumeroInvitado] = useState("");
    const [codigoPais, setCodigoPais] = useState("34"); // Por defecto España
    // Se elimina la opción de tipo de unión, solo permitimos con notificaciones
    const tipoUnion = "new"; // Fijo a "new" = con notificaciones

    // Obtener parámetros de la URL
    const eventId = searchParams.get("eventId");
    const organizador = searchParams.get("nombre");
    const invitado = searchParams.get("nombreinvitado")
    const numeroOrganizador = searchParams.get("numero");
    const invitadoNumero = searchParams.get("numeroinvitado")
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
                    throw new Error("Para unirse a una partida debe estar registrado en el sistema")
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

    // Manejador para unirse a la partida
    const handleSubmit = (e) => {
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
                setError("Error de conexión: Si es la primera vez que usas la aplicación, debes registrarte primero.");

                // Establecer estado para mostrar botón de registro
                setNeedsRegistration(true);
                setConfirmando(false);
                setEnviando(false);
                return;
            }

            // Usar los datos ya leídos en lugar de volver a llamar a response.json()
            if (responseData.status === "success") {
                setMensaje(responseData.message || "Te has unido a la partida exitosamente.");
                setConfirmando(false);
            } else if (responseData.status === "unauthorized") {
                // Detectar específicamente el error de usuario no registrado
                setError("Para unirte a una partida debes estar registrado en el sistema.");

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
        return (
            <div className="container min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    // Renderizar mensaje de error con opción de registro si es necesario
    if (error) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body text-center">
                                <div className="display-1 mb-4">❌</div>
                                <h3 className="text-danger mb-3">Error</h3>
                                <p className="lead">{error}</p>

                                {needsRegistration ? (
                                    <div className="alert alert-warning mb-3">
                                        <button
                                            onClick={() => navigate('/signup')}
                                            className="btn btn-outline-primary mt-2"
                                        >
                                            Ir a la página de registro
                                        </button>
                                    </div>
                                ) : null}

                                <button onClick={() => navigate('/home')} className="btn btn-primary mt-3">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar mensaje de éxito
    if (mensaje) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body text-center">
                                <div className="display-1 mb-4">✅</div>
                                <h3 className="text-success mb-3">¡Te has unido a la partida!</h3>
                                <p className="lead">{mensaje}</p>
                                <p>Se ha enviado una confirmación a tu número de WhatsApp.</p>
                                <button onClick={() => navigate('/home')} className="btn btn-primary mt-3">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Validar si hay datos de partida
    if (!partida) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body text-center">
                                <div className="display-1 mb-4">⚠️</div>
                                <h3 className="text-warning mb-3">Información no disponible</h3>
                                <p className="lead">No se encontraron datos de la partida.</p>
                                <button onClick={() => navigate('/home')} className="btn btn-primary mt-3">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pantalla de confirmación
    if (confirmando) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body">
                                <div className="text-center mb-4">
                                    <div className="display-1">🎮</div>
                                    <h3 className="text-primary">Confirmar Unión</h3>
                                </div>
                                <p className="lead text-center mb-4">¿Estás seguro que deseas unirte a esta partida?</p>

                                <ul className="list-group mb-4">
                                    <li className="list-group-item">📅 Fecha: {new Date(partida.inicio).toLocaleDateString("es-ES", { timeZone: 'Europe/Madrid' })}</li>
                                    <li className="list-group-item">⏰ Hora: {new Date(partida.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Madrid' })}</li>
                                    <li className="list-group-item">🎾 Nivel: {partida.nivel || "No especificado"}</li>
                                    <li className="list-group-item">🏟️ Pista: {partida.pista}</li>
                                    {/* <li className="list-group-item">👥 Nombre: {nombreInvitado}</li> */}
                                    <li className="list-group-item">📱 Teléfono: +{codigoPais} {numeroInvitado}</li>
                                </ul>

                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-success"
                                        onClick={confirmarUnion}
                                        disabled={enviando}
                                    >
                                        {enviando ? "Procesando..." : "Confirmar unión"}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={cancelarConfirmacion}
                                        disabled={enviando}
                                    >
                                        Volver
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Formulario principal para unirse
    return (
        <div className="container min-vh-100 d-flex align-items-center">
            <div className="row w-100">
                <div className="col-12 col-md-8 col-lg-6 mx-auto">
                    <div className="card shadow">
                        <div className="card-body">
                            <h3 className="mb-4 text-center">🎮 Únete a la Partida</h3>

                            {/* Detalles de la partida */}
                            <ul className="list-group mb-4">
                                <li className="list-group-item">📅 Fecha: {new Date(partida.inicio).toLocaleDateString("es-ES", { timeZone: 'Europe/Madrid' })}</li>
                                <li className="list-group-item">⏰ Hora: {new Date(partida.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Madrid' })}</li>
                                <li className="list-group-item">🎾 Nivel: {partida.nivel || "No especificado"}</li>
                                <li className="list-group-item">🏟️ Pista: {partida.pista}</li>
                                <li className="list-group-item">👥 Organizador: {organizador || partida.organizador}</li>
                                <li className="list-group-item">👥 Jugadores actuales: {partida.jugadores_actuales}</li>
                                <li className="list-group-item">🚀 Jugadores faltantes: {partida.jugadores_faltan}</li>
                            </ul>

                            {/* Formulario para unirse */}
                            <form onSubmit={handleSubmit}>
                                {invitado && <div className="mb-3">
                                    <label htmlFor="nombreInvitado" className="form-label">Tu nombre:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nombreInvitado"
                                        value={nombreInvitado}
                                        onChange={(e) => setNombreInvitado(e.target.value)}
                                        placeholder="Tu nombre completo"
                                        required
                                    />
                                </div>}

                                <div className="mb-4">
                                    <label htmlFor="numeroInvitado" className="form-label">Tu número de teléfono:</label>
                                    <div className="input-group">
                                        <select
                                            className="form-select"
                                            value={codigoPais}
                                            onChange={(e) => setCodigoPais(e.target.value)}
                                            style={{ maxWidth: "130px" }}
                                        >
                                            <option value="34">🇪🇸 +34</option>
                                            <option value="54">🇦🇷 +54</option>
                                            <option value="1">🇺🇸 +1</option>
                                            <option value="44">🇬🇧 +44</option>
                                            <option value="49">🇩🇪 +49</option>
                                            <option value="33">🇫🇷 +33</option>
                                            <option value="351">🇵🇹 +351</option>
                                            <option value="52">🇲🇽 +52</option>
                                            <option value="55">🇧🇷 +55</option>
                                            <option value="56">🇨🇱 +56</option>
                                            <option value="57">🇨🇴 +57</option>
                                            <option value="58">🇻🇪 +58</option>
                                        </select>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="numeroInvitado"
                                            value={numeroInvitado}
                                            onChange={(e) => setNumeroInvitado(e.target.value)}
                                            placeholder="612345678"
                                            pattern="[0-9]*"
                                            minLength={9}
                                            maxLength={9}
                                            required
                                        />
                                    </div>
                                    <div className="form-text">Recibirás confirmación por WhatsApp</div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-success w-100"
                                    disabled={!numeroInvitado}
                                >
                                    Unirme a la Partida
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}