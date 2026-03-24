import { AppProviders } from "./providers/AppProviders";
import { SecurityGuard } from "./modules/common/components/SecurityGuard";
import { PwaGuard } from "./modules/common/components/PwaGuard";
import { CookieConsent } from "./modules/common/components/CookieConsent";
import { InstallPWA } from "./modules/common/components/InstallPWA";
import { ConnectionStatus } from "./modules/common/components/ConnectionStatus";
import { AppRoutes } from "./routes/AppRoutes";
const App = () => {
  return (
    <AppProviders>
      <SecurityGuard>
        <PwaGuard>
          <CookieConsent />
          <InstallPWA />
          <ConnectionStatus />
          <AppRoutes />
        </PwaGuard>
      </SecurityGuard>
    </AppProviders>
  );
};

export default App;