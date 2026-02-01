import React, { Suspense } from "react";
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import SignIn from "./sign-in/SignIn";
import SignUp from "./sign-up/SignUp";
import Home from "./home/Home";
import ConfirmAccount from "./sign-up/ConfirmAccount";
import routeConfig from "./config/routes";
import Checkout from "./template/checkout/Checkout";
import usePermisos from "./hooks/usePermisos";


import "./App.css";
import LoadingSpinner from "./shared-components/LoadingSpinner";

// Lazy loading para componentes pesados
const Dashboard = React.lazy(() => import("./dashboard/Dashboard"));

// Función helper para aplanar rutas (fuera del componente)
function flattenRoutesHelper(routes, parentModulo = null) {
  let flatRoutes = [];

  routes.forEach((route) => {
    if (route.path && route.element) {
      flatRoutes.push({
        path: route.path.replace(/^\//, ""),
        element: route.element,
        label: route.label,
        modulo: route.modulo || parentModulo,
        accion: route.accion,
      });
    }
    const currentModulo = route.modulo || parentModulo;
    if (route.children) {
      flatRoutes = flatRoutes.concat(flattenRoutesHelper(route.children, currentModulo));
    }
  });

  return flatRoutes;
}

function RequireAuth() {
  const isLoggedIn = !!sessionStorage.getItem("accessToken");
  return isLoggedIn ? <Outlet /> : <Navigate to="/signin" replace />;
}

function ProtectedRoute({ modulo, accion, children }) {
  const { tienePermiso } = usePermisos();

  // Si no tiene módulo definido, permitimos (ej: /perfil)
  if (!modulo) return children;

  if (!tienePermiso(modulo, accion || 'view')) {
    // Redirigir a una página de "No autorizado" o al dashboard
    console.warn(`Acceso denegado al módulo: ${modulo}`);
    return <Navigate to="/" replace />;
  }

  return children;
}

// Memoizar el componente App para evitar re-renderizados innecesarios
const App = React.memo(() => {
  // Memoizar las rutas aplanadas dentro del componente
  const flattenRoutes = React.useMemo(() => {
    return flattenRoutesHelper(routeConfig);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/confirm-account" element={<ConfirmAccount />} />

        {/* Rutas privadas (protegidas con RequireAuth) */}
        <Route element={<RequireAuth />}>
          {/* Layout principal con Home como contenedor */}
          <Route path="/" element={<Home />}>
            {/* Ruta por defecto - mostrar dashboard en la URL principal */}
            <Route index element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProtectedRoute modulo="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              </Suspense>
            } />
            <Route path="dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProtectedRoute modulo="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              </Suspense>
            } />

            {/* Rutas dinámicas desde la configuración */}
            {flattenRoutes.map(({ path, element, modulo, accion }, idx) => (
              <Route
                key={idx}
                path={path}
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProtectedRoute modulo={modulo} accion={accion}>
                      {element}
                    </ProtectedRoute>
                  </Suspense>
                }
              />
            ))}
          </Route>
        </Route>

        {/* Catch-all: redirigir a signin */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
});

export default App;
export { routeConfig };
