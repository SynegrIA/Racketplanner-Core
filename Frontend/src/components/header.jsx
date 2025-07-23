import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useTranslation } from 'react-i18next';

export default function Header() {
    const { t } = useTranslation()
    const {
        currentTheme
    } = useTheme();

    // Estilos para el hover y posicionamiento con responsive
    const styleTag = `
        .navbar-brand-custom {
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .navbar-brand-custom span {
            color: #333;
            transition: color 0.2s ease;
        }
        .navbar-brand-custom:hover span {
            color: ${currentTheme.primaryColor};
        }
        .btn-registro {
            transition: all 0.3s ease;
        }
        .btn-registro:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        /* Estilos responsive */
        @media (min-width: 768px) {
            .navbar-brand-custom {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
            }
            .btn-text-full {
                display: inline;
            }
            .btn-text-short {
                display: none;
            }
        }
        
        @media (max-width: 767px) {
            .navbar-container {
                justify-content: space-between !important;
            }
            .btn-registro {
                padding: 6px 8px !important;
            }
            .btn-text-full {
                display: none;
            }
            .btn-text-short {
                display: inline;
            }
        }
    `;
    return <>
        <style>{styleTag}</style>
        <header className="navbar navbar-light bg-white shadow-sm" style={{
            borderBottom: `4px solid ${currentTheme.primaryColor}`
        }}>
            <div className="container navbar-container position-relative d-flex align-items-center" style={{
                height: "60px"
            }}>
                {/* Logo - centrado en desktop, izquierda en móvil */}
                <Link className="navbar-brand-custom d-flex align-items-center" to="/">
                    <img src={t("racketplannerlogopng")} alt={t("racketplanner-logo")} height={t("40")} className="me-2" />
                    <span className="fw-bold fs-5">{t("racketplanner")}</span>
                </Link>

                {/* Botón de registro a la derecha */}
                <div className="ms-auto">
                    <Link to="/signup" className="btn btn-registro" style={{
                        backgroundColor: currentTheme.primaryColor,
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '6px 10px'
                    }}>
                        <i className="bi bi-person-plus me-1"></i>
                        <span className="btn-text-short">{t("registrarse")}</span>
                        <span className="btn-text-full">{t("registrar-jugador")}</span>
                    </Link>
                </div>
            </div>
        </header>
    </>;
}