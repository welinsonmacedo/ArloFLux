import { useEffect } from "react";
import socket from "@/core/socket";
import { useLocation } from "react-router-dom";

import { TenantRoutes } from "./TenantRoutes";
import { PublicRoutes } from "./PublicRoutes";
import { ClientRoutes } from "./ClientRoutes"; // Importação necessária
import { useAuth } from "@/core/context/AuthProvider";
import { GlobalLoading } from "@/modules/common/components/GlobalLoading";

export const AppRoutes = () => {
  const { state } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onConnect = () => {
      console.log("Socket conectado:", socket.id);
    };

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  // 1. ESPERA O AUTH TERMINAR
  if (state.isLoading) {
    return <GlobalLoading message="Carregando..." />;
  }

  // 2. PRIORIDADE: ROTAS DE CLIENTE
  // Se a URL começar por /client, renderiza o ClientRoutes. 
  // Isso garante que o PWA instalado com start_url: "/client/login" funcione corretamente.
  if (location.pathname.startsWith('/client')) {
    return <ClientRoutes />;
  }

  // 3. SE ESTÁ LOGADO NO PAINEL → SEMPRE APP (TenantRoutes)
  if (state.isAuthenticated) {
    return <TenantRoutes />;
  }

  // 4. NÃO LOGADO E FORA DO ESCOPO CLIENTE → ROTAS PÚBLICAS (Login Admin/Restaurante)
  return <PublicRoutes />;
};