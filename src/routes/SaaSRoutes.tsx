import { Routes, Route, Navigate } from "react-router-dom"

import { Login } from "@/modules/auth/pages/Login"
import { RegisterRestaurant } from "@/modules/auth/pages/RegisterRestaurant"
import { SaaSLogin } from "@/modules/auth/pages/SaaSLogin"

import { SuperAdminDashboard } from "@/modules/superadmin/pages/SuperAdminDashboard"
import { ProtectedSaaSRoute } from "@/routes/guards/ProtectedSaaSRoute"

export const SaaSRoutes = () => {

  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<RegisterRestaurant />} />

      <Route path="/sys-admin" element={<SaaSLogin />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedSaaSRoute>
            <SuperAdminDashboard />
          </ProtectedSaaSRoute>
        }
      />

    </Routes>
  )
}