import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { DOMINIO_BACKEND } from "../config/config.js";

export default function RegisterPage() {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();

    // Estados para los campos del formulario
    const [nombre, setNombre] = useState("");
    const [codigoPais, setCodigoPais] = useState("34"); // Por defecto España
    const [numero, setNumero] = useState("");
    const [nivel, setNivel] = useState(1)
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

    // Incrementar o decrementar la frecuencia
    const ajustarFrecuencia = (incremento) => {
        setFrecuenciaSemanal(prev => {
            const nuevoValor = prev + incremento;
            if (nuevoValor < 1) return 1;
            if (nuevoValor > 10) return 10;
            return nuevoValor;
        });
    };

    // Cambiar una preferencia específica
    const togglePreferencia = (preferencia) => {
        setPreferencias(prev => ({
            ...prev,
            [preferencia]: !prev[preferencia]
        }));
    };

    // Enviar el formulario
    const handleSubmit = async (e) => {
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
                preferencias: notificacionesActivas ? preferencias : { mañana: false, tarde: false, noche: false }
            };

            // Ejemplo de llamada al backend (descomenta y ajusta según tu API)

            const response = await fetch(`${DOMINIO_BACKEND}/jugadores/new`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datosRegistro)
            });

            const data = await response.json();

            if (data.status === "success") {
                setMensaje("¡Registro completado con éxito!");
                setTipoMensaje("success");
                // Redirigir después de un registro exitoso
                setTimeout(() => navigate("/home"), 2000);
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

    return (
        <div className="container min-vh-100 d-flex align-items-center py-5">
            <div className="row w-100">
                <div className="col-12 col-md-8 col-lg-6 mx-auto">
                    <div className="card shadow"
                        style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}>
                        <div className="card-header text-center py-4"
                            style={{
                                background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                                color: '#FFFFFF',
                                borderBottom: 'none'
                            }}>
                            <h2 className="mb-0 fw-bold">
                                <i className="bi bi-person-plus-fill me-2"></i>
                                Registro de jugador
                            </h2>
                        </div>

                        <div className="card-body p-4">
                            {mensaje && (
                                <div className={`alert alert-${tipoMensaje} mb-4`}>
                                    {mensaje}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Nombre completo */}
                                <div className="mb-4">
                                    <label htmlFor="nombre" className="form-label fw-medium">
                                        <i className="bi bi-person me-2"></i>
                                        Nombre completo
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        id="nombre"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Introduce tu nombre completo"
                                        required
                                    />
                                </div>

                                {/* Teléfono con prefijo */}
                                <div className="mb-4">
                                    <label htmlFor="telefono" className="form-label fw-medium">
                                        <i className="bi bi-telephone me-2"></i>
                                        Número de teléfono
                                    </label>
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
                                            id="telefono"
                                            value={numero}
                                            onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                                            placeholder="612345678"
                                            pattern="[0-9]*"
                                            minLength={9}
                                            maxLength={9}
                                            required
                                        />
                                    </div>
                                    <div className="form-text">Recibirás confirmaciones por WhatsApp</div>
                                </div>

                                {/* Selector de Nivel - NUEVO */}
                                <div className="mb-4">
                                    <label htmlFor="nivel" className="form-label fw-medium">
                                        <i className="bi bi-bar-chart me-2"></i>
                                        Nivel de juego
                                    </label>
                                    <select
                                        className="form-select"
                                        id="nivel"
                                        value={nivel}
                                        onChange={(e) => setNivel(parseInt(e.target.value))}
                                        required
                                    >
                                        <option value="1">Nivel 1 - Principiante</option>
                                        <option value="2">Nivel 2 - Intermedio</option>
                                        <option value="3">Nivel 3 - Avanzado</option>
                                    </select>
                                    <div className="form-text">Selecciona tu nivel actual de juego</div>
                                </div>

                                {/* Activar/desactivar notificaciones */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label htmlFor="notificaciones" className="form-label fw-medium mb-0">
                                            <i className="bi bi-bell me-2"></i>
                                            Notificaciones (invitaciones partidas abiertas)
                                        </label>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id="notificaciones"
                                                checked={notificacionesActivas}
                                                onChange={() => setNotificacionesActivas(!notificacionesActivas)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: notificacionesActivas ? currentTheme.primaryColor : null
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Opciones adicionales que aparecen solo si las notificaciones están activas */}
                                {notificacionesActivas && (
                                    <>
                                        <div className="card bg-light mb-4">
                                            <div className="card-body">
                                                <h5 className="mb-3">Preferencias de notificaciones</h5>

                                                {/* Frecuencia semanal */}
                                                <div className="mb-4">
                                                    <label className="form-label fw-medium d-block">
                                                        <i className="bi bi-calendar-week me-2"></i>
                                                        Frecuencia semanal máxima
                                                    </label>
                                                    <div className="d-flex align-items-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => ajustarFrecuencia(-1)}
                                                            disabled={frecuenciaSemanal <= 0}
                                                        >
                                                            <i className="bi bi-dash"></i>
                                                        </button>
                                                        <div
                                                            className="px-4 py-2 mx-2 rounded-2 text-center fw-bold fs-5"
                                                            style={{
                                                                minWidth: '60px',
                                                                backgroundColor: '#f8f9fa',
                                                                border: '1px solid #dee2e6'
                                                            }}
                                                        >
                                                            {frecuenciaSemanal}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => ajustarFrecuencia(1)}
                                                            disabled={frecuenciaSemanal >= 10}
                                                        >
                                                            <i className="bi bi-plus"></i>
                                                        </button>
                                                        <span className="text-muted ms-3">invitaciones/semana</span>
                                                    </div>
                                                    <div className="form-text">Número máximo de invitaciones que recibirás por semana</div>
                                                </div>

                                                {/* Preferencias horarias */}
                                                <div>
                                                    <label className="form-label fw-medium">
                                                        <i className="bi bi-clock me-2"></i>
                                                        Preferencias horarias
                                                    </label>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className={`btn ${preferencias.mañana ? 'btn-primary' : 'btn-outline-primary'}`}
                                                            onClick={() => togglePreferencia('mañana')}
                                                            style={{
                                                                backgroundColor: preferencias.mañana ? currentTheme.primaryColor : 'transparent',
                                                                borderColor: currentTheme.primaryColor,
                                                                color: preferencias.mañana ? '#fff' : currentTheme.primaryColor
                                                            }}
                                                        >
                                                            <i className={`bi bi-sunrise${preferencias.mañana ? '-fill' : ''} me-2`}></i>
                                                            Mañana
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn ${preferencias.tarde ? 'btn-primary' : 'btn-outline-primary'}`}
                                                            onClick={() => togglePreferencia('tarde')}
                                                            style={{
                                                                backgroundColor: preferencias.tarde ? currentTheme.primaryColor : 'transparent',
                                                                borderColor: currentTheme.primaryColor,
                                                                color: preferencias.tarde ? '#fff' : currentTheme.primaryColor
                                                            }}
                                                        >
                                                            <i className={`bi bi-sun${preferencias.tarde ? '-fill' : ''} me-2`}></i>
                                                            Tarde
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn ${preferencias.noche ? 'btn-primary' : 'btn-outline-primary'}`}
                                                            onClick={() => togglePreferencia('noche')}
                                                            style={{
                                                                backgroundColor: preferencias.noche ? currentTheme.primaryColor : 'transparent',
                                                                borderColor: currentTheme.primaryColor,
                                                                color: preferencias.noche ? '#fff' : currentTheme.primaryColor
                                                            }}
                                                        >
                                                            <i className={`bi bi-moon${preferencias.noche ? '-fill' : ''} me-2`}></i>
                                                            Noche
                                                        </button>
                                                    </div>
                                                    <div className="form-text">Selecciona los momentos del día en los que prefieres jugar</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg w-100"
                                    disabled={enviando}
                                    style={{
                                        backgroundColor: currentTheme.primaryColor,
                                        borderColor: currentTheme.primaryColor
                                    }}
                                >
                                    {enviando ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-2"></i>
                                            Completar registro
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        <div className="card-footer text-center py-3"
                            style={{
                                background: '#f8f9fa',
                                borderTop: '1px solid rgba(0,0,0,0.05)'
                            }}>
                            <p className="mb-0">
                                <i className="bi bi-shield-check me-2"></i>
                                Tus datos están protegidos y solo se usarán para gestionar partidas
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}