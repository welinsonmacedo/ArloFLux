import { Routes, Route, Navigate } from "react-router-dom";
import { ClientLogin } from "@/modules/client/pages/ClientLogin";
import { ClientHome } from "@/modules/client/pages/ClientHome";

export const ClientRoutes = () => {
  return (
    <Routes>
      {/* O caminho base já é /client vindo do AppRoutes */}
      <Route path="login" element={<ClientLogin />} /> 
      <Route path="home" element={<ClientHome />} />
      
      {/* Redirecionamento padrão dentro do módulo do cliente */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};