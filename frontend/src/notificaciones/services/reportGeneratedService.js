import axios from "axios";
import API_CONFIG from "../../config/api-config";

/**
 * Envía un evento de "reporte generado" al servicio de notificaciones.
 * Se usa cuando el usuario exporta un PDF/Excel de cualquier sección.
 */
export async function sendReportGenerated({
  reportType,
  reportName,
  period,
  downloadUrl = null,
  hasAnomalies = false,
}) {
  try {
    const userId = sessionStorage.getItem("sub");
    const token = sessionStorage.getItem("accessToken");

    const headers = {};
    if (userId) headers["X-Usuario-Sub"] = userId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const payload = {
      userId: userId || null,
      reportType,
      reportName,
      period,
      downloadUrl,
      generatedAt: new Date().toISOString(),
      hasAnomalies: Boolean(hasAnomalies),
    };

    await axios.post(
      `${API_CONFIG.NOTIFICACION}/api/events/report-generated`,
      payload,
      { headers },
    );
  } catch (error) {
    console.error("[Notificaciones] Error enviando evento de reporte:", error);
  }
}
