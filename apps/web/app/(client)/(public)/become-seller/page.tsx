import Container from "@/components/common/Container";
import Link from "next/link";
import { cookies } from "next/headers";
import { LogIn, ShieldAlert } from "lucide-react";
import SellerApplicationForm from "./SellerApplicationForm";
import SellerDisabled from "@/components/seller/SellerDisabled";
import { getSellerConfig, canRegisterAsSeller } from "@/lib/sellerConfig";
import BecomeSellerAuthRequired from "./BecomeSellerAuthRequired";

export const dynamic = "force-dynamic";
export default async function BecomeSellerPage() {
  // Check seller system configuration
  const sellerConfig = await getSellerConfig();
  const canRegister = canRegisterAsSeller(sellerConfig);

  // If seller system is disabled or registration not allowed, show disabled message
  if (!canRegister) {
    return <SellerDisabled />;
  }

  // Check if user is authenticated by checking for auth_token cookie
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  const isAuthenticated = !!authToken;

  // If user is not authenticated, show login required message
  if (!isAuthenticated) {
    return <BecomeSellerAuthRequired />;
  }

  // Fetch seller status server-side
  let initialSellerStatus = null;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/me`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store", // Ensure fresh data on every request
      },
    );

    if (response.ok) {
      const result = await response.json();
      initialSellerStatus = result.data;
    }
  } catch (error) {
    console.error("Failed to fetch seller status during SSR:", error);
  }

  // If already approved, we can redirect or let the form component handle displaying the approved message
  // We'll pass the initial status to the client component to handle rendering
  return <SellerApplicationForm initialSellerStatus={initialSellerStatus} />;
}
