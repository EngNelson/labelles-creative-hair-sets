const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const getApiUrl = (endpoint: string) => {
  const base = baseURL.replace(/\/$/, "");
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  return `${base}${path}`;
};

export interface Notification {
  _id: string;
  userId: string;
  type:
    | "order_placed"
    | "order_confirmed"
    | "order_shipped"
    | "order_delivered"
    | "order_cancelled"
    | "payment_success"
    | "payment_failed"
    | "refund_processed"
    | "general"
    | "offer"
    | "deal"
    | "announcement"
    | "promotion"
    | "alert"
    | "admin_message";
  title: string;
  message: string;
  isRead: boolean;
  relatedOrderId?: string;
  image?: string;
  actionUrl?: string;
  actionText?: string;
  external?: boolean;
  priority?: "low" | "normal" | "high" | "urgent";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications?: Notification[];
  notification?: Notification;
  count?: number;
  total?: number;
  unreadCount?: number;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  hasMore?: boolean;
  message?: string;
}

export interface NotificationQuery {
  limit?: number;
  skip?: number;
  page?: number;
  unreadOnly?: boolean;
}

// Get all notifications for the current user
export const getNotifications = async (
  token: string,
  query: NotificationQuery = {}
): Promise<{
  notifications: Notification[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}> => {
  try {
    const { limit = 10, page = 1, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await authApi.get(`/notifications?${params}`);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to fetch notifications");
    }

    const data = response.data as NotificationResponse;
    const notifications = data.notifications || [];
    const totalCount = data.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

import authApi from "./authApi";

// ... (existing interfaces)

// Get unread notification count
export const getUnreadCount = async (token: string): Promise<number> => {
  // Return 0 if no token provided
  if (!token) {
    return 0;
  }

  try {
    const response = await authApi.get("/notifications/unread-count");

    if (!response.success) {
      // Only log in development to avoid console noise
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Notification API: ${response.error?.message}`
        );
      }
      return 0;
    }

    const data = response.data as NotificationResponse;
    return data.count || data.unreadCount || 0;
  } catch {
    // Silently fail - this is expected when user is not authenticated
    // or when the API server is not available
    return 0;
  }
};

// Mark a notification as read
export const markAsRead = async (
  notificationId: string,
  token: string
): Promise<boolean> => {
  try {
    const response = await authApi.put(`/notifications/${notificationId}/read`, {});

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to mark notification as read");
    }

    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

// Mark all notifications as read
export const markAllAsRead = async (token: string): Promise<boolean> => {
  try {
    const response = await authApi.put("/notifications/read-all", {});

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to mark all notifications as read");
    }

    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};

// Delete a notification
export const deleteNotification = async (
  notificationId: string,
  token: string
): Promise<boolean> => {
  try {
    const response = await authApi.delete(`/notifications/${notificationId}`);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete notification");
    }

    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
};

// Delete all notifications
export const deleteAllNotifications = async (
  token: string
): Promise<boolean> => {
  try {
    const response = await authApi.delete("/notifications");

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete all notifications");
    }

    return true;
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return false;
  }
};
