import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Footer() {
    const { currentTheme } = useTheme();

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

    return (
        <>
            <style>{styleTag}</style>
            <footer
                className="text-center py-4 mt-auto"
                style={{
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #dee2e6'
                }}
            >
                <div className="container d-flex justify-content-center align-items-center">
                    <img
                        src="/logo.png"
                        alt="SynergIA Logo"
                        height="24"
                        className="me-2"
                    />
                    <span className="text-muted">
                        Desarrollado por&nbsp;
                        <a
                            href="https://synergiapro.es/" // Cambia esta URL por la real
                            target="_blank"
                            rel="noopener noreferrer"
                            className="synergia-link"
                        >
                            SynergIA
                        </a>
                    </span>
                </div>
            </footer>
        </>
    );
}