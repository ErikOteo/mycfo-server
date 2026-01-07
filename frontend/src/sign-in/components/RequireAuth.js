// auth/RequireAuth.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const isLoggedIn = !!sessionStorage.getItem("accessToken"); // 👈 usa sessionStorage
  
  return isLoggedIn ? <Outlet /> : <Navigate to="/signin" replace />;
}
