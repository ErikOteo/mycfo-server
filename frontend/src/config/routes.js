import React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import PieChartRoundedIcon from "@mui/icons-material/PieChartRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AlarmRoundedIcon from "@mui/icons-material/AlarmRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import DescriptionIcon from "@mui/icons-material/Description";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

// Lazy loading para componentes pesados
const ReporteMensual = React.lazy(() => import("../reportes/reporte-mensual/ReporteMensual"));
const ExcelManagement = React.lazy(() => import("../consolidacion/carga-movimientos/ExcelManagement"));
const CashFlow = React.lazy(() => import("../reportes/cash-flow/CashFlow"));
const ProfitLoss = React.lazy(() => import("../reportes/ProfitAndLoss/ProfitLoss"));
const Notificaciones = React.lazy(() => import("../notificaciones/listado-notificaciones/Notificaciones"));
const NotificationCenter = React.lazy(() => import("../notificaciones/components/NotificationCenter/NotificationCenter"));
const ReminderManager = React.lazy(() => import("../notificaciones/components/ReminderManager/ReminderManager"));
const NotificationSettings = React.lazy(() => import("../notificaciones/components/NotificationSettings/NotificationSettings"));
const EmailConfiguration = React.lazy(() => import("../notificaciones/components/EmailConfiguration/EmailConfiguration"));
const Presupuesto = React.lazy(() => import("../pronostico/presupuesto/Presupuesto"));
const PresupuestoNuevo = React.lazy(() => import("../pronostico/presupuesto/components/PresupuestoNuevo"));
const PresupuestoDetalle = React.lazy(() => import("../pronostico/presupuesto/components/PresupuestoDetalle"));
const MesDetalle = React.lazy(() => import("../pronostico/presupuesto/components/MesDetalle"));
const PronosticoContinuo = React.lazy(() => import("../pronostico/pronostico-continuo/PronosticoContinuo"));
const PronosticoFijo = React.lazy(() => import("../pronostico/pronostico-fijo/PronosticoFijo"));
const CrearForecastConfig = React.lazy(() => import("../pronostico/pronostico-fijo/CrearForecastConfig"));
const PronosticoFijoDetalle = React.lazy(() => import("../pronostico/pronostico-fijo/PronosticoFijoDetalle"));
const HistorialCambios = React.lazy(() => import("../administracion/historial-cambios/HistorialCambios"));
const Roles = React.lazy(() => import("../administracion/roles/Roles"));
const Invitaciones = React.lazy(() => import("../administracion/invitaciones/Invitaciones"));
const Organizacion = React.lazy(() => import("../administracion/organizacion/Organizacion"));
const Perfil = React.lazy(() => import("../administracion/perfil/Perfil"));
const MovimientosCargados = React.lazy(() => import("../registro/movimientos-cargados/MovimientosCargados"));
const MercadoPagoPage = React.lazy(() => import("../consolidacion/mercado-pago/Mercado-Pago"));
const TablaDetalle = React.lazy(() => import("../reportes/reporte-mensual/components/TablaDetalle"));
const TablaRegistrosV2 = React.lazy(() => import("../registro/movimientos-cargados/TablaRegistrosV2"));
const FacturaListPage = React.lazy(() => import("../registro/facturas/FacturaListPage"));
const ConciliacionPanel = React.lazy(() => import("../conciliacion/ConciliacionPanel"));
const CargaSeleccionTipo = React.lazy(() => import("../registro/carga-general/CargaSeleccionTipo"));
const CargaSeleccionMetodo = React.lazy(() => import("../registro/carga-general/CargaSeleccionMetodo"));
const CargaVistaFinal = React.lazy(() => import("../registro/carga-general/CargaVistaFinal"));

const formatCap = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

const cargaTipoMeta = {
  ingreso: { label: "Ingreso", icon: <TrendingUpRoundedIcon /> },
  egreso: { label: "Egreso", icon: <TrendingDownRoundedIcon /> },
  deuda: { label: "Deuda", icon: <AccountBalanceRoundedIcon /> },
  acreencia: { label: "Acreencia", icon: <SavingsRoundedIcon /> },
  factura: { label: "Factura", icon: <DescriptionIcon /> },
  movimientos: { label: "Movimientos bancarios", icon: <CompareArrowsRoundedIcon /> },
};

const cargaModoMeta = {
  formulario: { label: "Formulario", icon: <EditRoundedIcon /> },
  documento: { label: "Documento", icon: <DescriptionIcon /> },
  foto: { label: "Foto", icon: <CameraAltRoundedIcon /> },
  audio: { label: "Audio", icon: <MicRoundedIcon /> },
};

