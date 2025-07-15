import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header() {
    const { currentTheme } = useTheme();

    // Estilos para el hover, definidos como un string para inyectar en una etiqueta <style>
    const styleTag = `
        .navbar-brand-custom {
            text-decoration: none; /* Elimina el subrayado del enlace */
        }
        .navbar-brand-custom span {
            color: #333;
            transition: color 0.2s ease;
        }
        .navbar-brand-custom:hover span {
            color: ${currentTheme.primaryColor};
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
                {/* Añadido 'justify-content-center' para centrar el contenido */}
                <div className="container justify-content-center">
                    <Link className="navbar-brand-custom d-flex align-items-center" to="/">
                        <img
                            src="/RacketPlannerLogo.png"
                            alt="RacketPlanner Logo"
                            height="40"
                            className="me-3"
                        />
                        <span className="fw-bold fs-4">RacketPlanner</span>
                    </Link>
                </div>
            </header>
        </>
    );
}