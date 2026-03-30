import { fetchWithConfig } from "./config";

export interface SellerConfig {
  sellerEnabled: boolean;
  allowSellerRegistration: boolean;
  requireApproval: boolean;
  defaultCommissionRate: number;
  minOrderAmount: number;
  maxProductsPerSeller: number;
}

let cachedConfig: SellerConfig | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 10 * 1000; // 10 seconds - shorter cache for faster config updates

export async function getSellerConfig(): Promise<SellerConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedConfig && now - lastFetchTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const data = await fetchWithConfig<{
      success?: boolean;
      data?: SellerConfig;
    }>("/sellers/config", {
      next: { revalidate: 3600 },
    });

    cachedConfig = data.data || (data as unknown as SellerConfig);
    lastFetchTime = now;

    return cachedConfig;
  } catch (error) {
    console.error("❌ Failed to fetch seller config:", error);
  }

  // Return default config with sellers DISABLED if fetch fails
  console.warn("⚠️ Using default seller config (DISABLED)");
  return {
    sellerEnabled: false,
    allowSellerRegistration: false,
    requireApproval: true,
    defaultCommissionRate: 10,
    minOrderAmount: 0,
    maxProductsPerSeller: 100,
  };
}

export function isSellerSystemEnabled(config: SellerConfig): boolean {
  return config.sellerEnabled;
}

export function canRegisterAsSeller(config: SellerConfig): boolean {
  return config.sellerEnabled && config.allowSellerRegistration;
}
