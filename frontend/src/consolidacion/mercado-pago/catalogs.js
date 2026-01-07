// /mercado-pago/catalogs.js

// Estados de pago típicos de MP (podés ajustar a tu backend)
export const PAYMENT_STATUS = [
  { value: "approved", label: "Aprobado" },
  { value: "pending", label: "Pendiente" },
  { value: "in_process", label: "En proceso" },
  { value: "in_mediation", label: "En mediación" },
  { value: "rejected", label: "Rechazado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
  { value: "charged_back", label: "Chargeback" },
];

export const UI = {
  radius: 12,
  gap: 1.5, // spacing en rem
  cardVariant: "outlined",
};

export const statusLabel = (v) =>
  PAYMENT_STATUS.find((s) => s.value === v)?.label || v || "—";

export const statusChipProps = (v) => {
  switch (v) {
    case "approved":
      return { color: "success", label: "Aprobado", variant: "outlined" };
    case "pending":
    case "in_process":
      return { color: "warning", label: statusLabel(v), variant: "outlined" };
    case "rejected":
    case "cancelled":
    case "charged_back":
      return { color: "error", label: statusLabel(v), variant: "outlined" };
    case "refunded":
      return { color: "info", label: "Reembolsado", variant: "outlined" };
    case "in_mediation":
      return { color: "default", label: "Mediación", variant: "outlined" };
    default:
      return { color: "default", label: statusLabel(v), variant: "outlined" };
  }
};

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const currencyFormatter = (
  amount,
  currency = "ARS",
  locale = "es-AR"
) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount ?? 0);
  } catch {
    return amount != null ? `${amount} ${currency || ""}`.trim() : "—";
  }
};
