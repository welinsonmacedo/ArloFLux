import { PropsWithChildren } from "react";

import { AuthProvider } from "@/core/context/AuthProvider";
import { SaaSProvider } from "@/core/context/SaaSContext";
import { RestaurantProvider } from "@/core/context/RestaurantContext";
import { PwaProvider } from "@/core/context/PwaContext";
import { UIProvider } from "@/core/context/UIContext";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <UIProvider>
      <AuthProvider>
        <SaaSProvider>
          <PwaProvider>
            <RestaurantProvider>
              {children}
            </RestaurantProvider>
          </PwaProvider>
        </SaaSProvider>
      </AuthProvider>
    </UIProvider>
  );
};