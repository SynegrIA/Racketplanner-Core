import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReservaConfirmar from './pages/ReservaConfirmar.jsx';
import CancelarReserva from './pages/ReservaCancelar.jsx';
import ReservaUnirse from './pages/ReservaUnirse.jsx';
import ReservaEliminarJugador from './pages/ReservaEliminarJugador.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import RegisterConfirmPage from './pages/RegisterConfirmPage.jsx';

function App() {
  return <ThemeProvider>
    <BrowserRouter>
      <Header />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <main style={{
          flex: '1'
        }}>
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/home" element={<CalendarPage />} />
            <Route path="/signup" element={<RegisterPage />} />
            <Route path="/confirmar-numerotelefono" element={<RegisterConfirmPage />} />
            <Route path="/confirmar-reserva" element={<ReservaConfirmar />} />
            <Route path="/cancelar-reserva" element={<CancelarReserva />} />
            <Route path="/unir-jugador-reserva" element={<ReservaUnirse />} />
            <Route path="/eliminar-jugador-reserva" element={<ReservaEliminarJugador />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  </ThemeProvider>;
}
export default App;