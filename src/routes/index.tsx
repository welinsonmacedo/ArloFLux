import { useLocation } from "react-router-dom";
import { useEffect } from "react";

import { TenantRoutes } from "./TenantRoutes";
import { PublicRoutes } from "./PublicRoutes";

import socket from "@/core/socket";
import { getTenantSlug } from "@/core/tenant/tenantResolver";

export const AppRoutes = () => {
  const location = useLocation();

  // resolve slug diretamente
  const tenantSlug = getTenantSlug();

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected", socket.id);
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  // se tiver slug → sistema multi-tenant
  if (tenantSlug) {
    return <TenantRoutes />;
  }

  // se não tiver → rotas públicas
  return <PublicRoutes />;
};