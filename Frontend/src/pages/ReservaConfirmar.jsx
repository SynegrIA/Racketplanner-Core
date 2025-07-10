import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { DOMINIO_BACKEND } from "../../config"

export default function ReservaConfirmar() {
    const [searchParams] = useSearchParams()
    // Estado para almacenar la partida (datos estáticos)
    const [partida, setPartida] = useState(null)
    // Estados independientes para los campos de formulario
    const [nombre, setNombre] = useState("")
    const [numero, setNumero] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [enviando, setEnviando] = useState(false)
    // Bandera para controlar la inicialización de datos
    const [datosInicializados, setDatosInicializados] = useState(false)

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
        setEnviando(true)
        setMensaje("")

        try {
            // Enviamos los datos al backend
            const response = await fetch(`${DOMINIO_BACKEND}/reservas/confirmar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...partida,
                    nombre,
                    numero
                })
            })

            const data = await response.json()

            if (data.status === "success") {
                setMensaje("¡Tu reserva ha sido confirmada! Hemos enviado los detalles a tu WhatsApp.")
            } else {
                setMensaje(`Error: ${data.message}`)
            }
        } catch (err) {
            setMensaje("Error al confirmar la reserva. Por favor, inténtalo de nuevo.")
            console.error(err)
        } finally {
            setEnviando(false)
        }
    }

    if (!partida) {
        return <div className="container mt-5 text-danger">No se han recibido datos de la partida.</div>
    }

    return (
        <div className="container min-vh-100 d-flex align-items-center">
            <div className="row w-100">
                <div className="col-12 col-md-8 col-lg-6 mx-auto">
                    <div className="card shadow">
                        <div className="card-body">
                            <h3 className="mb-4 text-center">🎮 Detalles de la Partida</h3>
                            <ul className="list-group mb-4">
                                <li className="list-group-item">📅 Fecha: {new Date(partida.inicio).toLocaleDateString("es-ES", { timeZone: 'Europe/Madrid' })}</li>
                                <li className="list-group-item">⏰ Hora: {new Date(partida.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: 'Europe/Madrid' })}</li>
                                <li className="list-group-item">🎾 Nivel: {partida.nivel || "No especificado"}</li>
                                <li className="list-group-item">🏟️ Pista: {partida.pista}</li>
                                <li className="list-group-item">👥 Jugadores faltantes: {partida.jugadores_faltan ?? "?"}</li>
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
                                <button className="btn btn-success w-100" disabled={enviando}>
                                    {enviando ? "Enviando..." : "Confirmar reserva"}
                                </button>
                            </form>

                            {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}