const routeConfig = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardRoundedIcon />,
  },
  {
    label: "Carga de datos",
    path: "/carga",
    icon: <CloudUploadRoundedIcon />,
    element: <CargaSeleccionTipo />,
    modulo: "carga",
  },
  {
    path: "/carga/:tipo",
    element: <CargaSeleccionMetodo />,
    hidden: true,
    breadcrumb: ({ tipo }) => ({
      label: cargaTipoMeta[tipo]?.label ?? formatCap(tipo),
      icon: cargaTipoMeta[tipo]?.icon,
    }),
  },
  {
    path: "/carga/:tipo/:modo",
    element: <CargaVistaFinal />,
    hidden: true,
    breadcrumb: ({ tipo, modo }) => ({
      label: cargaModoMeta[modo]?.label ?? formatCap(modo),
      icon: cargaModoMeta[modo]?.icon,
    }),
  },
  {
    label: "Ver movimientos",
    path: "/ver-movimientos",
    icon: <ListAltRoundedIcon />,
    element: <TablaRegistrosV2 />,
    modulo: "movs",
  },
  {
    label: "Ver facturas",
    path: "/ver-facturas",
    icon: <RequestQuoteRoundedIcon />,
    element: <FacturaListPage />,
    modulo: "facts",
  },
  {
    label: "Conciliación",
    path: "/conciliacion",
    icon: <CompareArrowsRoundedIcon />,
    element: <ConciliacionPanel />,
    modulo: "concil",
  },
  {
    label: "Gestión Bancaria",
    icon: <AccountBalanceRoundedIcon />,
    modulo: "banco",
    children: [
      {
        label: "Carga de movimientos",
        path: "/carga-movimientos",
        icon: <UploadFileRoundedIcon />,
        element: <ExcelManagement />,
        modulo: "banco",
      },
      {
        label: "Mercado Pago",
        path: "/mercado-pago",
        icon: <DescriptionIcon />,
        element: <MercadoPagoPage />,
        modulo: "banco",
      },
    ],
  },
  {
    label: "Reportes",
    icon: <AssessmentRoundedIcon />,
    modulo: "reps",
    children: [
      {
        label: "Reporte mensual",
        path: "/reporte-mensual",
        icon: <CalendarMonthRoundedIcon />,
        element: <ReporteMensual />,
        modulo: "reps",
      },
      {
        label: "Flujo de caja",
        path: "/flujo-de-caja",
        icon: <TimelineRoundedIcon />,
        element: <CashFlow />,
        modulo: "reps",
      },
      {
        label: "Estado de Resultados",
        path: "/estado-de-resultado",
        icon: <PieChartRoundedIcon />,
        element: <ProfitLoss />,
        modulo: "reps",
      },
    ],
  },
  {
    label: "Pronóstico",
    icon: <TrendingUpRoundedIcon />,
    // Este es un contenedor para varios submódulos
    children: [
      {
        label: "Presupuestos",
        path: "/presupuestos",
        icon: <SavingsRoundedIcon />,
        element: <Presupuesto />,
        modulo: "pres",
        children: [
          {
            label: "Nuevo",
            path: "/presupuestos/nuevo",
            icon: <AddCircleOutlineRoundedIcon />,
            element: <PresupuestoNuevo />,
          },
          {
            label: "Detalle",
            path: "/presupuestos/:nombre",
            icon: <DescriptionIcon />,
            element: <PresupuestoDetalle />,
          },
          {
            path: "/presupuestos/:nombre/detalle",
            element: <PresupuestoDetalle />,
            hidden: true,
            breadcrumb: () => null,
          },
          {
            label: (params) => `Mes ${params.mesNombre}`,
            path: "/presupuestos/:nombre/detalle/:mesNombre",
            element: <MesDetalle />,
          },
        ],
      },
      {
        label: "Pronóstico Continuo",
        path: "/pronostico-continuo",
        icon: <AutoGraphRoundedIcon />,
        element: <PronosticoContinuo />,
        modulo: "pron",
        accion: "edit",
      },
      {
        label: "Pronóstico Fijo",
        path: "/pronostico-fijo",
        icon: <TrendingFlatRoundedIcon />,
        element: <PronosticoFijo />,
        modulo: "pron",
        children: [
          {
            label: "Nueva Configuración",
            path: "/pronostico-fijo/configuracion/nueva",
            element: <CrearForecastConfig />,
            hidden: true,
          },
          {
            label: "Editar Configuración",
            path: "/pronostico-fijo/configuracion/:id",
            element: <CrearForecastConfig />,
            hidden: true,
          },
          {
            label: "Detalle Pronóstico",
            path: "/pronostico-fijo/:id",
            element: <PronosticoFijoDetalle />,
            hidden: true,
          },
        ],
      },
    ],
  },
  {
    label: "Notificaciones",
    icon: <NotificationsActiveRoundedIcon />,
    children: [
      {
        label: "Centro de Notificaciones",
        path: "/listado-notificaciones",
        icon: <NotificationsNoneRoundedIcon />,
        element: <Notificaciones />,
      },
      {
        label: "Recordatorios",
        path: "/recordatorios",
        icon: <AlarmRoundedIcon />,
        element: <ReminderManager />,
      },
      {
        label: "Configuración",
        path: "/configuracion-notificaciones",
        icon: <SettingsRoundedIcon />,
        element: <NotificationSettings />,
      },
      // {
      //   label: "Configuración Email",
      //   path: "/configuracion-email",
      //   icon: <DescriptionIcon />,
      //   element: <EmailConfiguration />,
      // },
    ],
  },
  {
    path: "/organizacion",
    element: <Organizacion />,
    hidden: true,
    modulo: "admin",
  },
  {
    path: "/historial-cambios",
    element: <HistorialCambios />,
    hidden: true,
    modulo: "admin",
  },
  {
    path: "/roles",
    element: <Roles />,
    hidden: true,
    modulo: "admin",
  },
  {
    path: "/invitaciones",
    element: <Invitaciones />,
    hidden: true,
    modulo: "admin",
  },
  {
    path: "/perfil",
    element: <Perfil />,
    hidden: true,
  },
];

export default routeConfig;
