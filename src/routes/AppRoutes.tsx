import { useEffect } from "react";
import socket from "@/core/socket";
import { useLocation } from "react-router-dom";

import { TenantRoutes } from "./TenantRoutes";
import { PublicRoutes } from "./PublicRoutes";
import { getTenantSlug } from "@/core/tenant/tenantResolver";
import { useAuth } from "@/core/context/AuthProvider";
import { GlobalLoading } from "@/modules/common/components/GlobalLoading";

export const AppRoutes = () => {
  const location = useLocation();
  const tenantSlug = getTenantSlug();
  const { state } = useAuth();

  useEffect(() => {
    const onConnect = () => {
      console.log("Socket conectado:", socket.id);
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  // 🔥 1. ESPERA O AUTH TERMINAR
  if (state.isLoading) {
    return <GlobalLoading message="Carregando..." />;
  }

  // 🔥 2. SE ESTÁ LOGADO → SEMPRE APP (TenantRoutes)
  if (state.isAuthenticated) {
    return <TenantRoutes />;
  }

  // 🔥 3. NÃO LOGADO → ROTAS PÚBLICAS
  return <PublicRoutes />;
};