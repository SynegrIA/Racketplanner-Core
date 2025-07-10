import { useState, useEffect } from 'react';
import { DOMINIO_BACKEND } from '../../config';
import { useNavigate } from 'react-router-dom';

// Formatear la hora consistentemente
const formatearHora = (isoString) => {
    return new Date(isoString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid'
    });
};

// Componente para mostrar cada tarjeta de horario individual
function TimeSlot({ slot, nombre, numero }) {
    const navigate = useNavigate();

    const handleSelect = () => {
        const reservaData = {
            id: slot.id,
            pista: slot.pista,
            inicio: slot.inicio,
            nombre: nombre || '',
            numero: numero || '',
            nivel: slot.nivel || 'No especificado',
            jugadores_faltan: slot.jugadores_faltan || '?'
        };

        const params = new URLSearchParams();
        params.append('data', encodeURIComponent(JSON.stringify(reservaData)));
        navigate(`/confirmar-reserva?${params.toString()}`);
    };

    return (
        <div className="list-group-item d-flex justify-content-between align-items-center">
            <span>Pista: <strong>{slot.pista}</strong></span>
            <button className="btn btn-sm btn-success" onClick={handleSelect}>
                Seleccionar
            </button>
        </div>
    );
}

// Componente para agrupar los slots por hora
function TimeGroup({ time, slots, onSelect, nombre, numero, isExpanded, onToggle }) {
    return (
        <div className="card mb-3">
            <div className="card-header" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <h5 className="mb-0 d-flex justify-content-between align-items-center">
                    <span className="fw-bold fs-4">{time}</span>
                    <span className="badge bg-primary rounded-pill">{slots.length} pistas disponibles</span>
                </h5>
            </div>
            {isExpanded && (
                <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                        {slots.map(slot => (
                            <TimeSlot
                                key={slot.id}
                                slot={slot}
                                nombre={nombre}
                                numero={numero}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [groupedSlots, setGroupedSlots] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [nombre, setNombre] = useState('');
    const [numero, setNumero] = useState('');
    const [expandedTime, setExpandedTime] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const nombreParam = params.get('nombre');
        const numeroParam = params.get('numero');
        if (nombreParam) setNombre(decodeURIComponent(nombreParam));
        if (numeroParam) setNumero(decodeURIComponent(numeroParam));
    }, []);

    const fetchAvailableSlots = async (date) => {
        setLoading(true);
        setError('');
        setGroupedSlots({});
        setExpandedTime(null);

        try {
            const response = await fetch(`${DOMINIO_BACKEND}/reservas/disponibles?fecha=${date}`);
            const data = await response.json();

            if (response.ok && data.status === 'success' && data.data.length > 0) {
                const groups = data.data.reduce((acc, slot) => {
                    const time = formatearHora(slot.inicio);
                    if (!acc[time]) {
                        acc[time] = [];
                    }
                    acc[time].push(slot);
                    return acc;
                }, {});
                setGroupedSlots(groups);
            } else {
                const message = data.data.length === 0 ? 'No hay horarios disponibles para la fecha seleccionada.' : (data.message || 'No se pudieron cargar los horarios.');
                setError(message);
            }
        } catch (err) {
            setError('Error de conexión al cargar los horarios. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots(selectedDate);
        }
    }, [selectedDate]);

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const handleToggleTime = (time) => {
        setExpandedTime(expandedTime === time ? null : time);
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
                                min={new Date().toISOString().split('T')[0]}
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
                        <div>
                            {Object.keys(groupedSlots).length > 0 ? (
                                Object.keys(groupedSlots).sort().map((time) => (
                                    <TimeGroup
                                        key={time}
                                        time={time}
                                        slots={groupedSlots[time]}
                                        nombre={nombre}
                                        numero={numero}
                                        isExpanded={expandedTime === time}
                                        onToggle={() => handleToggleTime(time)}
                                        onSelect={() => { }}
                                    />
                                ))
                            ) : (
                                // El mensaje de error ya cubre el caso de no disponibilidad
                                null
                            )}
                        </div>
                    )}
                </div>
                <div className="card-footer text-muted text-center">
                    <p className="mb-0">Selecciona un horario para ver las pistas y continuar con la reserva.</p>
                </div>
            </div>
        </div>
    );
}