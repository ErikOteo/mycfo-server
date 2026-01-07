// Utilidades de formateo para notificaciones

export const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";

  try {
    // Fechas provenientes de MySQL sin hora
    if (dateString.includes("00:00:00")) {
      const datePart = dateString.split(" ")[0];
      const [year, month, day] = datePart.split("-");
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      if (isNaN(date.getTime())) {
        return "Fecha invalida";
      }

      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    // Para Instants (ISO) o strings con hora
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      date = new Date(`${dateString}Z`);
    }

    if (isNaN(date.getTime())) {
      return "Fecha invalida";
    }

    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  } catch (error) {
    console.error("Error formateando fecha:", error, "Input:", dateString);
    return "Fecha invalida";
  }
};

export const formatNumber = (value) => {
  if (typeof value === "number") {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (typeof value === "string") {
    // Detectar notacion cientifica y formatear
    if (value.includes("E+") || value.includes("e+")) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      }
    }

    // Detectar numeros en formato cientifico en texto
    const scientificMatch = value.match(/\$-?\d+\.?\d*E\+\d+/g);
    if (scientificMatch) {
      let formattedValue = value;
      scientificMatch.forEach((match) => {
        const num = parseFloat(match.replace("$", ""));
        if (!isNaN(num)) {
          const formatted = new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(num);
          formattedValue = formattedValue.replace(match, formatted);
        }
      });
      return formattedValue;
    }
  }

  return value;
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return "Hace unos minutos";
  } else if (diffInHours < 24) {
    return `Hace ${Math.floor(diffInHours)} horas`;
  } else {
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  }
};

// Funcion especifica para fechas de movimientos (sin hora)
export const formatMovementDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";

  try {
    // Si la fecha ya esta en formato ISO, usarla directamente
    if (dateString.includes("T") || dateString.includes("Z")) {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
      });
    }

    // Para fechas en formato "YYYY-MM-DD HH:mm:ss"
    const datePart = dateString.split(" ")[0];
    const [year, month, day] = datePart.split("-");

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return "Fecha invalida";
    }

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (isNaN(date.getTime())) {
      return "Fecha invalida";
    }

    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formateando fecha:", error, "Input:", dateString);
    return "Fecha invalida";
  }
};
