import { useState, useEffect, useRef } from 'react';
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
        // Si es un slot disponible, redirigir a crear reserva
        if (slot.tipo === 'disponible') {
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
        }
        // Si es una partida abierta, redirigir a unirse
        else if (slot.tipo === 'abierta') {
            navigate(`/unir-jugador-reserva?eventId=${slot.eventId}&nombre=${slot.organizador}&numero=${numero || ''}&calendarId=${slot.calendarId}`);
        }
    };

    return (
        <div className="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <span>Pista: <strong>{slot.pista}</strong></span>
                {slot.tipo === 'abierta' && (
                    <>
                        <span className="ms-3 badge bg-warning">Partida abierta</span>
                        <div className="small text-muted">
                            Organizador: {slot.organizador} |
                            Nivel: {slot.nivel || 'No especificado'} |
                            Faltan: {slot.jugadoresFaltan} jugadores
                        </div>
                    </>
                )}
            </div>
            <button
                className={`btn btn-sm ${slot.tipo === 'disponible' ? 'btn-success' : 'btn-warning'}`}
                onClick={handleSelect}
            >
                {slot.tipo === 'disponible' ? 'Seleccionar' : 'Unirse'}
            </button>
        </div>
    );
}

// Componente para agrupar los slots por hora
function TimeGroup({ time, slots, onSelect, nombre, numero, isExpanded, onToggle }) {
    // Contar cuántas pistas son disponibles y cuántas son abiertas
    const disponibles = slots.filter(slot => slot.tipo === 'disponible').length;
    const abiertas = slots.filter(slot => slot.tipo === 'abierta').length;

    // Crear el texto del contador según lo que haya disponible
    let contadorTexto = '';
    if (disponibles > 0 && abiertas > 0) {
        contadorTexto = `${disponibles} ${disponibles === 1 ? 'pista disponible' : 'pistas disponibles'} y ${abiertas} ${abiertas === 1 ? 'abierta' : 'abiertas'}`;
    } else if (disponibles > 0) {
        contadorTexto = `${disponibles} ${disponibles === 1 ? 'pista disponible' : 'pistas disponibles'}`;
    } else if (abiertas > 0) {
        contadorTexto = `${abiertas} ${abiertas === 1 ? 'partida abierta' : 'partidas abiertas'}`;
    }

    return (
        <div className="card mb-3">
            <div className="card-header" onClick={onToggle} style={{ cursor: 'pointer' }}>
                <h5 className="mb-0 d-flex justify-content-between align-items-center">
                    <span className="fw-bold fs-4">{time}</span>
                    <span className="badge bg-primary rounded-pill">{contadorTexto}</span>
                </h5>
            </div>
            {isExpanded && (
                <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                        {slots.map((slot, index) => (
                            <TimeSlot
                                key={`${time}-${slot.tipo}-${slot.id || slot.eventId || index}`}
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
    // Añadimos un ref para controlar las peticiones
    const requestIdRef = useRef(0);

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

        // Incrementamos el ID de petición para cada nueva solicitud
        const requestId = ++requestIdRef.current;

        try {
            const response = await fetch(`${DOMINIO_BACKEND}/reservas/disponibles?fecha=${date}`);
            const data = await response.json();

            // Si esta respuesta no corresponde a la última petición, la ignoramos
            if (requestId !== requestIdRef.current) {
                console.log("Ignorando respuesta obsoleta", requestId);
                return;
            }

            if (response.ok && data.status === 'success' && data.data.length > 0) {
                console.log("Datos recibidos del servidor:", data.data);

                // Verificar si cada elemento tiene el tipo correcto
                const slotsConTipo = data.data.map(slot => ({
                    ...slot,
                    tipo: slot.tipo || 'disponible'
                }));

                // Crear un mapa para eliminar duplicados de forma correcta
                const slotMap = new Map();

                // Primero procesar las partidas abiertas (para asegurar que tienen prioridad)
                slotsConTipo
                    .filter(slot => slot.tipo === 'abierta')
                    .forEach(slot => {
                        const key = `${slot.pista}-${new Date(slot.inicio).toISOString()}`;
                        slotMap.set(key, slot);
                    });

                // Luego procesar los slots disponibles (no sobrescriben partidas abiertas)
                slotsConTipo
                    .filter(slot => slot.tipo === 'disponible')
                    .forEach(slot => {
                        const key = `${slot.pista}-${new Date(slot.inicio).toISOString()}`;
                        if (!slotMap.has(key)) {
                            slotMap.set(key, slot);
                        }
                    });

                // Convertir el mapa a array
                const uniqueSlots = Array.from(slotMap.values());

                console.log("Slots procesados:", uniqueSlots);

                // Agrupar por hora
                const groups = uniqueSlots.reduce((acc, slot) => {
                    const time = formatearHora(slot.inicio);
                    if (!acc[time]) {
                        acc[time] = [];
                    }
                    acc[time].push(slot);
                    return acc;
                }, {});

                setGroupedSlots(groups);
            } else {
                const message = data.data?.length === 0 ? 'No hay horarios disponibles para la fecha seleccionada.' : (data.message || 'No se pudieron cargar los horarios.');
                setError(message);
            }
        } catch (err) {
            // Verificar si esta petición sigue siendo relevante
            if (requestId === requestIdRef.current) {
                setError('Error de conexión al cargar los horarios. Inténtalo de nuevo.');
                console.error(err);
            }
        } finally {
            // Solo actualizar el estado de carga si esta es la petición más reciente
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
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