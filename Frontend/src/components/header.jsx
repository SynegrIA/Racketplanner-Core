import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useTranslation } from 'react-i18next';
// Importar Bootstrap JS si no está importado en otro lugar
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function Header() {
    const { t, i18n } = useTranslation();
    const { currentTheme } = useTheme();

    const changeLanguage = (lng, e) => {
        e.preventDefault();
        i18n.changeLanguage(lng);

        // Cerrar el dropdown manualmente después de cambiar el idioma
        const dropdownMenu = document.getElementById('languageDropdownMenu');
        if (dropdownMenu.classList.contains('show')) {
            document.getElementById('languageDropdown').click();
        }

        localStorage.setItem('preferredLanguage', lng);
    };

    useEffect(() => {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && savedLanguage !== i18n.language) {
            i18n.changeLanguage(savedLanguage);
        }
    }, []);

    // Estilos actualizados para mantener el logo centrado en todos los tamaños
    const styleTag = `
        .navbar-brand-custom {
            text-decoration: none;
            transition: all 0.3s ease;
            margin: 0;
        }
        .navbar-brand-custom span {
            color: #333;
            transition: color 0.2s ease;
        }
        .navbar-brand-custom:hover span {
            color: ${currentTheme.primaryColor};
        }
        .btn-registro, .language-selector .dropdown-toggle {
            transition: all 0.3s ease;
            background-color: ${currentTheme.primaryColor};
            color: #fff;
            border-radius: 10px;
            border: none;
        }
        .btn-registro:hover, .language-selector .dropdown-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            background-color: ${currentTheme.primaryColor}dd; /* Color primario con transparencia */
        }
        
        .language-selector .dropdown-toggle::after {
            display: none; /* Oculta la flecha por defecto de Bootstrap */
        }

        .language-selector .dropdown-menu {
            min-width: auto;
            border-radius: 8px;
            border: 1px solid #eee;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin-top: 5px;
        }

        .language-selector .dropdown-item {
            cursor: pointer;
            padding: 0.5rem 1rem;
        }
        
        .language-selector .dropdown-item:hover {
            background-color: ${currentTheme.primaryColor}22; /* Color primario con alta transparencia */
        }
        
        /* Estilos para el header grid */
        .header-grid {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            width: 100%;
        }
        
        .header-left {
            justify-self: start;
        }
        
        .header-center {
            justify-self: center;
            display: flex;
            align-items: center;
        }
        
        .header-right {
            justify-self: end;
        }
        
        /* Estilos responsive */
        @media (min-width: 768px) {
            .btn-text-full {
                display: inline;
            }
            .btn-text-short {
                display: none;
            }
        }
        
        @media (max-width: 767px) {
            .navbar-brand-text {
                display: none;
            }
            .btn-registro, .language-selector .dropdown-toggle {
                padding: 6px 8px !important;
            }
            .btn-text-full {
                display: none;
            }
            .btn-text-short {
                display: inline;
            }
            /* Ajustar tamaño del logo en móvil si es necesario */
            .navbar-brand-custom img {
                height: 35px;
            }
        }
    `;

    return <>
        <style>{styleTag}</style>
        <header className="navbar navbar-light bg-white shadow-sm" style={{
            borderBottom: `4px solid ${currentTheme.primaryColor}`
        }}>
            <div className="container" style={{ height: "60px" }}>
                <div className="header-grid">
                    {/* Columna izquierda - Selector de idioma */}
                    <div className="header-left">
                        <div className="dropdown language-selector">
                            <button
                                className="btn dropdown-toggle"
                                type="button"
                                id="languageDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                style={{
                                    padding: '6px 10px'
                                }}
                            >
                                <i className="bi bi-translate me-1"></i>
                                {i18n.language === 'es' ? 'ES' : i18n.language === 'fr' ? 'FR' : i18n.language.toUpperCase()}
                            </button>
                            <ul className="dropdown-menu" id="languageDropdownMenu" aria-labelledby="languageDropdown">
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => changeLanguage('es', e)}
                                        aria-label="Cambiar a español"
                                    >
                                        ES (Español)
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => changeLanguage('fr', e)}
                                        aria-label="Cambiar a francés"
                                    >
                                        FR (Français)
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={(e) => changeLanguage('en', e)}
                                        aria-label="Cambiar a inglés"
                                    >
                                        EN (English)
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Columna central - Logo */}
                    <div className="header-center">
                        <Link className="navbar-brand-custom d-flex align-items-center" to="/">
                            <img src={currentTheme.logoUrl} alt={currentTheme.nombre} height={40} className="me-2" />
                            <span className="navbar-brand-text fw-bold fs-5">{currentTheme.nombre}</span>
                        </Link>
                    </div>

                    {/* Columna derecha - Botón de registro */}
                    <div className="header-right">
                        <Link to="/signup" className="btn btn-registro" style={{
                            padding: '6px 10px'
                        }}>
                            <i className="bi bi-person-plus me-1"></i>
                            <span className="btn-text-short">{t("registrarse")}</span>
                            <span className="btn-text-full">{t("registrar-jugador")}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    </>;
}