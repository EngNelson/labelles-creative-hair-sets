import { Suspense } from "react";
import { cookies } from "next/headers";
import { getAuthToken } from "@/lib/serverAuth";
import type { Order } from "@/lib/orderApi";
import SuccessPageClient from "@/components/pages/SuccessPageClient";
import { SuccessPageSkeleton } from "@/components/skeleton";

/**
 * Fetch order server-side using the auth token from cookies.
 * Falls back gracefully — the client component will handle the
 * Stripe payment-status update and cart-clearing.
 */
async function fetchOrderServer(
  orderId: string,
  token: string,
): Promise<Order | null> {
  try {
    const apiUrl =
      process.env.API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    const base = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
    const res = await fetch(`${base}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    // The API may return { order: {...} } or the order directly
    return (data.order ?? data) as Order;
  } catch {
    return null;
  }
}

interface Props {
  searchParams: Promise<{
    orderId?: string;
    session_id?: string;
    payment?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.orderId;

  let initialOrder: Order | null = null;

  if (orderId) {
    const token = await getAuthToken();
    if (token) {
      initialOrder = await fetchOrderServer(orderId, token);
    }
  }

  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <SuccessPageClient initialOrder={initialOrder} />
    </Suspense>
  );
}
