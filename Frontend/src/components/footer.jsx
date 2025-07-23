import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation()
  const {
    currentTheme
  } = useTheme();

  // Estilos para el enlace, para poder usar el color del tema y añadir efecto hover
  const styleTag = `
        .synergia-link {
            color: ${currentTheme.primaryColor};
            font-weight: bold;
            text-decoration: none;
            transition: opacity 0.2s ease;
        }
        .synergia-link:hover {
            opacity: 0.8;
        }
    `;
  return <>
    <style>{styleTag}</style>
    <footer className="text-center py-4 mt-auto" style={{
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #dee2e6'
    }}>
      <div className="container d-flex justify-content-center align-items-center">
        <img src={t("logopng")} alt={t("synergia-logo")} height={t("24")} className="me-2" />
        <span className="text-muted">{t("desarrollado-por")}<a href="https://synergiapro.es/" // Cambia esta URL por la real
          target={t("blank")} rel={t("noopener-noreferrer")} className="synergia-link">{t("synergia")}</a>
        </span>
      </div>
    </footer>
  </>;
}