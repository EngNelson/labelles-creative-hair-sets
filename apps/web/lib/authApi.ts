const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const getApiUrl = (endpoint: string) => {
  const base = baseURL.replace(/\/$/, "");
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  return `${base}${path}`;
};

type ApiError = {
  message: string;
  code: string | number;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
};

const getTokens = (): { token?: string; refreshToken?: string } => {
  if (typeof document === "undefined") return {};
  const cookies = document.cookie.split(";").reduce(
    (acc, cookie) => {
      const parts = cookie.trim().split("=");
      if (parts.length === 2) {
        acc[parts[0]] = parts[1];
      }
      return acc;
    },
    {} as Record<string, string>
  );
  return {
    token: cookies.auth_token,
    refreshToken: cookies.refresh_token,
  };
};

// Helper to set cookie (for updating token after refresh)
export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax${secure}`;
};

const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Keep track of active refresh promise to avoid multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  try {
    const response = await fetch(getApiUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Refresh failed");
    }

    const data = await response.json();
    if (data.accessToken) {
      // Update cookie
      setCookie("auth_token", data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear tokens on fatal refresh error
    removeCookie("auth_token");
    removeCookie("refresh_token");
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin"; // Redirect to login
    }
    return null;
  }
};

const customFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  const { token } = getTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response = await fetch(url, config);

  // Handle 401 Unauthorized (Token Expired)
  if (response.status === 401 && !url.includes("/auth/login")) {
    const { refreshToken } = getTokens();

    if (refreshToken) {
      if (isRefreshing) {
        // Wait for existing refresh to complete
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            // Retry original request with new token
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            resolve(fetch(url, retryConfig));
          });
        });
      }

      isRefreshing = true;

      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        // Retry original request
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        return fetch(url, retryConfig);
      }
    }
  }

  return response;
};

const authApi = {
  post: async (
    url: string,
    body: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await customFetch(url, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }

        return {
          success: false,
          error: {
            message: errorMessage,
            code: response.status === 0 ? "ERR_NETWORK" : response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch {
      return {
        success: false,
        error: {
          message:
            "Unable to connect to the server. Please check if the server is running.",
          code: "ERR_NETWORK",
        },
      };
    }
  },

  put: async (
    url: string,
    body: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await customFetch(url, {
        ...options,
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        return {
          success: false,
          error: {
            message: errorMessage,
            code: response.status === 0 ? "ERR_NETWORK" : response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: unknown) {
      console.error("authApi: Network Error:", url, error);
      return {
        success: false,
        error: {
          message:
            "Unable to connect to the server. Please check if the server is running.",
          code: "ERR_NETWORK",
        },
      };
    }
  },

  get: async (
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await customFetch(url, {
        ...options,
        method: "GET",
      });

      if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        return {
          success: false,
          error: {
            message: errorMessage,
            code: response.status === 0 ? "ERR_NETWORK" : response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: unknown) {
      console.error("authApi: Network Error:", url, error);
      return {
        success: false,
        error: {
          message:
            "Unable to connect to the server. Please check if the server is running.",
          code: "ERR_NETWORK",
        },
      };
    }
  },

  delete: async (
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<unknown>> => {
    try {
      const response = await customFetch(url, {
        ...options,
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        return {
          success: false,
          error: {
            message: errorMessage,
            code: response.status === 0 ? "ERR_NETWORK" : response.status,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: unknown) {
      console.error("authApi: Network Error:", url, error);
      return {
        success: false,
        error: {
          message:
            "Unable to connect to the server. Please check if the server is running.",
          code: "ERR_NETWORK",
        },
      };
    }
  },
};

export default authApi;
