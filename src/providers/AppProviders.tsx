import { PropsWithChildren } from "react";

import { AuthProvider } from "@/core/context/AuthProvider";
import { SaaSProvider } from "@/core/context/SaaSContext";
import { RestaurantProvider } from "@/core/context/RestaurantContext";
import { PwaProvider } from "@/core/context/PwaContext";
import { UIProvider } from "@/core/context/UIContext";
import { InventoryProvider } from "@/core/context/InventoryContext";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <UIProvider>
      <AuthProvider>
        <SaaSProvider>
          <PwaProvider>
            <RestaurantProvider>
                <InventoryProvider>
  {children}
                </InventoryProvider>
            
            </RestaurantProvider>
          </PwaProvider>
        </SaaSProvider>
      </AuthProvider>
    </UIProvider>
  );
};