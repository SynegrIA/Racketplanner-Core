import { useState, useEffect } from 'react';
import { DOMINIO_BACKEND, NODE_ENV } from '../../config';
import { useNavigate } from 'react-router-dom';

// Componente para mostrar cada tarjeta de horario
function TimeSlot({ slot, onSelect, nombre, numero }) {
    const navigate = useNavigate();

    // Formatear la hora consistentemente
    const formatearHora = (isoString) => {
        return new Date(isoString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Madrid'
        });
    };

    const handleSelect = () => {
        // Crear un objeto con todos los datos necesarios
        const reservaData = {
            id: slot.id,
            pista: slot.pista,
            inicio: slot.inicio,
            nombre: nombre || '',
            numero: numero || '',
            // Añadir otros campos que pueda necesitar ReservaConfirmar
            nivel: slot.nivel || 'No especificado',
            jugadores_faltan: slot.jugadores_faltan || '?'
        };

        // Codificar los datos como un único parámetro
        const params = new URLSearchParams();
        params.append('data', encodeURIComponent(JSON.stringify(reservaData)));

        // Redirigir a la página de confirmación con el parámetro data
        navigate(`/confirmar-reserva?${params.toString()}`);
    };

    return (
        <div className="col-md-4 col-lg-3 mb-3">
            <div className="card text-center h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                    <h5 className="card-title">{slot.pista}</h5>
                    <p className="card-text fs-4 fw-bold">
                        {formatearHora(slot.inicio)}
                    </p>
                    <button className="btn btn-success" onClick={handleSelect}>
                        Seleccionar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Nuevos estados para los parámetros de URL
    const [nombre, setNombre] = useState('');
    const [numero, setNumero] = useState('');

    // Recuperar parámetros de la URL al montar el componente
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const nombreParam = params.get('nombre');
        const numeroParam = params.get('numero');

        if (nombreParam) {
            setNombre(decodeURIComponent(nombreParam));
        }

        if (numeroParam) {
            setNumero(decodeURIComponent(numeroParam));
        }
    }, []);

    // Función para obtener los horarios disponibles
    const fetchAvailableSlots = async (date) => {
        setLoading(true);
        setError('');
        setAvailableSlots([]); // Limpiar slots anteriores al iniciar la carga

        try {
            // Llamada al nuevo endpoint GET que devuelve todos los slots disponibles
            const response = await fetch(`${DOMINIO_BACKEND}/reservas/disponibles?fecha=${date}`);
            const data = await response.json();

            if (response.ok && data.status === 'success') {
                setAvailableSlots(data.data);
                if (data.data.length === 0) {
                    // Si la respuesta es exitosa pero no hay datos, informamos al usuario.
                    setError('No hay horarios disponibles para la fecha seleccionada.');
                }
            } else {
                // Captura otros estados como 'nodisponible' o errores del servidor.
                setError(data.message || 'No se pudieron cargar los horarios.');
            }
        } catch (err) {
            setError('Error de conexión al cargar los horarios. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    // Cargar horarios cuando la fecha cambia
    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots(selectedDate);
        }
    }, [selectedDate]);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    return (
        <div className="container mt-5">
            <div className="card shadow">
                <div className="card-header text-center">
                    <h2>Calendario de Reservas</h2>
                </div>
                <div className="card-body">
                    <div className="row justify-content-center mb-4">
                        <div className="col-md-6">
                            <label htmlFor="date-picker" className="form-label">Selecciona una fecha:</label>
                            <input
                                type="date"
                                id="date-picker"
                                className="form-control"
                                value={selectedDate}
                                onChange={handleDateChange}
                                min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                            />
                        </div>
                    </div>

                    <hr />

                    {loading && (
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    )}

                    {error && <div className="alert alert-warning text-center">{error}</div>}

                    {!loading && !error && (
                        <div className="row">
                            {availableSlots.length > 0 ? (
                                availableSlots.map((slot, index) => (
                                    <TimeSlot
                                        key={index}
                                        slot={slot}
                                        nombre={nombre}
                                        numero={numero}
                                        onSelect={() => { }}
                                    />
                                ))
                            ) : (
                                // No mostramos nada aquí, el mensaje de error/info ya lo cubre
                                null
                            )}
                        </div>
                    )}
                </div>
                <div className="card-footer text-muted text-center">
                    <p className="mb-0">Selecciona un horario para continuar con la reserva.</p>
                </div>
            </div>
        </div>
    );
}