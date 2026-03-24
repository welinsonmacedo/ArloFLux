import { Routes, Route, Navigate } from "react-router-dom";

import { Login } from "@/modules/auth/pages/Login";
import { RegisterRestaurant } from "@/modules/auth/pages/RegisterRestaurant";
import { PrivacyPolicy } from "@/modules/common/pages/PrivacyPolicy";
import { TermsOfService } from "@/modules/common/pages/TermsOfService";
import { SaaSLogin } from "@/modules/auth/pages/SaaSLogin";
import { SuperAdminDashboard } from "@/modules/superadmin/pages/SuperAdminDashboard";

import { ProtectedSaaSRoute } from "./guards/ProtectedSaaSRoute";

export const PublicRoutes = () => {

  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<RegisterRestaurant />} />

      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route path="/terms" element={<TermsOfService />} />

      <Route path="/sys-admin" element={<SaaSLogin />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedSaaSRoute>
            <SuperAdminDashboard />
          </ProtectedSaaSRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" />} />

    </Routes>
  );
};