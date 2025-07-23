import { useState, useEffect, useRef } from 'react';
import { DOMINIO_BACKEND } from '../config/config.js';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useTranslation } from 'react-i18next';

// Formatear la hora consistentemente
const formatearHora = isoString => {
  return new Date(isoString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  });
};

// Componente para mostrar cada tarjeta de horario individual
function TimeSlot({
  slot,
  nombre,
  numero
}) {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const {
    currentTheme
  } = useTheme();
  const handleSelect = () => {
    if (slot.tipo === 'abierta') {
      navigate(`/unir-jugador-reserva?eventId=${slot.eventId}&nombre=${slot.organizador}&numero=${numero || ''}&calendarId=${slot.calendarId}`);
    }
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
  };
  return <div className="list-group-item d-flex justify-content-between align-items-center border-0 py-3 hover-effect">
    <div>
      <span className="fw-semibold">{t("pista")}<strong>{slot.pista}</strong></span>
      {slot.tipo === 'abierta' && <>
        <span className="ms-3 badge rounded-pill px-3 py-2" style={{
          backgroundColor: currentTheme.accentColor,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <i className="bi bi-people-fill me-1"></i>{t("partida-abierta")}</span>
        <div className="small text-muted mt-1">
          <i className="bi bi-person-circle me-1"></i> <span className="fw-medium">{slot.organizador}</span>{t("or")}<i className="bi bi-bar-chart-fill me-1"></i>{t("nivel")}<span className="fw-medium">{slot.nivel || 'No especificado'}</span>{t("or")}<i className="bi bi-person-plus me-1"></i>{t("faltan")}<span className="fw-medium">{slot.jugadoresFaltan}{t("jugadores")}</span>
        </div>
      </>}
    </div>
    <button className={`btn btn-sm px-3 py-2 rounded-pill transition-all`} style={{
      backgroundColor: slot.tipo === 'disponible' ? currentTheme.primaryColor : currentTheme.accentColor,
      color: '#FFFFFF',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      border: 'none',
      transition: 'all 0.2s ease'
    }} onMouseOver={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    }} onMouseOut={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    }} onClick={handleSelect}>
      {slot.tipo === 'disponible' ? <>
        <i className="bi bi-calendar-check me-1"></i>{t("seleccionar")}</> : <>
        <i className="bi bi-person-plus me-1"></i>{t("unirse")}</>}
    </button>
  </div>;
}

