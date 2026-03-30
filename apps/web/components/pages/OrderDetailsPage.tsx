"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PriceFormatter from "@/components/common/PriceFormatter";
import PaymentGatewayDialog from "@/components/shared/PaymentGatewayDialog";
import {
  CheckCircle,
  Package,
  Clock,
  CreditCard,
  ArrowLeft,
  MapPin,
  Trash2,
  Banknote,
} from "lucide-react";
import Image from "next/image";
import { getOrderById, deleteOrder, type Order } from "@/lib/orderApi";
import {
  createCheckoutSession,
  redirectToCheckout,
  type StripeCheckoutItem,
} from "@/lib/stripe";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store";

const OrderDetailsPage = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<
    "stripe" | "sslcommerz" | null
  >(null);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth_token, authUser } = useUserStore();
  const orderId = params.id as string;
  const success = searchParams.get("success");
  const paymentParam = searchParams.get("payment");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !auth_token) {
        toast.error("Order ID or authentication token missing");
        router.push("/user/orders");
        return;
      }
      setLoading(true);
      try {
        const orderData = await getOrderById(orderId, auth_token);
        if (orderData) {
          setOrder(orderData);
          if (success === "true" && orderData.paymentStatus === "paid") {
            toast.success("Payment successful! Your order has been confirmed.");
          }
          // Auto-open payment modal if payment=true parameter is present
          if (paymentParam === "true" && orderData.paymentStatus !== "paid") {
            // Small delay to ensure order data is loaded
            setTimeout(() => {
              setShowPaymentConfirm(true);
            }, 300);
          }
        } else {
          toast.error("Order not found");
          router.push("/user/orders");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
        router.push("/user/orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, auth_token, router, success, paymentParam]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "completed":
      case "confirmed":
      case "shipped":
      case "delivered":
        return <Package className="h-5 w-5 text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Payment Confirmed";
      case "pending":
        return "Payment Pending";
      case "confirmed":
        return "Order Confirmed";
      case "processing":
        return "Processing";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Order Completed";
      case "cancelled":
        return "Order Cancelled";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "confirmed":
      case "delivered":
        return "text-primary bg-green-50 border border-primary/30";
      case "pending":
        return "text-yellow-700 bg-yellow-50 border border-yellow-200";
      case "processing":
      case "shipped":
        return "text-blue-700 bg-blue-50 border border-blue-200";
      case "completed":
        return "text-primary bg-primary/10 border border-primary/30";
      case "cancelled":
        return "text-accent bg-red-50 border border-accent/30";
      default:
        return "text-gray-600 bg-gray-50 border border-gray-200";
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="border border-gray-200 rounded-xl p-6 space-y-4 bg-background">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order not found
          </h1>
          <Button onClick={() => router.push("/user/orders")}>
            Back to Orders
          </Button>
        </div>
      </Container>
    );
  }

  const calculateSubtotal = () => {
    return order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    const freeDeliveryThreshold = parseFloat(
      process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD || "999",
    );
    if (subtotal > freeDeliveryThreshold) return 0;
    return parseFloat(process.env.NEXT_PUBLIC_SHIPPING_COST || "15");
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(process.env.NEXT_PUBLIC_TAX_AMOUNT || "0");
    return subtotal * taxRate;
  };

  const handleDeleteOrder = async () => {
    if (!order || !auth_token) return;

    setDeleting(true);
    try {
      const result = await deleteOrder(order._id, auth_token);
      if (result.success) {
        toast.success("Order deleted successfully");
        router.push("/user/orders");
      } else {
        toast.error(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  const handlePayNow = async () => {
    if (!order || !authUser || !paymentGateway) {
      toast.error("Please select a payment method");
      return;
    }

    setShowPaymentConfirm(false); // Close the modal first
    setProcessingPayment(true);
    try {
      if (paymentGateway === "sslcommerz") {
        // Handle SSLCommerz payment
        const total = order.total;

        // Construct API URL correctly ensuring /api prefix exists
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const baseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

        const response = await fetch(`${baseUrl}/payments/sslcommerz/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth_token}`,
          },
          body: JSON.stringify({
            orderId: order._id,
            amount: total,
            currency: "BDT",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response:", text.substring(0, 200));
          throw new Error(
            "Server returned an invalid response. Please check your payment gateway configuration.",
          );
        }

        const data = await response.json();

        if (data.success && data.gatewayUrl) {
          // Redirect to SSLCommerz payment page
          window.location.href = data.gatewayUrl;
        } else {
          throw new Error(
            data.message || "Failed to initialize SSLCommerz payment",
          );
        }
        return;
      }

      // Stripe payment flow
      // Convert order items to Stripe format
      const stripeItems: StripeCheckoutItem[] = order.items.map((item) => ({
        name: item.name,
        description: `Quantity: ${item.quantity}`,
        amount: Math.round(item.price * 100),
        currency: "usd",
        quantity: item.quantity,
        images: item.image ? [item.image] : undefined,
      }));

      // Add shipping and tax
      const shipping = calculateShipping();
      const tax = calculateTax();

      if (shipping > 0) {
        stripeItems.push({
          name: "Shipping",
          description: "Standard shipping",
          amount: Math.round(shipping * 100),
          currency: "usd",
          quantity: 1,
        });
      }

      if (tax > 0) {
        stripeItems.push({
          name: "Tax",
          description: "Sales tax",
          amount: Math.round(tax * 100),
          currency: "usd",
          quantity: 1,
        });
      }

      const result = await createCheckoutSession({
        items: stripeItems,
        customerEmail: authUser?.email,
        successUrl: `${window.location.origin}/user/orders/${order._id}?success=true`,
        cancelUrl: `${window.location.origin}/user/orders/${order._id}`,
        metadata: {
          orderId: order._id,
          shippingAddress: JSON.stringify(order.shippingAddress),
        },
      });

      if ("url" in result && result.url) {
        await redirectToCheckout(result.url);
      } else if ("error" in result) {
        throw new Error(result.error);
      } else {
        throw new Error("Failed to get checkout session URL");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Helper function to render timeline steps
  const renderTimelineStep = (
    stepStatus: string,
    title: string,
    description: string,
    timestamp?: string,
    isCompleted: boolean = false,
    performedBy?: string,
  ) => {
    const isCurrent = order.status === stepStatus;

    return (
      <div className="relative flex items-start gap-4 pl-0">
        {/* Icon Circle */}
        <div
          className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isCompleted
              ? "bg-green-500 border-green-500"
              : isCurrent
                ? "bg-blue-500 border-blue-500 animate-pulse"
                : "bg-white border-gray-300"
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-white" />
          ) : isCurrent ? (
            <Clock className="h-5 w-5 text-white" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-2">
          <h3
            className={`font-semibold mb-1 ${
              isCompleted
                ? "text-green-700"
                : isCurrent
                  ? "text-blue-600"
                  : "text-gray-400"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm ${
              isCompleted || isCurrent ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {description}
          </p>
          {timestamp && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {performedBy && (
            <p className="text-xs text-gray-500 mt-1">By: {performedBy}</p>
          )}
          {isCurrent && !timestamp && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              In Progress
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Container className="py-8">
      {/* Success Message */}
      {success === "true" && order?.paymentStatus === "paid" && (
        <div className="bg-green-50 border border-primary/30 rounded-xl p-6 mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Successful!
              </h2>
              <p className="text-gray-700">
                Your order has been confirmed and is being processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/user/orders")}
        className="mb-6 pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      {/* Order Header */}
      <div className="bg-background border border-gray-200 rounded-xl p-6 lg:p-8 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 w-fit ${getStatusColor(
              order.paymentStatus || order.status,
            )}`}
          >
            {getStatusIcon(order.paymentStatus || order.status)}
            {getStatusText(order.paymentStatus || order.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-xl font-bold text-foreground">
              <PriceFormatter amount={order.total} />
            </p>
          </div>
          {order.paidAt && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Payment Date</p>
              <p className="font-semibold text-foreground">
                {new Date(order.paidAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {order.paymentStatus === "paid" && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Payment Method
              </p>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Card</span>
              </div>
            </div>
          )}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Items</p>
            <p className="font-semibold text-foreground">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-background border border-gray-200 rounded-xl p-6 lg:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-8">
          Order Progress
        </h2>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div
            className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200"
            style={
              {
                background:
                  "linear-gradient(to bottom, #10b981 0%, #10b981 calc(var(--progress) * 1%), #e5e7eb calc(var(--progress) * 1%), #e5e7eb 100%)",
                "--progress": (() => {
                  const statuses = [
                    "pending",
                    "address_confirmed",
                    "confirmed",
                    "packed",
                    "delivering",
                    "delivered",
                  ];
                  const cancelledStatuses = ["cancelled"];

                  if (cancelledStatuses.includes(order.status)) {
                    return 0;
                  }

                  // Treat 'completed' same as 'delivered' for customer view
                  const currentStatus =
                    order.status === "completed" ? "delivered" : order.status;
                  const currentIndex = statuses.indexOf(currentStatus);
                  if (currentIndex === -1) return 0;

                  const totalSteps = statuses.length - 1;
                  return (currentIndex / totalSteps) * 100;
                })(),
              } as React.CSSProperties
            }
          />

          <div className="space-y-6">
            {/* Pending */}
            {renderTimelineStep(
              "pending",
              "Order Placed",
              "Your order has been received",
              order.createdAt,
              [
                "pending",
                "address_confirmed",
                "confirmed",
                "packed",
                "delivering",
                "delivered",
                "completed",
              ].includes(order.status),
            )}

            {/* Address Confirmed */}
            {renderTimelineStep(
              "address_confirmed",
              "Address Confirmed",
              "Delivery address has been verified",
              order.status_updates?.address_confirmed?.timestamp,
              [
                "address_confirmed",
                "confirmed",
                "packed",
                "delivering",
                "delivered",
                "completed",
              ].includes(order.status),
            )}

            {/* Confirmed */}
            {renderTimelineStep(
              "confirmed",
              "Order Confirmed",
              "Your order has been confirmed",
              order.status_updates?.confirmed?.timestamp,
              [
                "confirmed",
                "packed",
                "delivering",
                "delivered",
                "completed",
              ].includes(order.status),
            )}

            {/* Payment Status - Special Step */}
            <div className="relative flex items-start gap-4 pl-0">
              {/* Icon Circle */}
              <div
                className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  order.paymentStatus === "paid"
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-red-500"
                }`}
              >
                {order.paymentStatus === "paid" ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <CreditCard className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${
                        order.paymentStatus === "paid"
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      Payment{" "}
                      {order.paymentStatus === "paid" ? "Completed" : "Pending"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.paymentStatus === "paid"
                        ? "Payment received successfully"
                        : "Payment is pending for this order"}
                    </p>
                    {order.paidAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.paidAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  {/* Pay Now Button */}
                  {order.paymentStatus !== "paid" && (
                    <Button
                      onClick={() => setShowPaymentConfirm(true)}
                      disabled={processingPayment}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3 mr-2" />
                          Pay Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Packed */}
            {renderTimelineStep(
              "packed",
              "Order Packed",
              "Your order has been packed and ready for shipment",
              order.status_updates?.packed?.timestamp,
              ["packed", "delivering", "delivered", "completed"].includes(
                order.status,
              ),
            )}

            {/* Delivering */}
            {renderTimelineStep(
              "delivering",
              "Out for Delivery",
              "Your order is on the way",
              order.status_updates?.delivering?.timestamp,
              ["delivering", "delivered", "completed"].includes(order.status),
              order.status_updates?.delivering?.by?.name,
            )}

            {/* Delivered */}
            {renderTimelineStep(
              "delivered",
              "Delivered",
              "Order has been delivered successfully",
              order.status_updates?.delivered?.timestamp,
              ["delivered", "completed"].includes(order.status),
            )}

            {/* Cancelled - Only show if order is cancelled */}
            {order.status === "cancelled" && (
              <div className="relative flex items-start gap-4 pl-0">
                <div className="relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-red-500 border-red-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="flex-1 pb-2">
                  <h3 className="font-semibold text-red-600 mb-1">
                    Order Cancelled
                  </h3>
                  <p className="text-sm text-gray-600">
                    This order has been cancelled
                  </p>
                  {order.status_updates?.cancelled?.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(
                        order.status_updates.cancelled.timestamp,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-background border border-gray-200 rounded-xl p-6 lg:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Order Items
        </h2>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-muted rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="relative h-20 w-20 bg-background rounded-lg overflow-hidden border border-gray-200 shrink-0">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1 truncate">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quantity: <span className="font-medium">{item.quantity}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <PriceFormatter amount={item.price} /> each
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  <PriceFormatter amount={item.price * item.quantity} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-background border border-gray-200 rounded-xl p-6 lg:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Delivery Address
        </h2>
        <div className="bg-muted p-5 rounded-lg">
          <div className="space-y-2 text-gray-700">
            <p className="font-semibold text-foreground text-lg">
              {order.shippingAddress.street}
            </p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.country}
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-background border border-gray-200 rounded-xl p-6 lg:p-8 mb-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Order Summary
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span className="font-medium">
              <PriceFormatter amount={calculateSubtotal()} />
            </span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Shipping</span>
            <span className="font-medium">
              {calculateShipping() === 0 ? (
                <span className="text-primary font-semibold">Free</span>
              ) : (
                <PriceFormatter amount={calculateShipping()} />
              )}
            </span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax</span>
            <span className="font-medium">
              <PriceFormatter amount={calculateTax()} />
            </span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between text-xl font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">
              <PriceFormatter amount={order.total} />
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        {/* Pay Now Button (for unpaid orders) */}
        {order.paymentStatus !== "paid" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                  {order.paymentStatus === "pending" ? (
                    <Banknote className="h-5 w-5 text-yellow-700" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-700" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Payment Pending
                  </h3>
                  <p className="text-sm text-gray-700">
                    {order.paymentStatus === "pending"
                      ? "This order is pending payment. You can pay now using your credit card."
                      : "Complete your payment to proceed with the order."}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowPaymentConfirm(true)}
                disabled={processingPayment}
                className="bg-primary hover:bg-primary/90 text-background w-full sm:w-auto whitespace-nowrap"
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/user/orders")}
            className="flex-1 border-gray-300 hover:border-primary hover:text-primary"
          >
            View All Orders
          </Button>
          <Button
            onClick={() => router.push("/shop")}
            className="flex-1 bg-primary hover:bg-primary/90 text-background"
          >
            Continue Shopping
          </Button>

          {/* Delete Button - User can delete their own orders */}
          {order.userId === authUser?._id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleting}
                  className="sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this order? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteOrder}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {deleting ? "Deleting..." : "Delete Order"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Payment Gateway Selection Dialog */}
      <PaymentGatewayDialog
        isOpen={showPaymentConfirm}
        onClose={() => {
          setShowPaymentConfirm(false);
          setPaymentGateway(null);
        }}
        orderTotal={order?.total || 0}
        selectedGateway={paymentGateway}
        onGatewaySelect={setPaymentGateway}
        onConfirm={handlePayNow}
        isProcessing={processingPayment}
      />
    </Container>
  );
};

export default OrderDetailsPage;
