import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ConfirmarReserva from './pages/ConfirmarReserva.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/confirmar-reserva" element={<ConfirmarReserva />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
