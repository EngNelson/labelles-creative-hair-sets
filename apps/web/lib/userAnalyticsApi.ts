const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const getApiUrl = (endpoint: string) => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  return `${base}${path}`;
};

// Helper function to get auth token from cookies
const getAuthToken = () => {
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("auth_token=")
    );
    return authCookie ? authCookie.split("=")[1] : null;
  }
  return null;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
};

export interface UserAnalyticsOverview {
  overview: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    paidAmount: number;
    avgOrderValue: number;
    totalItems: number;
  };
  favoriteCategories: Array<{
    _id: string;
    totalSpent: number;
    itemCount: number;
    orderCount: number;
  }>;
  spendingByStatus: Array<{
    _id: string;
    totalAmount: number;
    orderCount: number;
  }>;
}

export interface MonthlySpending {
  monthlySpending: Array<{
    year: number;
    month: number;
    monthName: string;
    totalSpent: number;
    paidAmount: number;
    orderCount: number;
    completedOrders: number;
    avgOrderValue: number;
  }>;
  period: string;
}

export interface OrderHistory {
  orders: Array<{
    _id: string;
    total: number;
    status: string;
    createdAt: string;
    itemCount: number;
    avgItemPrice: number;
    deliveryTime: number | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ProductPreferences {
  mostPurchasedProducts: Array<{
    _id: string;
    productName: string;
    productImage: string;
    category: string;
    totalQuantity: number;
    totalSpent: number;
    avgPrice: number;
    orderCount: number;
  }>;
  spendingByCategory: Array<{
    _id: string;
    totalSpent: number;
    itemCount: number;
    uniqueProductCount: number;
    orderCount: number;
  }>;
  priceRangePreferences: Array<{
    range: string;
    count: number;
    totalSpent: number;
    avgPrice: number;
  }>;
}

// API Functions
export const getUserAnalyticsOverview =
  async (): Promise<UserAnalyticsOverview> => {
    const response = await makeAuthenticatedRequest("/user-analytics/overview");
    return response.data;
  };

export const getUserMonthlySpending = async (
  months: number = 12
): Promise<MonthlySpending> => {
  const response = await makeAuthenticatedRequest(
    `/user-analytics/monthly-spending?months=${months}`
  );
  return response.data;
};

export const getUserOrderHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<OrderHistory> => {
  const response = await makeAuthenticatedRequest(
    `/user-analytics/order-history?page=${page}&limit=${limit}`
  );
  return response.data;
};

export const getUserProductPreferences =
  async (): Promise<ProductPreferences> => {
    const response = await makeAuthenticatedRequest(
      "/user-analytics/product-preferences"
    );
    return response.data;
  };