// Componente para agrupar los slots por hora
function TimeGroup({
  time,
  slots,
  onSelect,
  nombre,
  numero,
  isExpanded,
  onToggle
}) {
  const { t } = useTranslation()
  const {
    currentTheme
  } = useTheme();
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
  return <div className="card mb-4" style={{
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: isExpanded ? '0 8px 16px rgba(0,0,0,0.15)' : '0 4px 8px rgba(0,0,0,0.08)',
    transform: isExpanded ? 'scale(1.01)' : 'scale(1)'
  }}>
    <div className="card-header" onClick={onToggle} style={{
      cursor: 'pointer',
      padding: '15px 20px',
      background: isExpanded ? `linear-gradient(45deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})` : '#f8f9fa',
      color: isExpanded ? '#fff' : '#212529',
      borderBottom: isExpanded ? 'none' : '1px solid rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <h5 className="mb-0 d-flex justify-content-between align-items-center">
        <span className="fw-bold fs-4">
          <i className={`bi ${isExpanded ? 'bi-clock-fill' : 'bi-clock'} me-2`}></i>
          {time}
        </span>
        <div>
          <span className="badge rounded-pill px-3 py-2" style={{
            backgroundColor: isExpanded ? '#ffffff' : currentTheme.primaryColor,
            color: isExpanded ? currentTheme.primaryColor : '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {contadorTexto}
          </span>
          <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} ms-3`}></i>
        </div>
      </h5>
    </div>
    {isExpanded && <div className="card-body p-0" style={{
      background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), #ffffff)'
    }}>
      <div className="list-group list-group-flush">
        {slots.map((slot, index) => <TimeSlot key={`${time}-${slot.tipo}-${slot.id || slot.eventId || index}`} slot={slot} nombre={nombre} numero={numero} onSelect={onSelect} />)}
      </div>
    </div>}
  </div>;
}
export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupedSlots, setGroupedSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [numero, setNumero] = useState('');
  const [expandedTime, setExpandedTime] = useState(null);
  const requestIdRef = useRef(0);
  const { t } = useTranslation()
  const {
    currentTheme
  } = useTheme();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nombreParam = params.get('nombre');
    const numeroParam = params.get('numero');
    if (nombreParam) setNombre(decodeURIComponent(nombreParam));
    if (numeroParam) setNumero(decodeURIComponent(numeroParam));
  }, []);
  const fetchAvailableSlots = async date => {
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
        slotsConTipo.filter(slot => slot.tipo === 'abierta').forEach(slot => {
          const key = `${slot.pista}-${new Date(slot.inicio).toISOString()}`;
          slotMap.set(key, slot);
        });

        // Luego procesar los slots disponibles (no sobrescriben partidas abiertas)
        slotsConTipo.filter(slot => slot.tipo === 'disponible').forEach(slot => {
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
        const message = data.data?.length === 0 ? 'No hay horarios disponibles para la fecha seleccionada.' : data.message || 'No se pudieron cargar los horarios.';
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
  const handleDateChange = e => {
    setSelectedDate(e.target.value);
  };
  const handleToggleTime = time => {
    setExpandedTime(expandedTime === time ? null : time);
  };

  // Definimos los estilos CSS como objetos para aplicar a nivel de componente
  useEffect(() => {
    // Crear y añadir la hoja de estilo
    const styleSheet = document.createElement("style");
    styleSheet.id = "calendar-page-styles";
    styleSheet.textContent = `
            .hover-effect:hover {
                background-color: rgba(0,0,0,0.02);
            }
            .transition-all {
                transition: all 0.3s ease;
            }
            .animate-fade-in {
                animation: fadeIn 0.5s ease-in;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;

    // Eliminar cualquier estilo anterior si existe
    const prevStyle = document.getElementById("calendar-page-styles");
    if (prevStyle) {
      prevStyle.remove();
    }

    // Añadir la nueva hoja de estilo
    document.head.appendChild(styleSheet);

    // Limpieza al desmontar
    return () => {
      const styleToRemove = document.getElementById("calendar-page-styles");
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);
  return <div className="container mt-5 pb-5">
    <div className="card shadow" style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: 'none',
      boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
    }}>
      <div className="card-header text-center py-4" style={{
        background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
        color: '#FFFFFF',
        borderBottom: 'none'
      }}>
        <h2 className="mb-0 fw-bold">
          <i className="bi bi-calendar-check me-2"></i>{t("calendario-de-reservas")}</h2>
      </div>
      <div className="card-body p-4">
        <div className="row justify-content-center mb-4">
          <div className="col-md-6">
            <label htmlFor={t("date-picker")} className="form-label fw-medium">
              <i className="bi bi-calendar3 me-2"></i>{t("selecciona-una-fecha")}</label>
            <div className="input-group" style={{
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
              borderRadius: '8px'
            }}>
              <span className="input-group-text" style={{
                backgroundColor: currentTheme.primaryColor,
                color: 'white',
                border: 'none'
              }}>
                <i className="bi bi-calendar-date"></i>
              </span>
              <input type={t("date")} id="date-picker" className="form-control py-2" value={selectedDate} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} style={{
                borderColor: 'transparent',
                boxShadow: 'none',
                fontSize: '1.1rem',
                fontWeight: '500'
              }} />
            </div>
          </div>
        </div>

        <hr className="my-4" style={{
          opacity: 0.1
        }} />

        {loading && <div className="text-center p-5">
          <div className="spinner-border" role={t("status")} style={{
            color: currentTheme.primaryColor,
            width: '3rem',
            height: '3rem'
          }}>
            <span className="visually-hidden">{t("cargando")}</span>
          </div>
          <p className="mt-3 text-muted">{t("obteniendo-horarios-disponibles")}</p>
        </div>}

        {error && <div className="alert alert-warning text-center mx-auto" style={{
          maxWidth: '600px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
        }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>}

        {!loading && !error && <div>
          {Object.keys(groupedSlots).length > 0 ? <div className="animate-fade-in">
            {Object.keys(groupedSlots).sort().map(time => <TimeGroup key={time} time={time} slots={groupedSlots[time]} nombre={nombre} numero={numero} isExpanded={expandedTime === time} onToggle={() => handleToggleTime(time)} onSelect={() => { }} />)}
          </div> : null}
        </div>}
      </div>
      <div className="card-footer text-center py-4" style={{
        background: '#f8f9fa',
        borderTop: '1px solid rgba(0,0,0,0.05)'
      }}>
        <p className="mb-0 text-muted">
          <i className="bi bi-info-circle me-2"></i>{t("selecciona-un-horario-para-ver-las-pistas-y-contin")}</p>
      </div>
    </div>
  </div>;
}