import { updatePaymentStatus, getOrderById, Order } from "./orderApi";
import { toast } from "sonner";

export interface PaymentStatusResult {
  success: boolean;
  order?: Order;
  message?: string;
}

/**
 * Updates payment status for an order after successful Stripe payment
 * This includes both frontend status update and webhook fallback handling
 */
export const handlePaymentSuccess = async (
  orderId: string,
  sessionId: string,
  token: string,
  paymentIntentId?: string
): Promise<PaymentStatusResult> => {
  try {


    // First, try to update the payment status directly
    const updateResult = await updatePaymentStatus(
      orderId,
      "paid",
      token,
      paymentIntentId,
      sessionId
    );

    if (updateResult.success && updateResult.order) {
      toast.success("Payment confirmed and order updated!");
      return {
        success: true,
        order: updateResult.order,
        message: "Order status updated successfully",
      };
    } else {
      console.warn(
        "PaymentUtils: Failed to update order status:",
        updateResult.message
      );
      // If frontend update fails, the webhook should handle it
      toast.info("Payment successful! Order status will be updated shortly.");
      return {
        success: false,
        message: updateResult.message || "Failed to update order status",
      };
    }
  } catch (error) {
    console.error("PaymentUtils: Error updating order status:", error);
    // Don't show error to user as webhook will handle the update
    toast.info("Payment successful! Order status will be updated shortly.");
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
};

/**
 * Polls for order status updates (fallback mechanism)
 * Useful when webhook might be delayed or failed
 */
export const pollOrderStatus = async (
  orderId: string,
  token: string,
  expectedStatus: string = "paid",
  maxAttempts: number = 6,
  intervalMs: number = 5000
): Promise<PaymentStatusResult> => {
  return new Promise((resolve) => {
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const order = await getOrderById(orderId, token);

        // Check paymentStatus instead of status for payment-related polling
        if (order && order.paymentStatus === expectedStatus) {

          resolve({
            success: true,
            order,
            message: `Payment status updated to ${expectedStatus}`,
          });
          return;
        }

        if (attempts >= maxAttempts) {
          resolve({
            success: false,
            message: "Timeout waiting for payment status update",
          });
          return;
        }

        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        console.error("PaymentUtils: Error polling order status:", error);
        resolve({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Error polling order status",
        });
      }
    };

    poll();
  });
};

/**
 * Comprehensive payment status handler that combines direct update and polling
 */
export const ensurePaymentStatus = async (
  orderId: string,
  sessionId: string,
  token: string,
  paymentIntentId?: string
): Promise<PaymentStatusResult> => {
  // First, try direct update
  const directResult = await handlePaymentSuccess(
    orderId,
    sessionId,
    token,
    paymentIntentId
  );

  if (directResult.success) {
    return directResult;
  }

  // If direct update fails, start polling as fallback
  const pollResult = await pollOrderStatus(orderId, token, "paid", 6, 5000);

  if (pollResult.success) {
    toast.success("Payment status updated!");
  }

  return pollResult;
};

/**
 * Check if an order needs payment status update
 */
export const needsPaymentUpdate = (
  order: Order | null | undefined,
  sessionId?: string
): boolean => {
  // Check paymentStatus instead of status
  const needsUpdate: boolean =
    !!order &&
    (order.paymentStatus === "pending" || !order.paymentStatus) &&
    !!sessionId;

  return needsUpdate;
};

/**
 * Format payment status for display
 */
export const formatPaymentStatus = (
  status: string
): { text: string; color: string } => {
  switch (status) {
    case "paid":
      return { text: "Paid", color: "text-green-600" };
    case "pending":
      return { text: "Pending", color: "text-yellow-600" };
    case "completed":
      return { text: "Completed", color: "text-blue-600" };
    case "cancelled":
      return { text: "Cancelled", color: "text-red-600" };
    default:
      return { text: status, color: "text-gray-600" };
  }
};
