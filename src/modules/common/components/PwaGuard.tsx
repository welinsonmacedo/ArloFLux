import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { useSaaS } from "@/core/context/SaaSContext";

type OS = "iOS" | "Android" | "Desktop";

export const PwaGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { state: saasState } = useSaaS();

  const [os, setOS] = useState<OS>("Desktop");
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOS("iOS");
    } else if (/android/.test(userAgent)) {
      setOS("Android");
    } else {
      setOS("Desktop");
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    setIsPWA(standalone);
  }, []);

  const currentPath = useMemo(
    () => (location.pathname || "").toLowerCase(),
    [location.pathname]
  );

  const isBypassRoute = useMemo(() => {
    return (
      currentPath === "/" ||
      currentPath === "/login" ||
      currentPath.startsWith("/privacy") ||
      currentPath.startsWith("/terms") ||
      currentPath.startsWith("/sys-admin") ||
      currentPath.startsWith("/sysadmin") ||
      currentPath.startsWith("/dashboard")
    );
  }, [currentPath]);

  if (isBypassRoute) return <>{children}</>;

  if (isPWA) return <>{children}</>;

  if (saasState.isLoading) return null;

  const pwaRequired = saasState.globalSettings?.pwaRequired !== false;

  if (!pwaRequired) return <>{children}</>;

  const isClientRoute = currentPath.startsWith("/client");

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
      
      <div className="max-w-md space-y-6">

        <div className="flex justify-center">
          <Smartphone size={64} className="text-blue-500" />
        </div>

        <h1 className="text-2xl font-bold">
          Instale o aplicativo
        </h1>

        <p className="text-slate-400 text-sm">
          Para continuar utilizando o sistema, instale o aplicativo na tela inicial do seu dispositivo.
        </p>

        {os === "iOS" && (
          <p className="text-sm text-slate-300">
            No Safari toque em <b>Compartilhar</b> e depois <b>Adicionar à Tela de Início</b>.
          </p>
        )}

        {os === "Android" && (
          <p className="text-sm text-slate-300">
            No navegador toque no menu e selecione <b>Instalar aplicativo</b>.
          </p>
        )}

        {os === "Desktop" && (
          <p className="text-sm text-slate-300">
            Use o botão de instalar na barra de endereço do navegador.
          </p>
        )}

      </div>

    </div>
  );
};