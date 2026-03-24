import { Routes, Route, Navigate } from "react-router-dom";

import { ClientLogin } from "@/modules/client/pages/ClientLogin";
import { ClientHome } from "@/modules/client/pages/ClientHome";

export const ClientRoutes = () => {

  return (
    <Routes>

      <Route path="/login" element={<ClientLogin />} />

      <Route path="/home" element={<ClientHome />} />

      <Route path="/history" element={<Navigate to="/client/home" replace />} />

    </Routes>
  );
};