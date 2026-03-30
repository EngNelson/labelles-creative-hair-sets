import authApi from "./authApi";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface StatusUpdate {
  timestamp: string;
  by?: {
    _id: string;
    name: string;
    role: string;
  };
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status:
    | "pending"
    | "address_confirmed"
    | "confirmed"
    | "processing"
    | "packed"
    | "shipped"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: "stripe" | "sslcommerz" | "cod";
  shippingAddress: ShippingAddress;
  paymentIntentId?: string;
  stripeSessionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  payment_info?: {
    gateway?: "stripe" | "sslcommerz" | "cod";
    stripe?: {
      paymentIntentId?: string;
      sessionId?: string;
      paymentMethodType?: string;
      cardBrand?: string;
      cardLast4?: string;
      receiptUrl?: string;
      chargeId?: string;
    };
    sslcommerz?: {
      transactionId?: string;
      validationId?: string;
      bankTransactionId?: string;
      cardType?: string;
      cardIssuer?: string;
      cardBrand?: string;
      paymentMethod?: string;
      cardCategory?: string;
      amount?: number;
      storeAmount?: number;
      currency?: string;
      currencyType?: string;
      currencyAmount?: number;
      conversionRate?: number;
      verifySign?: string;
      verifyKey?: string;
      riskTitle?: string;
      riskLevel?: string;
      mobileProvider?: string;
    };
    paidAmount?: number;
    currency?: string;
    paidAt?: string;
  };
  status_updates?: {
    pending?: StatusUpdate;
    address_confirmed?: StatusUpdate;
    confirmed?: StatusUpdate;
    packed?: StatusUpdate;
    delivering?: StatusUpdate;
    delivered?: StatusUpdate;
    completed?: StatusUpdate;
    cancelled?: StatusUpdate;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  order: Order;
  message?: string;
}

// Create order from cart
export const createOrderFromCart = async (
  token: string,
  cartItems: any[],
  shippingAddress: ShippingAddress
): Promise<CreateOrderResponse> => {
  try {
    // Validate shipping address has all required fields
    const requiredFields = ["street", "city", "state", "country", "postalCode"];
    const missingFields = requiredFields.filter(
      (field) => !shippingAddress[field as keyof ShippingAddress]
    );

    if (missingFields.length > 0) {
      const error = `Missing required address fields: ${missingFields.join(", ")}`;
      console.error("❌", error);
      console.error("Address received:", shippingAddress);
      throw new Error(error);
    }

    const payload = {
      items: cartItems,
      shippingAddress,
    };

    const response = await authApi.post("/orders", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to create order");
    }

    const orderData = response.data as { order: Order } | Order;
    const order = 'order' in orderData ? orderData.order : orderData;

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      order: {} as Order,
      message:
        error instanceof Error ? error.message : "Failed to create order",
    };
  }
};

// Get user orders
export const getUserOrders = async (token: string): Promise<Order[]> => {
  try {
    const response = await authApi.get("/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error("Failed to fetch orders");
    }

    return response.data as Order[];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Get all orders (admin/staff)
export const getAllOrders = async (
  token: string,
  params?: {
    page?: number;
    perPage?: number;
    status?: string;
    paymentStatus?: string;
    sortOrder?: string;
  }
): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.perPage)
      queryParams.append("perPage", params.perPage.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.paymentStatus)
      queryParams.append("paymentStatus", params.paymentStatus);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const response = await authApi.get(`/orders/admin${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error("Failed to fetch orders");
    }

    return response.data as { orders: Order[]; total: number; totalPages: number };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], total: 0, totalPages: 0 };
  }
};

// Get order by ID
export const getOrderById = async (
  orderId: string,
  token: string
): Promise<Order | null> => {
  try {
    const response = await authApi.get(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error("Failed to fetch order");
    }

    return response.data as Order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};

// Delete order
export const deleteOrder = async (
  orderId: string,
  token: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await authApi.delete(`/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete order");
    }

    return {
      success: true,
      message: "Order deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete order",
    };
  }
};

// Update order status (for order fulfillment - admin use)
export const updateOrderStatus = async (
  orderId: string,
  status:
    | "pending"
    | "address_confirmed"
    | "confirmed"
    | "processing"
    | "packed"
    | "shipped"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled",
  token: string
): Promise<{ success: boolean; order?: Order; message?: string }> => {
  try {
    const response = await authApi.put(`/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to update order status");
    }

    const data = response.data as { order: Order; message: string };
    return {
      success: true,
      order: data.order,
      message: data.message,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
};

// Update payment status (for payment updates - webhook/success page)
export const updatePaymentStatus = async (
  orderId: string,
  status: "paid" | "pending" | "failed" | "refunded",
  token?: string,
  paymentIntentId?: string,
  stripeSessionId?: string
): Promise<{ success: boolean; order?: Order; message?: string }> => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await authApi.put(`/orders/${orderId}/webhook-status`, {
      status,
      paymentIntentId,
      stripeSessionId,
    }, { headers });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to update payment status");
    }

    const data = response.data as { order: Order; message: string };
    return {
      success: true,
      order: data.order,
      message: data.message,
    };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update payment status",
    };
  }
};
