import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { DOMINIO_BACKEND } from "../config/config.js";

export default function RegisterConfirmPage() {
    const { telefono } = useParams();
    const { currentTheme } = useTheme();
    const navigate = useNavigate();

    // Estados
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [usuario, setUsuario] = useState(null);
    const [confirmando, setConfirmando] = useState(false);
    const [confirmacionExitosa, setConfirmacionExitosa] = useState(false);
    const [mensaje, setMensaje] = useState("");

    // Cargar datos del usuario al inicio
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            if (!telefono) {
                setError("No se ha proporcionado un número de teléfono válido");
                setCargando(false);
                return;
            }

            try {
                const response = await fetch(`${DOMINIO_BACKEND}/jugadores/${telefono}`);
                const data = await response.json();

                if (data.success) { // <-- Cambiar data.status a data.success
                    setUsuario(data.data);
                } else {
                    throw new Error(data.message || "No se pudo encontrar el usuario");
                }
            } catch (err) {
                console.error("Error al cargar datos del usuario:", err);
                setError("No se pudieron cargar los datos del usuario. El enlace puede haber expirado o ser inválido.");
            } finally {
                setCargando(false);
            }
        };

        cargarDatosUsuario();
    }, [telefono]);

    // Confirmar registro
    const handleConfirmar = async () => {
        setConfirmando(true);
        setMensaje("");

        try {
            const response = await fetch(`${DOMINIO_BACKEND}/jugadores/confirmar-numero/${telefono}`, {
                method: "PATCH"
            });

            const data = await response.json();

            if (data.success) {
                setConfirmacionExitosa(true);
                setMensaje(data.message || "Tu registro ha sido confirmado correctamente");
            } else {
                throw new Error(data.message || "Error al confirmar el registro");
            }
        } catch (err) {
            console.error("Error en la confirmación:", err);
            setError(err.message || "Ha ocurrido un error al confirmar el registro");
        } finally {
            setConfirmando(false);
        }
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

    // Renderizar mensaje de error
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
                                <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
                                    Volver al inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar confirmación exitosa
    if (confirmacionExitosa) {
        return (
            <div className="container min-vh-100 d-flex align-items-center">
                <div className="row w-100">
                    <div className="col-12 col-md-8 col-lg-6 mx-auto">
                        <div className="card shadow">
                            <div className="card-body text-center">
                                <div className="display-1 mb-4">✅</div>
                                <h3 className="text-success mb-3">¡Registro Confirmado!</h3>
                                <p className="lead">{mensaje}</p>
                                <p>Ya puedes comenzar a recibir invitaciones para partidas según tus preferencias.</p>
                                <button onClick={() => navigate('/')} className="btn btn-primary mt-3">
                                    Ir al inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar formulario de confirmación
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
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Confirmar Registro
                            </h2>
                        </div>

                        <div className="card-body p-4">
                            {mensaje && (
                                <div className="alert alert-info mb-4">{mensaje}</div>
                            )}

                            <div className="text-center mb-4">
                                <div className="display-1">🎮</div>
                                <h4 className="mt-3">Por favor, confirma tus datos</h4>
                                <p className="text-muted">Verifica que la información es correcta antes de confirmar tu registro</p>
                            </div>

                            <ul className="list-group mb-4">
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                    <span><i className="bi bi-person me-2"></i> Nombre:</span>
                                    <span className="fw-bold">{usuario?.['Nombre Real'] || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                    <span><i className="bi bi-telephone me-2"></i> Teléfono:</span>
                                    <span className="fw-bold">{usuario?.Teléfono || 'N/A'}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                    <span><i className="bi bi-bar-chart me-2"></i> Nivel de juego:</span>
                                    <span className="fw-bold">Nivel {usuario?.Nivel || 'N/A'}</span>
                                </li>
                                {usuario?.['Notificaciones'] && (
                                    <>
                                        <li className="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i className="bi bi-calendar-week me-2"></i> Invitaciones semanales:</span>
                                            <span className="fw-bold">{usuario?.['Máximo de invitaciones semanales'] || '0'}</span>
                                        </li>
                                        <li className="list-group-item">
                                            <div className="mb-2"><i className="bi bi-clock me-2"></i> Horarios preferidos:</div>
                                            <div className="d-flex flex-wrap gap-2 mt-1">
                                                {usuario?.['Horario Preferencia']?.includes('mañana') && (
                                                    <span className="badge bg-primary"><i className="bi bi-sunrise me-1"></i> Mañana</span>
                                                )}
                                                {usuario?.['Horario Preferencia']?.includes('tarde') && (
                                                    <span className="badge bg-primary"><i className="bi bi-sun me-1"></i> Tarde</span>
                                                )}
                                                {usuario?.['Horario Preferencia']?.includes('noche') && (
                                                    <span className="badge bg-primary"><i className="bi bi-moon me-1"></i> Noche</span>
                                                )}
                                                {!usuario?.['Horario Preferencia']?.length && (
                                                    <span className="text-muted">No se han seleccionado preferencias</span>
                                                )}
                                            </div>
                                        </li>
                                    </>
                                )}
                            </ul>

                            <button
                                className="btn btn-success btn-lg w-100"
                                onClick={handleConfirmar}
                                disabled={confirmando}
                                style={{
                                    backgroundColor: currentTheme.primaryColor,
                                    borderColor: currentTheme.primaryColor
                                }}
                            >
                                {confirmando ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle me-2"></i>
                                        Confirmar mi registro
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="card-footer text-center py-3"
                            style={{
                                background: '#f8f9fa',
                                borderTop: '1px solid rgba(0,0,0,0.05)'
                            }}>
                            <p className="mb-0">
                                <i className="bi bi-shield-check me-2"></i>
                                Tus datos están protegidos según la LOPD
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}