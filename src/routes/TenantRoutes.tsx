import { Routes, Route, Navigate } from "react-router-dom";

import { Login } from "@/modules/auth/pages/Login";
import { ModuleSelector } from "@/modules/auth/pages/ModuleSelector";

import { WaiterPanel } from "@/modules/operational/components/WaiterPanel";
import { KitchenPanel } from "@/modules/operational/components/KitchenPanel";

import { RestaurantDashboard } from "@/modules/admin/pages/RestaurantDashboard";
import { AdminDashboard } from "@/modules/admin/pages/AdminDashboard";
import { SettingsDashboard } from "@/modules/admin/pages/SettingsDashboard";

import { FinanceDashboard } from "@/modules/finance/pages/FinanceDashboard";
import { InventoryDashboard } from "@/modules/inventory/pages/InventoryDashboard";
import { StaffDashboard } from "@/modules/staff/pages/StaffDashboard";
import { AuditDashboard } from "@/modules/support/pages/AuditDashboard";

import { CommerceDashboard } from "@/modules/operational/pages/CommerceDashboard";
import { TimeClock } from "@/modules/operational/pages/TimeClock";

import { Role } from "@/types";

import { ProtectedRestaurantRoute } from "./guards/ProtectedRestaurantRoute";
import { ClientRoutes } from "./ClientRoutes";
import { ManualPage } from "@/modules/support/pages/ManualPage";

export const TenantRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/modules" element={<ModuleSelector />} />

      <Route path="/waiter" element={<WaiterPanel />} />
      <Route path="/kitchen" element={<KitchenPanel />} />

      <Route path="/client/table/:tableId" element={<ClientRoutes />} />

      <Route
        path="/time-clock"
        element={
          <ProtectedRestaurantRoute requiredFeature="allowHR">
            <TimeClock />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/restaurant/*"
        element={
          <ProtectedRestaurantRoute>
            <RestaurantDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/commerce/*"
        element={
          <ProtectedRestaurantRoute>
            <CommerceDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/inventory/*"
        element={
          <ProtectedRestaurantRoute requiredFeature="allowInventory">
            <InventoryDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/rh/*"
        element={
          <ProtectedRestaurantRoute requiredFeature="allowHR">
            <StaffDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/audit/*"
        element={
          <ProtectedRestaurantRoute allowedRoles={[Role.ADMIN]}>
            <AuditDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRestaurantRoute allowedRoles={[Role.ADMIN]}>
            <AdminDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/settings/*"
        element={
          <ProtectedRestaurantRoute allowedRoles={[Role.ADMIN]}>
            <SettingsDashboard />
          </ProtectedRestaurantRoute>
        }
      />

      <Route
        path="/finance/*"
        element={
          <ProtectedRestaurantRoute allowedRoles={[Role.ADMIN]}>
            <FinanceDashboard />
          </ProtectedRestaurantRoute>
        }
      />
  <Route
        path="/manual/*"
        element={
          <ProtectedRestaurantRoute>
            <ManualPage/>
          </ProtectedRestaurantRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};