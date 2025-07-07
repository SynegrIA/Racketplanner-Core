import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReservaConfirmar from './pages/ReservaConfirmar.jsx';
import CancelarReserva from './pages/ReservaCancelar.jsx';
import ReservaUnirse from './pages/ReservaUnirse.jsx';
import ReservaEliminarJugador from './pages/ReservaEliminarJugador.jsx';
import CalendarPage from './pages/CalendarPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/confirmar-reserva" element={<ReservaConfirmar />} />
        <Route path="/cancelar-reserva" element={<CancelarReserva />} />
        <Route path="/unir-jugador-reserva" element={<ReservaUnirse />} />
        <Route path="/eliminar-jugador-reserva" element={<ReservaEliminarJugador />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
