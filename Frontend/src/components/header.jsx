import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header() {
    const { currentTheme } = useTheme();

    // Estilos para el hover y posicionamiento
    const styleTag = `
        .navbar-brand-custom {
            text-decoration: none;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
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
                <div className="container position-relative" style={{ height: "60px" }}>
                    {/* Logo centrado con posición absoluta */}
                    <Link className="navbar-brand-custom d-flex align-items-center justify-content-center" to="/">
                        <img
                            src="/RacketPlannerLogo.png"
                            alt="RacketPlanner Logo"
                            height="40"
                            className="me-2"
                        />
                        <span className="fw-bold fs-5">RacketPlanner</span>
                    </Link>

                    {/* Botón de registro a la derecha */}
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
                            <i className="bi bi-person-plus me-1"></i> Registrar jugador
                        </Link>
                    </div>
                </div>
            </header>
        </>
    );
}