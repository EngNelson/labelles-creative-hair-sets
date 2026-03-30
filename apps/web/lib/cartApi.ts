import authApi from "./authApi";

export interface CartItem {
  productId: {
    _id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    brand: string;
    stock: number;
    rating: number;
    reviews: number;
    createdAt: string;
    updatedAt: string;
  };
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart: CartItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
    limit: number;
  };
  message: string;
}

export const getUserCart = async (
  page: number = 1,
  limit: number = 10
): Promise<CartResponse> => {
  try {
    const response = await authApi.get(`/cart?page=${page}&limit=${limit}`);
    if (response.success && response.data) {
      return {
        success: true,
        cart: response.data.cart || [],
        pagination: response.data.pagination,
        message: response.data.message || "Cart retrieved successfully",
      };
    } else {
      return {
        success: false,
        cart: [],
        message: response.error?.message || "Failed to get cart",
      };
    }
  } catch (error) {
    console.error("Get cart error:", error);
    return {
      success: false,
      cart: [],
      message: "Failed to get cart",
    };
  }
};

export const addToCart = async (
  token: string,
  productId: string,
  quantity: number = 1
): Promise<CartResponse> => {
  try {
    const response = await authApi.post("/cart", { productId, quantity });
    if (response.success && response.data) {
      return {
        success: true,
        cart: response.data.cart || [],
        message: response.data.message || "Item added to cart successfully",
      };
    } else {
      return {
        success: false,
        cart: [],
        message: response.error?.message || "Failed to add to cart",
      };
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    return {
      success: false,
      cart: [],
      message: "Failed to add to cart",
    };
  }
};

export const updateCartItem = async (
  token: string,
  productId: string,
  quantity: number
): Promise<CartResponse> => {
  try {
    const response = await authApi.put("/cart/update", { productId, quantity });
    if (response.success && response.data) {
      return {
        success: true,
        cart: response.data.cart || [],
        message: response.data.message || "Cart item updated successfully",
      };
    } else {
      return {
        success: false,
        cart: [],
        message: response.error?.message || "Failed to update cart item",
      };
    }
  } catch (error) {
    console.error("Update cart item error:", error);
    return {
      success: false,
      cart: [],
      message: "Failed to update cart item",
    };
  }
};

export const removeFromCart = async (
  token: string,
  productId: string
): Promise<CartResponse> => {
  try {
    const response = await authApi.delete(`/cart/${productId}`);
    if (response.success && response.data) {
      return {
        success: true,
        cart: response.data.cart || [],
        message: response.data.message || "Item removed from cart successfully",
      };
    } else {
      return {
        success: false,
        cart: [],
        message: response.error?.message || "Failed to remove from cart",
      };
    }
  } catch (error) {
    console.error("Remove from cart error:", error);
    return {
      success: false,
      cart: [],
      message: "Failed to remove from cart",
    };
  }
};

export const clearCart = async (): Promise<CartResponse> => {
  try {
    const response = await authApi.delete("/cart");
    if (response.success && response.data) {
      return {
        success: true,
        cart: [],
        message: response.data.message || "Cart cleared successfully",
      };
    } else {
      return {
        success: false,
        cart: [],
        message: response.error?.message || "Failed to clear cart",
      };
    }
  } catch (error) {
    console.error("Clear cart error:", error);
    return {
      success: false,
      cart: [],
      message: "Failed to clear cart",
    };
  }
};
