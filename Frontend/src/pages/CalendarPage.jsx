import { useState, useEffect } from 'react';
import { DOMINIO_BACKEND } from '../../config';

// Componente para mostrar cada tarjeta de horario
function TimeSlot({ slot, onSelect }) {
    const handleSelect = () => {
        // Aquí puedes añadir la lógica para manejar la selección,
        // como abrir un modal de confirmación o navegar a otra página.
        alert(`Has seleccionado: ${slot.pista} a las ${new Date(slot.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
        // onSelect(slot); // Descomenta si necesitas manejar el estado en el componente padre
    };

    return (
        <div className="col-md-4 col-lg-3 mb-3">
            <div className="card text-center h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                    <h5 className="card-title">{slot.pista}</h5>
                    <p className="card-text fs-4 fw-bold">
                        {new Date(slot.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button className="btn btn-primary" onClick={handleSelect}>
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

    // Función para obtener los horarios disponibles
    const fetchAvailableSlots = async (date) => {
        setLoading(true);
        setError('');
        try {
            // Simula una llamada a un endpoint que devuelve alternativas
            // En un caso real, este endpoint debería devolver los slots disponibles para un día
            const response = await fetch(`${DOMINIO_BACKEND}/reservas/agendar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fecha_ISO: new Date(date).toISOString(),
                    // Datos dummy para que el endpoint de alternativas funcione
                    nombre: "temp",
                    numero: "temp"
                }),
            });

            const data = await response.json();

            if (data.status === 'alternativas') {
                setAvailableSlots(data.alternativas);
            } else {
                // Si no hay alternativas, vaciamos los slots
                setAvailableSlots([]);
                if (data.status === 'nodisponible') {
                    setError('No hay horarios disponibles para esta fecha.');
                }
            }
        } catch (err) {
            setError('Error al cargar los horarios. Inténtalo de nuevo.');
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
                                    <TimeSlot key={index} slot={slot} />
                                ))
                            ) : (
                                <div className="text-center text-muted">
                                    <p>No hay horarios disponibles para la fecha seleccionada.</p>
                                </div>
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