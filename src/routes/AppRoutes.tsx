import { useEffect } from "react";
import socket from "@/core/socket";
import { useLocation } from "react-router-dom";

import { TenantRoutes } from "./TenantRoutes";
import { PublicRoutes } from "./PublicRoutes";
import { getTenantSlug } from "@/core/tenant/tenantResolver";

export const AppRoutes = () => {

  const location = useLocation();
  const tenantSlug = getTenantSlug();

  useEffect(() => {
    const onConnect = () => {
      console.log("Socket conectado:", socket.id);
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  if (tenantSlug) {
    return <TenantRoutes />;
  }

  return <PublicRoutes />;
};