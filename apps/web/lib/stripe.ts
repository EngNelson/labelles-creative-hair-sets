import { loadStripe } from "@stripe/stripe-js";

// This should be your Stripe publishable key
const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51RiuD8Rc67sBILFSSng3amDBhywiAunsJR0P1WlA1kOpdDJMW6WQH7jcceNLTvYjgEpMF2RVLpKziOQIeabB6A5G00XIBzI3wl";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
export const stripePromise = loadStripe(stripePublishableKey);

export interface StripeCheckoutItem {
  name: string;
  description?: string;
  amount: number; // in cents
  currency: string;
  quantity: number;
  images?: string[];
}

export interface CheckoutSessionRequest {
  items: StripeCheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

// Create a checkout session
export const createCheckoutSession = async (
  data: CheckoutSessionRequest
): Promise<{ sessionId: string; url: string } | { error: string }> => {
  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Redirect to Stripe Checkout using modern approach
export const redirectToCheckout = async (sessionUrl: string) => {
  // Modern approach: Direct redirect using session URL
  window.location.href = sessionUrl;
};
