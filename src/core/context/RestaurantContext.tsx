import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import { RestaurantTheme, PlanLimits, RestaurantBusinessInfo, SystemModule } from "@/types"
import { getTenantSlug } from "@/core/tenant/tenantResolver"
import { supabase } from "@/core/api/supabaseClient"

interface RestaurantState {
  isLoading: boolean
  tenantSlug: string | null
  tenantId: string | null
  isValidTenant: boolean
  isInactiveTenant: boolean
  isAuthorized: boolean
  tableId: string | null
  planLimits: PlanLimits
  allowedModules: SystemModule[]
  allowedFeatures: string[]
  activeModule: SystemModule | null
  theme: RestaurantTheme
  globalSettings: any
  businessInfo: RestaurantBusinessInfo
}

type Action =
  | { type: "SET_LOADING"; value: boolean }
  | { type: "TENANT_NOT_FOUND" }
  | { type: "TENANT_INACTIVE" }
  | { type: "SET_AUTHORIZED"; tenantId: string; tableId: string }
  | { type: "SET_ACTIVE_MODULE"; module: SystemModule }
  | { type: "INIT_DATA"; payload: Partial<RestaurantState> }
  | { type: "UPDATE_THEME"; theme: RestaurantTheme }
  | { type: "UPDATE_BUSINESS_INFO"; info: RestaurantBusinessInfo }
  | { type: "UPDATE_GLOBAL_SETTINGS"; settings: any }
  | { type: "UPDATE_PLAN_LIMITS"; limits: PlanLimits }
  | { type: "SYNC_REALTIME_DATA"; payload: any }

const defaultPlanLimits: PlanLimits = {
  maxTables: -1, maxProducts: -1, maxStaff: -1,
  allowKds: true, allowCashier: true, allowReports: true, allowInventory: true,
  allowPurchases: true, allowExpenses: true, allowStaff: true, allowTableMgmt: true,
  allowCustomization: true, allowHR: true, allowProductImages: true,
  allowProductExtras: true, allowProductDescription: true, allowRawMaterials: true,
  allowCompositeProducts: true,
}

const initialState: RestaurantState = {
  isLoading: true, tenantSlug: null, tenantId: null, isValidTenant: false, isInactiveTenant: false,
  isAuthorized: false, tableId: null, planLimits: defaultPlanLimits,
  allowedModules: ["RESTAURANT"], allowedFeatures: [], activeModule: null,
  theme: {
    primaryColor: "#22c55e", backgroundColor: "#fff", fontColor: "#000", logoUrl: "",
    restaurantName: "Carregando...", fontFamily: "Inter", borderRadius: "lg", buttonStyle: "fill",
  },
  globalSettings: {},
  businessInfo: {
    paymentMethods: [
      { id: "1", name: "Dinheiro", type: "CASH", feePercentage: 0, isActive: true },
      { id: "2", name: "PIX", type: "PIX", feePercentage: 0, isActive: true },
      { id: "3", name: "Cartão Crédito", type: "CREDIT", feePercentage: 3.99, isActive: true },
      { id: "4", name: "Cartão Débito", type: "DEBIT", feePercentage: 1.99, isActive: true },
    ],
    expenseCategories: [
      { id: "1", name: "Fornecedor" }, { id: "2", name: "Pessoal" }, { id: "3", name: "Aluguel" },
      { id: "4", name: "Impostos" }, { id: "5", name: "Manutenção" }, { id: "6", name: "Outros" },
    ],
  },
}

function restaurantReducer(state: RestaurantState, action: Action): RestaurantState {
  switch (action.type) {
    case "SET_LOADING": return { ...state, isLoading: action.value }
    case "TENANT_NOT_FOUND": return { ...state, isLoading: false, isValidTenant: false }
    case "TENANT_INACTIVE": return { ...state, isLoading: false, isInactiveTenant: true }
    case "SET_AUTHORIZED": return { ...state, isAuthorized: true, tenantId: action.tenantId, tableId: action.tableId }
    case "SET_ACTIVE_MODULE": return { ...state, activeModule: action.module }
    case "UPDATE_THEME": return { ...state, theme: action.theme }
    case "UPDATE_BUSINESS_INFO": return { ...state, businessInfo: action.info }
    case "UPDATE_GLOBAL_SETTINGS": return { ...state, globalSettings: action.settings }
    case "UPDATE_PLAN_LIMITS": return { ...state, planLimits: action.limits }
    case "SYNC_REALTIME_DATA": return {
        ...state, 
        theme: action.payload.theme_config || state.theme,
        businessInfo: { ...state.businessInfo, ...(action.payload.business_info || {}) },
        allowedModules: action.payload.allowed_modules || state.allowedModules,
        allowedFeatures: action.payload.allowed_features || state.allowedFeatures,
      }
    case "INIT_DATA": return { ...state, ...action.payload, isLoading: false, isValidTenant: true }
    default: return state
  }
}

