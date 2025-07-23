import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './config/i18n.js';                          // 👈 importa la config (solo una vez)
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
)
