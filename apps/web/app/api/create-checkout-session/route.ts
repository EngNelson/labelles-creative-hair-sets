import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil",
});

interface CheckoutItem {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  quantity: number;
  images?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { items, successUrl, cancelUrl, customerEmail, metadata } =
      await request.json();

    // Create line items for Stripe
    const lineItems = items.map((item: CheckoutItem) => ({
      price_data: {
        currency: item.currency || "usd",
        product_data: {
          name: item.name,
          description: item.description,
          images: item.images || [],
        },
        unit_amount: item.amount, // amount in cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: metadata || {},
      // Address collection disabled since we collect shipping address on checkout page
      billing_address_collection: "auto", // Only collect billing address if needed for payment method
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
