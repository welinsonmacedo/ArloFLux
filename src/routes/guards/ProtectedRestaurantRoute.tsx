import React, { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { Lock } from "lucide-react";

import { useAuth } from "@/core/context/AuthProvider";
import { useRestaurant } from "@/core/context/RestaurantContext";
import { GlobalLoading } from "@/modules/common/components/GlobalLoading";
import { Role } from "@/types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  requiredRoute?: string;
  requiredFeature?: "allowKds" | "allowCashier" | "allowReports" | "allowInventory" | "allowHR";
}

export const ProtectedRestaurantRoute = ({
  children,
  allowedRoles,
  requiredRoute,
  requiredFeature,
}: PropsWithChildren<ProtectedRouteProps>) => {

  const { state: authState, checkPermission } = useAuth();
  const { state: restState } = useRestaurant();

  if (authState.isLoading || restState.isLoading) {
    return <GlobalLoading message="Verificando acessos..." />;
  }

  if (!authState.isAuthenticated || !authState.currentUser) {
    return <Navigate to={`/login${window.location.search}`} replace />;
  }

  if (requiredRoute !== "/time-clock") {
    if (!restState.activeModule && restState.allowedModules.length > 0) {
      return <Navigate to="/modules" replace />;
    }
  }

  if (requiredFeature && restState.planLimits) {
    if (!restState.planLimits[requiredFeature]) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-10 text-center">
          <Lock size={48} className="text-orange-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">
            Funcionalidade indisponível
          </h2>
          <p className="text-gray-500 mt-2">
            Seu plano não inclui acesso a este módulo.
          </p>
        </div>
      );
    }
  }

  if (allowedRoles && !checkPermission(allowedRoles)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center">
        <Lock size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">
          Acesso negado
        </h2>
        <p className="text-gray-500 mt-2">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};