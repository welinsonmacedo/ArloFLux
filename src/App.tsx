import { AppProviders } from "./providers/AppProviders";
import { SecurityGuard } from "./modules/common/components/SecurityGuard";
import { PwaGuard } from "./modules/common/components/PwaGuard";
import { CookieConsent } from "./modules/common/components/CookieConsent";
import { InstallPWA } from "./modules/common/components/InstallPWA";
import { ConnectionStatus } from "./modules/common/components/ConnectionStatus";
import { AppRoutes } from "./routes/AppRoutes";

// Importações para as melhorias
import { QueryProvider } from "@/core/providers/QueryProvider";
import { ErrorBoundary } from "@/core/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";

// Feature flags para controlar quais features estão ativas
const FEATURES = {
  errorBoundary: import.meta.env.VITE_ENABLE_ERROR_BOUNDARY !== 'false',
  queryCache: import.meta.env.VITE_ENABLE_QUERY_CACHE !== 'false',
  toastNotifications: import.meta.env.VITE_ENABLE_TOAST !== 'false',
  sentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',
};

// Inicializar Sentry condicionalmente
if (FEATURES.sentry && import.meta.env.PROD) {
  import("@/core/monitoring/sentry").then(({ initSentry }) => {
    initSentry();
  });
}

const App = () => {
  // Componente base com todos os seus componentes existentes
  const BaseApp = () => (
    <AppProviders>
      <SecurityGuard>
        <PwaGuard>
          {FEATURES.toastNotifications && <Toaster />}
          <CookieConsent />
          <InstallPWA />
          <ConnectionStatus />
          <AppRoutes />
        </PwaGuard>
      </SecurityGuard>
    </AppProviders>
  );

  // Aplica os wrappers condicionalmente
  let AppContent = <BaseApp />;

  if (FEATURES.queryCache) {
    AppContent = <QueryProvider>{AppContent}</QueryProvider>;
  }

  if (FEATURES.errorBoundary) {
    AppContent = <ErrorBoundary>{AppContent}</ErrorBoundary>;
  }

  return AppContent;
};

export default App; 