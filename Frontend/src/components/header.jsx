import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header() {
    const { currentTheme } = useTheme();

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
            .btn-text {
                display: inline;
            }
        }
        
        @media (max-width: 767px) {
            .navbar-container {
                justify-content: space-between !important;
            }
            .btn-registro {
                padding: 6px 8px !important;
            }
            .btn-text {
                display: none;
            }
        }
    `;

    return (
        <>
            <style>{styleTag}</style>
            <header
                className="navbar navbar-light bg-white shadow-sm"
                style={{
                    borderBottom: `4px solid ${currentTheme.primaryColor}`
                }}
            >
                <div className="container navbar-container position-relative d-flex align-items-center" style={{ height: "60px" }}>
                    {/* Logo - centrado en desktop, izquierda en móvil */}
                    <Link className="navbar-brand-custom d-flex align-items-center" to="/">
                        <img
                            src="/RacketPlannerLogo.png"
                            alt="RacketPlanner Logo"
                            height="40"
                            className="me-2"
                        />
                        <span className="fw-bold fs-5">RacketPlanner</span>
                    </Link>

                    {/* Botón de registro a la derecha - versión completa en desktop, solo icono en móvil */}
                    <div className="ms-auto">
                        <Link
                            to="/signup"
                            className="btn btn-registro"
                            style={{
                                backgroundColor: currentTheme.primaryColor,
                                color: '#fff',
                                borderRadius: '10px',
                                padding: '6px 10px'
                            }}
                        >
                            <i className="bi bi-person-plus"></i>
                            <span className="btn-text ms-1">Registrar jugador</span>
                        </Link>
                    </div>
                </div>
            </header>
        </>
    );
}