interface ContextProps {
  state: RestaurantState
  authorize: (tenantId: string, tableId: string) => void
  setActiveModule: (module: SystemModule) => void
  refresh: () => void 
  updateBusinessInfo: (info: Partial<RestaurantBusinessInfo>) => Promise<void>
  updateTheme: (theme: RestaurantTheme) => Promise<void>
}

const RestaurantContext = createContext<ContextProps | undefined>(undefined)

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(restaurantReducer, initialState)

  const authorize = (tenantId: string, tableId: string) => {
    localStorage.setItem(`arloflux_auth_${tenantId}`, tableId)
    dispatch({ type: "SET_AUTHORIZED", tenantId, tableId })
  }

  const init = useCallback(async () => {
    try {
      let slug = getTenantSlug()

      if (!slug) {
         const { data: { session } } = await supabase.auth.getSession();
         if (session?.user?.id) {
             const { data: staffData } = await supabase.from('staff').select('tenants(slug)').eq('auth_user_id', session.user.id).maybeSingle();
             const t = staffData?.tenants;
             const foundSlug = Array.isArray(t) ? t[0]?.slug : t?.slug;
             if (foundSlug) {
                 slug = foundSlug;
                 sessionStorage.setItem('fluxeat_tenant_slug', slug); 
             }
         }
      }

      if (!slug) {
        dispatch({ type: "SET_LOADING", value: false })
        return
      }

      const { data: tenant, error } = await supabase
        .from("tenants")
        .select(`id, slug, status, theme_config, business_info, plan, allowed_modules, allowed_features`)
        .eq("slug", slug.toLowerCase())
        .maybeSingle()

      if (error || !tenant) {
        dispatch({ type: "TENANT_NOT_FOUND" })
        return
      }

      let globalSettings = {}
      const { data: config } = await supabase.from("saas_config").select("global_settings").eq("id", 'default').maybeSingle()
      if (config?.global_settings) globalSettings = config.global_settings

      let planLimits = defaultPlanLimits
      if (tenant.plan) {
        const { data: plan } = await supabase.from("plans").select("limits").eq("key", tenant.plan).maybeSingle()
        if (plan?.limits) planLimits = { ...defaultPlanLimits, ...plan.limits }
      }

      const isInactive = tenant.status === "INACTIVE";
      const storedModule = isInactive ? null : (localStorage.getItem(`arloflux_module_${tenant.id}`) as SystemModule | null);
      const storedTable = localStorage.getItem(`arloflux_auth_${tenant.id}`)

      dispatch({
        type: "INIT_DATA",
        payload: {
          tenantId: tenant.id, tenantSlug: tenant.slug,
          isInactiveTenant: isInactive, 
          theme: tenant.theme_config || initialState.theme, 
          businessInfo: { ...initialState.businessInfo, ...(tenant.business_info || {}) },
          allowedModules: tenant.allowed_modules || ["RESTAURANT"], allowedFeatures: tenant.allowed_features || [],
          globalSettings, planLimits, activeModule: storedModule,
          isAuthorized: !!storedTable, tableId: storedTable,
        },
      })
    } catch (error) {
      console.error("INIT ERROR", error)
      dispatch({ type: "SET_LOADING", value: false })
    }
  }, [])

  const updateBusinessInfo = async (info: Partial<RestaurantBusinessInfo>) => {
      if (!state.tenantId) return;
      
      const updatedInfo = {
          ...state.businessInfo,
          ...info
      };

      const { error } = await supabase
          .from('tenants')
          .update({ business_info: updatedInfo })
          .eq('id', state.tenantId);

      if (error) throw error;
      dispatch({ type: "UPDATE_BUSINESS_INFO", info: updatedInfo });
  };

  const updateTheme = async (theme: RestaurantTheme) => {
      if (!state.tenantId) return;
      
      const { error } = await supabase
          .from('tenants')
          .update({ theme_config: theme })
          .eq('id', state.tenantId);

      if (error) throw error;
      dispatch({ type: "UPDATE_THEME", theme });
  };

  const refresh = useCallback(() => {
    dispatch({ type: "SET_LOADING", value: true });
    init();
  }, [init]);

  useEffect(() => {
    if (!state.tenantId) return
    const channel = supabase.channel(`tenant:${state.tenantId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tenants", filter: `id=eq.${state.tenantId}` },
        (payload) => { dispatch({ type: "SYNC_REALTIME_DATA", payload: payload.new }) }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [state.tenantId])

  const setActiveModule = (module: SystemModule) => {
    if (!state.tenantId || state.isInactiveTenant) return
    localStorage.setItem(`arloflux_module_${state.tenantId}`, module)
    dispatch({ type: "SET_ACTIVE_MODULE", module })
  }

  useEffect(() => { init() }, [init])

  return (
    <RestaurantContext.Provider value={{ state, authorize, setActiveModule, refresh, updateBusinessInfo, updateTheme }}>
      {state.isLoading ? (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : children}
    </RestaurantContext.Provider>
  )
}

export const useRestaurant = () => {
  const context = useContext(RestaurantContext)
  if (!context) throw new Error("useRestaurant must be used within RestaurantProvider")
  return context
}