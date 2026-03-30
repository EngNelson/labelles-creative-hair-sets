// NOTE: js-cookie is NOT imported at the top level — it relies on `document.cookie`
// which is unavailable in the Node.js server runtime (SSR).
// Each usage is guarded by `typeof window !== 'undefined'` and uses require().

interface ApiConfig {
  baseUrl: string;
  isProduction: boolean;
}

/**
 * Get API configuration based on environment
 */
export const getApiConfig = (): ApiConfig => {
  // Check if we're in browser or server environment
  const isClient = typeof window !== "undefined";

  let baseUrl: string;

  if (isClient) {
    // Client-side: use NEXT_PUBLIC_API_URL
    baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";
  } else {
    // Server-side: use API_ENDPOINT or NEXT_PUBLIC_API_URL as fallback
    // During build, NEXT_PUBLIC_API_URL might be the only one available
    baseUrl =
      process.env.API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000/";
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";

  return {
    baseUrl,
    isProduction,
  };
};

/**
 * Enhanced fetch function with better error handling
 */
export async function fetchWithConfig<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { baseUrl } = getApiConfig();

  // Ensure endpoint starts with / and prepend /api
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const apiEndpoint = normalizedEndpoint.startsWith("/api")
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  const url = `${baseUrl.replace(/\/$/, "")}${apiEndpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      revalidate: process.env.REVALIDATION_TIME
        ? parseInt(process.env.REVALIDATION_TIME)
        : 60,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        // Silent refresh logic for client-side
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Cookies = require("js-cookie").default;
        const refreshToken = Cookies.get("refresh_token");
        
        if (refreshToken && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
           try {
             const refreshResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/api/auth/refresh`, {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
               },
               body: JSON.stringify({ refreshToken }),
             });

             if (refreshResponse.ok) {
               const { accessToken } = await refreshResponse.json();
               
               if (accessToken) {
                 // Update cookies
                 // eslint-disable-next-line @typescript-eslint/no-var-requires
                 const CookiesInner = require("js-cookie").default;
                 CookiesInner.set("auth_token", accessToken, {
                    expires: 7,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                 });

                 // Retry original request with new token
                 const newOptions = {
                   ...mergedOptions,
                   headers: {
                     ...mergedOptions.headers,
                     Authorization: `Bearer ${accessToken}`,
                   },
                 };
                 
                 const retryResponse = await fetch(url, newOptions);
                 if (retryResponse.ok) {
                    const data: T = await retryResponse.json();
                    return data;
                 }
               }
             } else {
               // Refresh failed - clean up
               // eslint-disable-next-line @typescript-eslint/no-var-requires
               const CookiesClean = require("js-cookie").default;
               CookiesClean.remove("auth_token");
               CookiesClean.remove("refresh_token");
               window.location.href = "/login";
             }
           } catch (refreshError) {
             console.error("Token refresh failed:", refreshError);
             // eslint-disable-next-line @typescript-eslint/no-var-requires
             const CookiesErr = require("js-cookie").default;
             CookiesErr.remove("auth_token");
             CookiesErr.remove("refresh_token");
             window.location.href = "/login";
           }
        }
      }

      // Try to parse error message from response body
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If parsing fails, use default error message
      }
      throw new Error(errorMessage);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Build query string from parameters
 */
export const buildQueryString = (
  params: Record<string, string | number | boolean>
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  REFRESH: "/auth/refresh",

  // Products
  PRODUCTS: "/products",
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,

  // Categories
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Brands
  BRANDS: "/brands",
  BRAND_BY_ID: (id: string) => `/brands/${id}`,

  // Users
  USERS: "/users",
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_PROFILE: "/users/profile",

  // Orders
  ORDERS: "/orders",
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  USER_ORDERS: (userId: string) => `/orders/user/${userId}`,

  // Cart
  CART: "/cart",
  ADD_TO_CART: "/cart/add",
  REMOVE_FROM_CART: "/cart/remove",

  // Stats & Analytics
  STATS: "/stats",
  ANALYTICS: "/analytics",
  
  // Sellers
  SELLERS: "/sellers",
  SELLER_BY_ID: (id: string) => `/sellers/${id}`,
  APPROVED_SELLERS: "/sellers/approved",
} as const;
