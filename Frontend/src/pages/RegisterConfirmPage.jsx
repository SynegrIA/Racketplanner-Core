import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { DOMINIO_BACKEND } from "../config/config.js";
import { useTranslation } from 'react-i18next';

export default function RegisterConfirmPage() {
  const { t } = useTranslation()
  const {
    telefono
  } = useParams();
  const {
    currentTheme
  } = useTheme();
  const navigate = useNavigate();

  // Estados
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Cargar datos del usuario al inicio
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!telefono) {
        setError(t('registro-error-datos'));
        setCargando(false);
        return;
      }
      try {
        const response = await fetch(`${DOMINIO_BACKEND}/jugadores/${telefono}`);
        const data = await response.json();
        if (data.success) {
          // <-- Cambiar data.status a data.success
          setUsuario(data.data);
        } else {
          throw new Error("User not found");
        }
      } catch (err) {
        console.error("Error al cargar datos del usuario:", err);
        setError(t('registro-error-datos'));
      } finally {
        setCargando(false);
      }
    };
    cargarDatosUsuario();
  }, [telefono]);

  // Confirmar registro
  const handleConfirmar = async () => {
    setConfirmando(true);
    setMensaje("");
    try {
      const response = await fetch(`${DOMINIO_BACKEND}/jugadores/confirmar-numero/${telefono}`, {
        method: "PATCH"
      });
      const data = await response.json();
      if (data.success) {
        setConfirmacionExitosa(true);
        setMensaje(t('registro.confirmacion'));
      } else {
        throw new Error(t('registro.error'));
      }
    } catch (err) {
      console.error("Error en la confirmación:", err);
      setError(t('registro.error'));
    } finally {
      setConfirmando(false);
    }
  };

  // Renderizar estado de carga
  if (cargando) {
    return <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-primary" role={t("status")}>
        <span className="visually-hidden">{t("cargando")}</span>
      </div>
    </div>;
  }

  // Renderizar mensaje de error
  if (error) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_1")}</div>
              <h3 className="text-danger mb-3">{t("error")}</h3>
              <p className="lead">{error}</p>
              <button onClick={() => window.close()} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Renderizar confirmación exitosa
  if (confirmacionExitosa) {
    return <div className="container min-vh-100 d-flex align-items-center">
      <div className="row w-100">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          <div className="card shadow">
            <div className="card-body text-center">
              <div className="display-1 mb-4">{t("key_2")}</div>
              <h3 className="text-success mb-3">{t("registro-confirmado")}</h3>
              <p className="lead">{mensaje}</p>
              <p>{t("ya-puedes-comenzar-a-recibir-invitaciones-para-par")}</p>
              <button onClick={() => window.close()} className="btn btn-primary mt-3">{t("cerrar")}</button>
            </div>
          </div>
        </div>
      </div>
    </div>;
  }

  // Renderizar formulario de confirmación
  return <div className="container min-vh-100 d-flex align-items-center py-5">
    <div className="row w-100">
      <div className="col-12 col-md-8 col-lg-6 mx-auto">
        <div className="card shadow" style={{
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div className="card-header text-center py-4" style={{
            background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
            color: '#FFFFFF',
            borderBottom: 'none'
          }}>
            <h2 className="mb-0 fw-bold">
              <i className="bi bi-check-circle-fill me-2"></i>{t("confirmar-registro")}</h2>
          </div>

          <div className="card-body p-4">
            {mensaje && <div className="alert alert-info mb-4">{mensaje}</div>}

            <div className="text-center mb-4">
              <div className="display-1">{t("key_3")}</div>
              <h4 className="mt-3">{t("por-favor-confirma-tus-datos")}</h4>
              <p className="text-muted">{t("verifica-que-la-informacion-es-correcta-antes-de-c")}</p>
            </div>

            <ul className="list-group mb-4">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span><i className="bi bi-person me-2"></i>{t("nombre")}</span>
                <span className="fw-bold">{usuario?.['Nombre Real'] || 'N/A'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span><i className="bi bi-telephone me-2"></i>{t("telefono")}</span>
                <span className="fw-bold">{usuario?.Teléfono || 'N/A'}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span><i className="bi bi-bar-chart me-2"></i>{t("nivel-de-juego")}</span>
                <span className="fw-bold">{t("nivel_1")}{usuario?.Nivel || 'N/A'}</span>
              </li>
              {usuario?.['Notificaciones'] && <>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-calendar-week me-2"></i>{t("invitaciones-semanales")}</span>
                  <span className="fw-bold">{usuario?.['Máximo de invitaciones semanales'] || '0'}</span>
                </li>
                <li className="list-group-item">
                  <div className="mb-2"><i className="bi bi-clock me-2"></i>{t("horarios-preferidos")}</div>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {usuario?.['Horario Preferencia']?.includes('mañana') && <span className="badge bg-primary"><i className="bi bi-sunrise me-1"></i>{t("manana")}</span>}
                    {usuario?.['Horario Preferencia']?.includes('tarde') && <span className="badge bg-primary"><i className="bi bi-sun me-1"></i>{t("tarde")}</span>}
                    {usuario?.['Horario Preferencia']?.includes('noche') && <span className="badge bg-primary"><i className="bi bi-moon me-1"></i>{t("noche")}</span>}
                    {!usuario?.['Horario Preferencia']?.length && <span className="text-muted">{t("no-se-han-seleccionado-preferencias")}</span>}
                  </div>
                </li>
              </>}
            </ul>

            <button className="btn btn-success btn-lg w-100" onClick={handleConfirmar} disabled={confirmando} style={{
              backgroundColor: currentTheme.primaryColor,
              borderColor: currentTheme.primaryColor
            }}>
              {confirmando ? <>
                <span className="spinner-border spinner-border-sm me-2" role={t("status")} aria-hidden={t("true")}></span>{t("procesando")}</> : <>
                <i className="bi bi-check-circle me-2"></i>{t("confirmar-mi-registro")}</>}
            </button>
          </div>

          <div className="card-footer text-center py-3" style={{
            background: '#f8f9fa',
            borderTop: '1px solid rgba(0,0,0,0.05)'
          }}>
            <p className="mb-0">
              <i className="bi bi-shield-check me-2"></i>{t("tus-datos-estan-protegidos-segun-la-lopd")}</p>
          </div>
        </div>
      </div>
    </div>
  </div>;
}