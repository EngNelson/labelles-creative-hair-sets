"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "@/components/common/Container";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { AddressSelection } from "@/components/common/AddressSelection";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import PriceFormatter from "@/components/common/PriceFormatter";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Banknote,
} from "lucide-react";
import Image from "next/image";
import { getOrderById, type Order, createOrderFromCart } from "@/lib/orderApi";
import {
  createCheckoutSession,
  redirectToCheckout,
  type StripeCheckoutItem,
} from "@/lib/stripe";
import { useUserStore, useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { Address } from "@/lib/addressApi";

const CheckoutPageContent = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [paymentGateway, setPaymentGateway] = useState<
    "stripe" | "sslcommerz" | null
  >(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { auth_token, authUser, isAuthenticated, verifyAuth } = useUserStore();
  const { cartItemsWithQuantities, clearCart } = useCartStore();

  const orderId = searchParams.get("orderId");

  // Verify authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      if (auth_token && !authUser) {
        await verifyAuth();
      }

      setAuthLoading(false);
    };

    checkAuth();
  }, [auth_token, authUser, verifyAuth]);

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !authUser || !auth_token) {
      router.push("/auth/signin");
      return;
    }

    // Refresh user profile to get latest addresses (especially important for mobile-web sync)
    const refreshUserProfile = async () => {
      try {
        await verifyAuth();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    };

    refreshUserProfile();
  }, [authLoading, isAuthenticated, authUser, auth_token, router, verifyAuth]);

  // Separate effect to handle address loading after profile refresh
  useEffect(() => {
    if (!authUser || authLoading) {
      return;
    }

    // Load user addresses
    if (authUser.addresses && authUser.addresses.length > 0) {
      setAddresses(authUser.addresses);
      // Auto-select address logic
      if (authUser.addresses.length === 1) {
        // If only one address, select it automatically
        setSelectedAddress(authUser.addresses[0]);
      } else {
        // If multiple addresses, prefer default address
        const defaultAddress = authUser.addresses.find(
          (addr: Address) => addr.isDefault,
        );
        setSelectedAddress(defaultAddress || authUser.addresses[0]);
      }
    }

    const initializeCheckout = async () => {
      setLoading(true);
      try {
        if (orderId && auth_token) {
          // If orderId is provided, load existing order
          const orderData = await getOrderById(orderId, auth_token);
          if (orderData) {
            setOrder(orderData);
          } else {
            toast.error("Order not found");
            router.push("/user/cart");
          }
        } else {
          // If no orderId, check if we have cart items
          // Don't show error if cart is empty - it might have been cleared after order creation
          if (cartItemsWithQuantities.length === 0 && !orderId) {
            // Only redirect if we're sure there's no pending order
            // Don't show toast here as it might be after successful order
            router.push("/user/cart");
            return;
          }

          // Create a temporary order object for display
          const tempOrder: Order = {
            _id: "temp",
            userId: authUser._id,
            items: cartItemsWithQuantities.map((item) => ({
              productId: item.product._id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              image: item.product.images?.[0] || item.product.image,
            })),
            total: cartItemsWithQuantities.reduce(
              (total, item) => total + item.product.price * item.quantity,
              0,
            ),
            status: "pending",
            shippingAddress: {
              street: "",
              city: "",
              state: "",
              country: "",
              postalCode: "",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setOrder(tempOrder);
        }
      } catch (error) {
        console.error("Error initializing checkout:", error);
        toast.error("Failed to load checkout details");
        router.push("/user/cart");
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [
    orderId,
    auth_token,
    router,
    isAuthenticated,
    authUser,
    authLoading,
    cartItemsWithQuantities,
  ]);

  const handleAddressesUpdate = (updatedAddresses: Address[]) => {
    setAddresses(updatedAddresses);

    // Auto-select address logic
    if (updatedAddresses.length === 1) {
      // If only one address, select it automatically
      setSelectedAddress(updatedAddresses[0]);
    } else if (updatedAddresses.length > 1) {
      // If multiple addresses, prefer default or keep current selection
      const defaultAddress = updatedAddresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else if (
        !selectedAddress ||
        !updatedAddresses.find((addr) => addr._id === selectedAddress._id)
      ) {
        // If no default and current selection is invalid, select first
        setSelectedAddress(updatedAddresses[0]);
      }
    } else {
      // No addresses, clear selection
      setSelectedAddress(null);
    }
  };

  const calculateSubtotal = () => {
    if (!order) return 0;
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

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  const handleCardPayment = async (gateway: "stripe" | "sslcommerz") => {
    if (!order) return;

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    setProcessing(true);
    try {
      let finalOrder = order;

      // If this is a temporary order (from cart), create the actual order first
      if (order._id === "temp") {
        setIsCreatingOrder(true);
        const orderItems = cartItemsWithQuantities.map((item) => ({
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images?.[0] || item.product.image,
        }));

        const response = await createOrderFromCart(
          auth_token!,
          orderItems,
          selectedAddress,
        );

        if (!response.success || !response.order) {
          console.error("❌ Order creation failed:", response);
          throw new Error(response.message || "Failed to create order");
        }

        finalOrder = response.order;
        setOrder(finalOrder);

        // Only clear cart for Stripe payment
        // For SSLCommerz, cart will be cleared after successful payment confirmation
        if (gateway === "stripe") {
          await clearCart();
        }
        setIsCreatingOrder(false);
      }

      if (gateway === "sslcommerz") {
        // Handle SSLCommerz payment
        const total = calculateTotal();

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
            orderId: finalOrder._id,
            amount: total,
            currency: "BDT",
          }),
        });

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

      // Convert order items to Stripe format
      const stripeItems: StripeCheckoutItem[] = finalOrder.items.map(
        (item) => ({
          name: item.name,
          description: `Quantity: ${item.quantity}`,
          amount: Math.round(item.price * 100), // Convert to cents
          currency: "usd",
          quantity: item.quantity,
          images: item.image ? [item.image] : undefined,
        }),
      );

      // Add shipping and tax as separate line items if applicable
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

      // Create checkout session

      const result = await createCheckoutSession({
        items: stripeItems,
        customerEmail: authUser?.email,
        successUrl: `${window.location.origin}/success?orderId=${finalOrder._id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/user/orders/${finalOrder._id}`,
        metadata: {
          orderId: finalOrder._id,
          shippingAddress: JSON.stringify(selectedAddress),
        },
      });

      if ("url" in result && result.url) {
        // Redirect to Stripe Checkout using the session URL
        await redirectToCheckout(result.url);
      } else if ("error" in result) {
        throw new Error(result.error);
      } else {
        throw new Error("Failed to get checkout session URL");
      }
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again.";
      console.error("Error message:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setIsCreatingOrder(false);
    }
  };

  const handleCODOrder = async () => {
    if (!order) return;

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    setProcessing(true);
    setIsCreatingOrder(true);
    try {
      const orderItems = cartItemsWithQuantities.map((item) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || item.product.image,
      }));

      const response = await createOrderFromCart(
        auth_token!,
        orderItems,
        selectedAddress,
      );

      if (!response.success || !response.order) {
        console.error("❌ COD Order failed:", response);
        throw new Error(response.message || "Failed to create order");
      }

      // Clear cart after successful order creation
      await clearCart();

      // Show success message
      toast.success("Order placed successfully with Cash on Delivery!");

      // Redirect to order details page
      router.push(`/user/orders/${response.order._id}`);
    } catch (error) {
      console.error("❌ Error creating COD order:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again.";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setIsCreatingOrder(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "cod") {
      handleCODOrder();
    } else if (paymentMethod === "card") {
      if (!paymentGateway) {
        toast.error("Please select a payment gateway");
        return;
      }
      handleCardPayment(paymentGateway);
    }
  };

  if (loading || authLoading) {
    return (
      <Container className="py-8">
        {/* Breadcrumb Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <span>/</span>
              <Skeleton className="h-4 w-8" />
              <span>/</span>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Title Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-2" />
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <Skeleton className="h-6 w-24 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full mt-6" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The order you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/cart")}>Return to Cart</Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Breadcrumb */}
      <PageBreadcrumb
        items={[{ label: "Cart", href: "/cart" }]}
        currentPage="Checkout"
        showSocialShare={false}
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">Complete your order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <AddressSelection
            selectedAddress={selectedAddress}
            onAddressSelect={setSelectedAddress}
            addresses={addresses}
            onAddressesUpdate={handleAddressesUpdate}
          />

          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Order Details
            </h2>

            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index.toString()}
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg"
                >
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} ×{" "}
                      <PriceFormatter amount={item.price} />
                    </p>
                  </div>

                  <div className="text-right">
                    <PriceFormatter
                      amount={item.price * item.quantity}
                      className="text-base font-semibold text-gray-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Subtotal</span>
                <PriceFormatter
                  amount={calculateSubtotal()}
                  className="text-base font-medium text-gray-900"
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Shipping</span>
                <span className="text-base font-medium">
                  {calculateShipping() === 0 ? (
                    <span className="text-green-600">Free shipping</span>
                  ) : (
                    <PriceFormatter
                      amount={calculateShipping()}
                      className="text-base font-medium text-gray-900"
                    />
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Tax</span>
                <PriceFormatter
                  amount={calculateTax()}
                  className="text-base font-medium text-gray-900"
                />
              </div>

              {calculateShipping() === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-medium">
                    🎉 You qualify for free shipping!
                  </p>
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <PriceFormatter
                  amount={calculateTotal()}
                  className="text-xl font-bold text-gray-900"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Select Payment Method
              </h3>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value as "card" | "cod");
                  if (value === "card") {
                    setPaymentGateway(null); // Reset gateway when switching to card
                  }
                }}
                className="space-y-3"
              >
                {/* Card Payment */}
                <div className="space-y-2">
                  <div
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <RadioGroupItem value="card" id="card-payment" />
                    <CreditCard
                      className={`w-4 h-4 ${
                        paymentMethod === "card"
                          ? "text-primary"
                          : "text-gray-600"
                      }`}
                    />
                    <Label
                      htmlFor="card-payment"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm text-foreground">
                        Card Payment
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pay securely online
                      </div>
                    </Label>
                    {paymentMethod === "card" && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Payment Gateway Selection - shows when card is selected */}
                  {paymentMethod === "card" && (
                    <div className="ml-8 space-y-2">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Choose Payment Gateway:
                      </p>
                      <div className="space-y-2">
                        <div
                          className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-all ${
                            paymentGateway === "stripe"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setPaymentGateway("stripe")}
                        >
                          <input
                            type="radio"
                            checked={paymentGateway === "stripe"}
                            onChange={() => setPaymentGateway("stripe")}
                            className="w-3 h-3"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium">Stripe</div>
                            <div className="text-[10px] text-gray-500">
                              International cards (USD)
                            </div>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-all ${
                            paymentGateway === "sslcommerz"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setPaymentGateway("sslcommerz")}
                        >
                          <input
                            type="radio"
                            checked={paymentGateway === "sslcommerz"}
                            onChange={() => setPaymentGateway("sslcommerz")}
                            className="w-3 h-3"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-medium">
                              SSLCommerz
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Bangladesh local payment (BDT)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery */}
                <div
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <RadioGroupItem value="cod" id="cod-payment" />
                  <Banknote
                    className={`w-4 h-4 ${
                      paymentMethod === "cod" ? "text-primary" : "text-gray-600"
                    }`}
                  />
                  <Label
                    htmlFor="cod-payment"
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium text-sm text-foreground">
                      Cash on Delivery
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pay when you receive
                    </div>
                  </Label>
                  {paymentMethod === "cod" && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
              </RadioGroup>
            </div>

            <Button
              size="lg"
              onClick={handlePlaceOrder}
              disabled={
                processing ||
                isCreatingOrder ||
                !selectedAddress ||
                (paymentMethod === "card" && !paymentGateway)
              }
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-background rounded-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : isCreatingOrder ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Placing Order...
                </>
              ) : !selectedAddress ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Select Address to Continue
                </>
              ) : paymentMethod === "card" && !paymentGateway ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Select Payment Gateway
                </>
              ) : paymentMethod === "cod" ? (
                <>
                  <Banknote className="w-4 h-4 mr-2" />
                  Place Order (Cash on Delivery)
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                {paymentMethod === "card"
                  ? paymentGateway === "stripe"
                    ? "Secure checkout • SSL encrypted • Powered by Stripe"
                    : paymentGateway === "sslcommerz"
                      ? "Secure checkout • SSL encrypted • Powered by SSLCommerz"
                      : "Select a payment gateway to continue"
                  : "Pay cash when your order arrives at your doorstep"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

const CheckoutPage = () => {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </Container>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
};

export default CheckoutPage;
