import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover"
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    if (!sig) {
      console.error("No Stripe signature found");
      return NextResponse.json(
        { error: "No Stripe signature found" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook error: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        // Get the order ID from metadata
        const orderId = session.metadata?.orderId;

        if (orderId) {
          try {
            // Update the order status to "paid" in your backend
            const response = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
              }/orders/${orderId}/webhook-status`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "paid",
                  paymentIntentId: session.payment_intent,
                  stripeSessionId: session.id,
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Failed to update order status: ${response.status} ${response.statusText} - ${errorText}`
              );
            }

            const result = await response.json();

          } catch (error) {
            console.error(`Webhook: Error updating order ${orderId}:`, error);
            // Don't return an error to Stripe, as the payment was successful
            // We can handle this in a different way (retry mechanism, admin notification, etc.)
          }
        } else {
          console.error("Webhook: No orderId found in Stripe session metadata");
        }
        break;

      case "payment_intent.succeeded":
        // Handle successful payment if needed
        break;

      case "payment_intent.payment_failed":
        // Handle failed payment if needed
        break;

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
