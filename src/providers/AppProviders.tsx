import { PropsWithChildren } from "react";

import { AuthProvider } from "@/core/context/AuthProvider";
import { SaaSProvider } from "@/core/context/SaaSContext";
import { RestaurantProvider } from "@/core/context/RestaurantContext";
import { PwaProvider } from "@/core/context/PwaContext";
import { UIProvider } from "@/core/context/UIContext";

import { InventoryProvider } from "@/core/context/InventoryContext";
import { FinanceProvider } from "@/core/context/FinanceContext";
import { OrderProvider } from "@/core/context/OrderContext";
import { MenuProvider } from "@/core/context/MenuContext";
import { StaffProvider } from "@/core/context/StaffContext";

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <UIProvider>
      <AuthProvider>
        <SaaSProvider>
          <PwaProvider>
            <RestaurantProvider>

              {/* Providers do sistema do restaurante */}
              <MenuProvider>
                <OrderProvider>
                  <StaffProvider>
                    <InventoryProvider>
                      <FinanceProvider>

                        {children}

                      </FinanceProvider>
                    </InventoryProvider>
                  </StaffProvider>
                </OrderProvider>
              </MenuProvider>

            </RestaurantProvider>
          </PwaProvider>
        </SaaSProvider>
      </AuthProvider>
    </UIProvider>
  );
};