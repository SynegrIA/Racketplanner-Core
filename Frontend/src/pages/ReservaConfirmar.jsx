import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { DOMINIO_BACKEND } from "../config/config.js";

export default function ReservaConfirmar() {
    const [searchParams] = useSearchParams()
    // Estado para almacenar la partida (datos estáticos)
    const [partida, setPartida] = useState(null)
    // Estados independientes para los campos de formulario
    const [nombre, setNombre] = useState("")
    const [numero, setNumero] = useState("")
    const [nivel, setNivel] = useState("")
    const [jugadoresFaltan, setJugadoresFaltan] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [tipoMensaje, setTipoMensaje] = useState("success");
    const [enviando, setEnviando] = useState(false)
    // Estado para controlar modo de edición de campos adicionales
    const [modoEdicion, setModoEdicion] = useState(false)
    // Bandera para controlar la inicialización de datos
    const [datosInicializados, setDatosInicializados] = useState(false)
    // Estado para controlar si la reserva fue confirmada exitosamente
    const [reservaConfirmada, setReservaConfirmada] = useState(false)
    // Estado para almacenar los datos de la reserva confirmada
    const [reservaData, setReservaData] = useState(null)
    const navigate = useNavigate()

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
                    if (partidaData.numero) setNumero(partidaData.numero);
                    if (partidaData.nivel) setNivel(partidaData.nivel);
                    if (partidaData.jugadores_faltan) setJugadoresFaltan(partidaData.jugadores_faltan);
                }
                // Marcar que ya se inicializaron los datos
                setDatosInicializados(true);
            } catch (e) {
                console.error("Error al parsear datos:", e);
                setDatosInicializados(true);
            }
        }
    }, [searchParams, datosInicializados]);

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!nivel || nivel === "No especificado" || nivel === "") {
            setMensaje("Debe especificar el nivel de la partida")
            setTipoMensaje("danger")
            return // Detener la ejecución si hay error
        }

        if (!jugadoresFaltan || jugadoresFaltan === "?" || jugadoresFaltan === "") {
            setMensaje("Debe especificar los jugadores que faltan para completar la partida")
            setTipoMensaje("danger")
            return // Detener la ejecución si hay error
        }

        setEnviando(true)
        setMensaje("")

        const inicioDate = new Date(partida?.inicio)
        const finDate = new Date(inicioDate.getTime() + 90 * 60000) // 90 minutos en ms
        const fin = finDate.toISOString()

        try {
            // Enviamos los datos al backend
            const response = await fetch(`${DOMINIO_BACKEND}/reservas/confirmar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    pista: partida?.pista,
                    inicio: partida?.inicio,
                    fin,
                    nombre,
                    numero,
                    partida: partida?.partida,
                    nivel,
                    jugadores_faltan: jugadoresFaltan
                })
            })

            const data = await response.json()

            if (data.status === "success") {
                setReservaConfirmada(true)
                setMensaje("¡Tu reserva ha sido confirmada! Hemos enviado los detalles a tu WhatsApp.")
                setReservaData(data.data) // Guardar los datos de la reserva confirmada
            } else {
                setMensaje(`Error: ${data.message}`)
                setTipoMensaje("danger")
            }
        } catch (err) {
            setMensaje("Error al confirmar la reserva. Por favor, inténtalo de nuevo.")
            setTipoMensaje("danger")
            console.error(err)
        } finally {
            setEnviando(false)
        }
    }

    if (!partida) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body text-center">
                                <div className="display-1 mb-4">⚠️</div>
                                <h3 className="text-warning mb-3">Información no disponible</h3>
                                <p className="lead">No se han recibido datos de la partida.</p>
                                <button onClick={() => navigate("/")} className="btn btn-primary mt-3">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Pantalla de reserva confirmada exitosamente
    if (reservaConfirmada) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body text-center">
                                <div className="display-1 mb-4">✅</div>
                                <h3 className="text-success mb-3">Reserva Confirmada</h3>
                                <p className="lead">{mensaje}</p>
                                <ul className="list-group mb-4 text-start">
                                    <li className="list-group-item">📅 Fecha: {new Date(partida.inicio).toLocaleDateString("es-ES", { timeZone: 'Europe/Madrid' })}</li>
                                    <li className="list-group-item">⏰ Hora: {new Date(partida.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Madrid' })}</li>
                                    <li className="list-group-item">🎾 Nivel: {nivel}</li>
                                    <li className="list-group-item">🏟️ Pista: {partida.pista}</li>
                                    <li className="list-group-item">👤 A tu nombre: {nombre}</li>
                                    <li className="list-group-item">👥 Jugadores que faltan: {jugadoresFaltan}</li>
                                </ul>
                                <div className="alert alert-info mb-4">
                                    <p className="mb-0">Se ha enviado una confirmación a tu número de WhatsApp.</p>
                                </div>
                                <button onClick={() => navigate("/")} className="btn btn-primary mt-3">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Formulario de confirmación de reserva
    return (
        <div className="container min-vh-100 d-flex align-items-center">
            <div className="row w-100">
                <div className="col-12 col-md-8 col-lg-6 mx-auto">
                    <div className="card shadow">
                        <div className="card-body">
                            <h3 className="mb-4 text-center">🎮 Detalles de la Partida</h3>
                            <div className="d-flex justify-content-end mb-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${modoEdicion ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                                    onClick={() => setModoEdicion(!modoEdicion)}
                                >
                                    {modoEdicion ? '❌ Cancelar edición' : '✏️ Editar detalles'}
                                </button>
                            </div>
                            <ul className="list-group mb-4">
                                <li className="list-group-item">📅 Fecha: {new Date(partida.inicio).toLocaleDateString("es-ES", { timeZone: 'Europe/Madrid' })}</li>
                                <li className="list-group-item">⏰ Hora: {new Date(partida.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Madrid' })}</li>

                                {!modoEdicion ? (
                                    <li className="list-group-item">🎾 Nivel: {nivel || "No especificado"}</li>
                                ) : (
                                    <li className="list-group-item">
                                        <div className="input-group">
                                            <span className="input-group-text">🎾 Nivel:</span>
                                            <select
                                                className="form-select"
                                                value={nivel}
                                                onChange={(e) => setNivel(e.target.value)}
                                                required
                                            >
                                                <option value="">Selecciona nivel</option>
                                                <option value="1">1 - Principiante</option>
                                                <option value="2">2 - Intermedio</option>
                                                <option value="3">3 - Avanzado</option>
                                            </select>
                                        </div>
                                    </li>
                                )}

                                <li className="list-group-item">🏟️ Pista: {partida.pista}</li>

                                {!modoEdicion ? (
                                    <li className="list-group-item">👥 Jugadores faltantes: {jugadoresFaltan || "?"}</li>
                                ) : (
                                    <li className="list-group-item">
                                        <div className="input-group">
                                            <span className="input-group-text">👥 Jugadores faltantes:</span>
                                            <select
                                                className="form-select"
                                                value={jugadoresFaltan}
                                                onChange={(e) => setJugadoresFaltan(e.target.value)}
                                                required
                                            >
                                                <option value="">Selecciona cantidad</option>
                                                <option value="0">0 jugadores</option>
                                                <option value="1">1 jugador</option>
                                                <option value="2">2 jugadores</option>
                                                <option value="3">3 jugadores</option>
                                            </select>
                                        </div>
                                    </li>
                                )}
                            </ul>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Tu nombre</label>
                                    <input
                                        className="form-control"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Tu número de teléfono</label>
                                    <input
                                        className="form-control"
                                        value={numero}
                                        onChange={(e) => setNumero(e.target.value)}
                                        required
                                    />
                                    <div className="form-text">Recibirás notificaciones por WhatsApp</div>
                                </div>

                                {mensaje && tipoMensaje === "danger" && (
                                    <div className={`alert alert-${tipoMensaje} mb-3`}>{mensaje}</div>
                                )}

                                <button className="btn btn-success w-100" disabled={enviando}>
                                    {enviando ? "Enviando..." : "Confirmar reserva"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}