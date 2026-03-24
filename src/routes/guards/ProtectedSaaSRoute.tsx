import React, { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useSaaS } from "@/core/context/SaaSContext";
import { GlobalLoading } from "@/modules/common/components/GlobalLoading";

export const ProtectedSaaSRoute = ({ children }: PropsWithChildren) => {

  const { state } = useSaaS();

  if (state.isLoading) {
    return <GlobalLoading message="Verificando sessão..." />;
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/sys-admin" replace />;
  }

  return <>{children}</>;
};