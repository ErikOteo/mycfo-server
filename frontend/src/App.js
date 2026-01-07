import React, { Suspense } from "react";
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import SignIn from "./sign-in/SignIn";
import SignUp from "./sign-up/SignUp";
import Home from "./home/Home";
import ConfirmAccount from "./sign-up/ConfirmAccount";
import routeConfig from "./config/routes";
import Checkout from "./template/checkout/Checkout";
import Perfil from "./administracion/perfil/Perfil";

import "./App.css";
import Organizacion from "./administracion/organizacion/Organizacion";
import LoadingSpinner from "./shared-components/LoadingSpinner";

// Lazy loading para componentes pesados
const Dashboard = React.lazy(() => import("./dashboard/Dashboard"));

// Función helper para aplanar rutas (fuera del componente)
function flattenRoutesHelper(routes) {
  let flatRoutes = [];

  routes.forEach((route) => {
    if (route.path && route.element) {
      flatRoutes.push({
        path: route.path.replace(/^\//, ""),
        element: route.element,
        label: route.label,
      });
    }
    if (route.children) {
      flatRoutes = flatRoutes.concat(flattenRoutesHelper(route.children));
    }
  });

  return flatRoutes;
}

function RequireAuth() {
  const isLoggedIn = !!sessionStorage.getItem("accessToken");
  return isLoggedIn ? <Outlet /> : <Navigate to="/signin" replace />;
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
                <Dashboard />
              </Suspense>
            } />
            <Route path="dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="perfil" element={<Perfil />} />
            <Route path="organizacion" element={<Organizacion />} />
            
            {/* Rutas dinámicas desde la configuración */}
            {flattenRoutes.map(({ path, element }, idx) => (
              <Route 
                key={idx} 
                path={path} 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    {element}
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
