import authApi from "./authApi";

export interface WishlistResponse {
  success: boolean;
  wishlist: string[];
  message?: string;
}

export interface WishlistProductsResponse {
  success: boolean;
  products: [];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasMore: boolean;
    limit: number;
  };
  message?: string;
}

// Add product to wishlist
export const addToWishlist = async (
  productId: string,
  token: string
): Promise<WishlistResponse> => {
  try {
    const response = await authApi.post("/wishlist/add", { productId }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to add to wishlist");
    }

    return response.data as WishlistResponse;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (
  productId: string,
  token: string
): Promise<WishlistResponse> => {
  try {
    const response = await authApi.delete("/wishlist/remove", {
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to remove from wishlist");
    }

    return response.data as WishlistResponse;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};

// Get user's wishlist (returns array of product IDs)
export const getUserWishlist = async (
  token: string
): Promise<WishlistResponse> => {
  try {
    const response = await authApi.get("/wishlist", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get wishlist");
    }

    return response.data as WishlistResponse;
  } catch (error) {
    console.error("Error getting wishlist:", error);
    throw error;
  }
};

// Get wishlist products by IDs
export const getWishlistProducts = async (
  productIds: string[],
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<WishlistProductsResponse> => {
  try {
    const response = await authApi.post("/wishlist/products", { productIds, page, limit }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get wishlist products");
    }

    return response.data as WishlistProductsResponse;
  } catch (error) {
    console.error("Error getting wishlist products:", error);
    throw error;
  }
};

// Clear entire wishlist
export const clearWishlist = async (
  token: string
): Promise<WishlistResponse> => {
  try {
    const response = await authApi.delete("/wishlist/clear", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to clear wishlist");
    }

    return response.data as WishlistResponse;
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    throw error;
  }
};
