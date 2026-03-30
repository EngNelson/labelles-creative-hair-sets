import { fetchData } from "./api";

// Track product view
export const trackProductView = async (productId: string) => {
  try {
    const response = await fetchData(`/products/${productId}/view`, {
      method: "POST",
    });
    return response;
  } catch (error) {
    console.error("Error tracking product view:", error);
    return null;
  }
};

// Add product review
export const addProductReview = async (
  productId: string,
  rating: number,
  comment: string,
  token: string
) => {


  const response = await fetchData(`/products/${productId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment }),
  });
  return response;
};

// Get pending reviews (Admin)
export const getPendingReviews = async (token: string) => {
  const response = await fetchData("/products/reviews/pending", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

// Approve or reject review (Admin)
export const approveReview = async (
  productId: string,
  reviewId: string,
  approve: boolean,
  token: string
) => {
  const response = await fetchData(
    `/products/${productId}/review/${reviewId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ approve }),
    }
  );
  return response;
};
